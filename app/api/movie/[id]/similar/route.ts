import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import { RowDataPacket } from "mysql2";

type SimilarMovieRow = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  content_type: string | null;
  broadcaster: string | null;
  genres: string | null;
  matching_genre_count: number;
  matching_mood_count: number;
};

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<SimilarMovieRow[]>(
      `
        SELECT
          m.movie_id,
          m.title,
          m.description,
          m.release_year,
          m.duration_minutes,
          m.poster_url,
          m.portrait_url,
          m.broadcaster,

          ct.type_name AS content_type,

          GROUP_CONCAT(
            DISTINCT g.genre_name
            ORDER BY g.genre_name
            SEPARATOR ', '
          ) AS genres,

          COUNT(
            DISTINCT matching_genres.genre_id
          ) AS matching_genre_count,

          COUNT(
            DISTINCT matching_moods.mood_id
          ) AS matching_mood_count

        FROM movies m

        LEFT JOIN content_types ct
          ON m.content_type_id = ct.content_type_id

        LEFT JOIN movie_genres mg
          ON m.movie_id = mg.movie_id

        LEFT JOIN genres g
          ON mg.genre_id = g.genre_id

        LEFT JOIN movie_genres matching_genres
          ON matching_genres.movie_id = m.movie_id
          AND matching_genres.genre_id IN (
            SELECT source_genres.genre_id
            FROM movie_genres source_genres
            WHERE source_genres.movie_id = ?
          )

        LEFT JOIN movie_moods matching_moods
          ON matching_moods.movie_id = m.movie_id
          AND matching_moods.mood_id IN (
            SELECT source_moods.mood_id
            FROM movie_moods source_moods
            WHERE source_moods.movie_id = ?
          )

        WHERE m.movie_id != ?

        GROUP BY
          m.movie_id,
          m.title,
          m.description,
          m.release_year,
          m.duration_minutes,
          m.poster_url,
          m.portrait_url,
          m.broadcaster,
          ct.type_name

        HAVING
          matching_genre_count > 0
          OR matching_mood_count > 0

        ORDER BY
          matching_genre_count DESC,
          matching_mood_count DESC,
          m.release_year DESC,
          m.movie_id DESC

        LIMIT 3
      `,
      [movieId, movieId, movieId]
    );

    return NextResponse.json(
      rows.map((movie) => {
        const matchScore =
          Number(movie.matching_genre_count) * 2 +
          Number(movie.matching_mood_count);

        return {
          movie_id: movie.movie_id,
          title: movie.title,
          description: movie.description,
          release_year: movie.release_year,
          duration_minutes: movie.duration_minutes,
          poster_url: movie.poster_url,
          portrait_url: movie.portrait_url,
          content_type: movie.content_type,
          broadcaster: movie.broadcaster,

          genres: movie.genres
            ? movie.genres
                .split(",")
                .map((genre) => genre.trim())
                .filter(Boolean)
            : [],

          match_score: matchScore,
        };
      })
    );
  } catch (error) {
    console.error("Similar movies error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch similar movies.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}