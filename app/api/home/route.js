import { NextResponse } from "next/server";
import pool from "../../src/lib/db";

function getYearRange(year) {
  if (!year || year === "All") return null;

  const start = Number(year.replace("s", ""));

  return {
    start,
    end: start + 9,
  };
}

async function getMovies(tableName, mood, genre, year) {
  const yearRange = getYearRange(year);
  const params = [];

  let query = `
    SELECT 
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      GROUP_CONCAT(DISTINCT g.genre_name) AS genre,
      GROUP_CONCAT(DISTINCT CONCAT(sp.platform_name, '|', sp.logo_url)) AS platforms
    FROM ${tableName} rm
    JOIN movies m ON rm.movie_id = m.movie_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    LEFT JOIN movie_moods mm ON m.movie_id = mm.movie_id
    LEFT JOIN moods mo ON mm.mood_id = mo.mood_id
    LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
    LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id
    WHERE 1 = 1
  `;

  if (genre !== "All") {
    query += " AND g.genre_name = ?";
    params.push(genre);
  }

  if (mood !== "All") {
    query += " AND mo.mood_name = ?";
    params.push(mood);
  }

  if (yearRange) {
    query += " AND m.release_year BETWEEN ? AND ?";
    params.push(yearRange.start, yearRange.end);
  }

  query += `
    GROUP BY 
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url
  `;

  const [movies] = await pool.query(query, params);
  return movies;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mood = searchParams.get("mood") || "All";
  const genre = searchParams.get("genre") || "All";
  const year = searchParams.get("year") || "All";

  const watchlist = await getMovies("watchlist", "All", "All", "All");
  const recommended = await getMovies("recommended_movies", mood, genre, year);
  const trending = await getMovies("trending_movies", mood, genre, year);

  return NextResponse.json({
    watchlist,
    recommended,
    trending,
  });
}