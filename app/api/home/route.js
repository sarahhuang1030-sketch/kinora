import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  const commonSelect = `
    m.movie_id,
    m.title,
    m.release_year,
    m.poster_url,
    COALESCE(GROUP_CONCAT(DISTINCT g.genre_name SEPARATOR ', '), 'Unknown') AS genre,
    GROUP_CONCAT(
      DISTINCT CONCAT(sp.platform_name, '|', sp.logo_url)
      SEPARATOR ','
    ) AS platforms
  `;

  const [recommended] = await pool.query(`
    SELECT
      ${commonSelect},
      rm.recommendation_score
    FROM recommended_movies rm
    JOIN movies m ON rm.movie_id = m.movie_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
    LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id
    GROUP BY m.movie_id, m.title, m.release_year, m.poster_url, rm.recommendation_score
    ORDER BY rm.recommendation_score DESC
    LIMIT 10
  `);

  const [trending] = await pool.query(`
    SELECT
      ${commonSelect},
      tm.trend_score
    FROM trending_movies tm
    JOIN movies m ON tm.movie_id = m.movie_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
    LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id
    GROUP BY m.movie_id, m.title, m.release_year, m.poster_url, tm.trend_score
    ORDER BY tm.trend_score DESC
    LIMIT 10
  `);

  const [watchlist] = await pool.query(`
    SELECT
      ${commonSelect}
    FROM watchlist w
    JOIN movies m ON w.movie_id = m.movie_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
    LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id
    GROUP BY m.movie_id, m.title, m.release_year, m.poster_url
    LIMIT 5
  `);

  return NextResponse.json({
    recommended,
    trending,
    watchlist,
  });
}