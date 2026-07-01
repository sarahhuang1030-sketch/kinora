import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = Number(id);

    if (!movieId) {
      return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        m.movie_id,
        m.title,
        m.description,
        m.release_year,
        m.duration,
        ct.name AS content_type,
        GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') AS platforms,
        GROUP_CONCAT(DISTINCT mo.name SEPARATOR ', ') AS moods,

        (
          COUNT(DISTINCT matching_genres.genre_id) * 2 +
          COUNT(DISTINCT matching_moods.mood_id)
        ) AS match_score

      FROM movies m

      LEFT JOIN content_types ct 
        ON m.content_type_id = ct.content_type_id

      LEFT JOIN movie_platforms mp 
        ON m.movie_id = mp.movie_id
      LEFT JOIN platforms p 
        ON mp.platform_id = p.platform_id

      LEFT JOIN movie_moods mm 
        ON m.movie_id = mm.movie_id
      LEFT JOIN moods mo 
        ON mm.mood_id = mo.mood_id

      LEFT JOIN movie_genres matching_genres
        ON m.movie_id = matching_genres.movie_id
        AND matching_genres.genre_id IN (
          SELECT genre_id FROM movie_genres WHERE movie_id = ?
        )

      LEFT JOIN movie_moods matching_moods
        ON m.movie_id = matching_moods.movie_id
        AND matching_moods.mood_id IN (
          SELECT mood_id FROM movie_moods WHERE movie_id = ?
        )

      WHERE m.movie_id != ?

      GROUP BY 
        m.movie_id,
        m.title,
        m.description,
        m.release_year,
        m.duration,
        ct.name

      HAVING match_score > 0

      ORDER BY match_score DESC, m.release_year DESC

      LIMIT 6
      `,
      [movieId, movieId, movieId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Similar movies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar movies" },
      { status: 500 }
    );
  }
}