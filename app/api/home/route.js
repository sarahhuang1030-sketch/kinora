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

async function getMoviesBasedOnWatchHistory(userId, mood, genre, year) {
  const yearRange = getYearRange(year);
  const params = [userId];

  let query = `
    SELECT DISTINCT
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      m.duration_minutes,
      ct.type_name AS content_type,
      CONCAT(
        FLOOR(m.duration_minutes / 60),
        'h ',
        MOD(m.duration_minutes, 60),
        'm'
      ) AS duration,
      GROUP_CONCAT(DISTINCT g.genre_name) AS genre,
      GROUP_CONCAT(DISTINCT mo.mood_name) AS mood,
      GROUP_CONCAT(DISTINCT CONCAT(sp.platform_name, '|', sp.logo_url)) AS platforms
    FROM movies m

    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id

    LEFT JOIN movie_moods mm ON m.movie_id = mm.movie_id
    LEFT JOIN moods mo ON mm.mood_id = mo.mood_id

    LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
    LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id

    LEFT JOIN content_types ct ON m.content_type_id = ct.content_type_id

    WHERE m.movie_id NOT IN (
      SELECT movie_id
      FROM user_watch_history
      WHERE user_id = ?
    )
  `;

  if (genre !== "All") {
    query += " AND g.genre_name = ?";
    params.push(genre);
  }

  if (mood !== "All") {
    query += " AND LOWER(TRIM(mo.mood_name)) = LOWER(TRIM(?))";
    params.push(mood);
  }

  if (yearRange) {
    query += " AND m.release_year BETWEEN ? AND ?";
    params.push(yearRange.start, yearRange.end);
  }

  query += `
    AND g.genre_id IN (
      SELECT DISTINCT mg2.genre_id
      FROM user_watch_history uwh
      JOIN movie_genres mg2 ON uwh.movie_id = mg2.movie_id
      WHERE uwh.user_id = ?
    )
  `;

  params.push(userId);

  query += `
    GROUP BY
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      m.duration_minutes,
      ct.type_name
    LIMIT 12
  `;

  const [movies] = await pool.query(query, params);
  return movies;
}

async function getCategoryMovies(categoryColumn) {
  const [movies] = await pool.query(`
    SELECT 
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      m.duration_minutes,
      ct.type_name AS content_type,
      GROUP_CONCAT(DISTINCT g.genre_name) AS genre,
      GROUP_CONCAT(DISTINCT mo.mood_name) AS mood,
      GROUP_CONCAT(DISTINCT CONCAT(sp.platform_name, '|', sp.logo_url)) AS platforms,
      CONCAT(
        FLOOR(m.duration_minutes / 60),
        'h ',
        MOD(m.duration_minutes, 60),
        'm'
      ) AS duration
    FROM movies m
    LEFT JOIN content_types ct ON m.content_type_id = ct.content_type_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    LEFT JOIN movie_moods mm ON m.movie_id = mm.movie_id
    LEFT JOIN moods mo ON mm.mood_id = mo.mood_id
    LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
    LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id
    WHERE m.${categoryColumn} = 1
    GROUP BY 
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      m.duration_minutes,
      ct.type_name
    LIMIT 12
  `);

  return movies;
}


async function getFilteredMovies(mood, genre, year, platform, duration) {
  const yearRange = getYearRange(year);
  const params = [];

  let query = `
    SELECT 
  m.movie_id,
  m.title,
  m.description,
  m.release_year,
  m.poster_url,
  m.duration_minutes,
  ct.type_name AS content_type,
  rm.recommendation_score,
  rm.recommendation_reason,
  GROUP_CONCAT(DISTINCT g.genre_name) AS genre,
  GROUP_CONCAT(DISTINCT mo.mood_name) AS mood,
  GROUP_CONCAT(DISTINCT CONCAT(sp.platform_name, '|', sp.logo_url)) AS platforms,
  CONCAT(
    FLOOR(m.duration_minutes / 60),
    'h ',
    MOD(m.duration_minutes, 60),
    'm'
  ) AS duration
FROM movies m
LEFT JOIN content_types ct ON m.content_type_id = ct.content_type_id
LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.genre_id
LEFT JOIN movie_moods mm ON m.movie_id = mm.movie_id
LEFT JOIN moods mo ON mm.mood_id = mo.mood_id
LEFT JOIN movie_platforms mp ON m.movie_id = mp.movie_id
LEFT JOIN streaming_platforms sp ON mp.platform_id = sp.platform_id
LEFT JOIN recommended_movies rm ON m.movie_id = rm.movie_id
WHERE 1 = 1
  `;

  
 if (platform !== "All") {
  query += " AND sp.platform_name = ?";
  params.push(platform);
}


if (duration === "short") {
  query += " AND m.duration_minutes < 90";
}

if (duration === "medium") {
  query += " AND m.duration_minutes BETWEEN 90 AND 120";
}

if (duration === "long") {
  query += " AND m.duration_minutes > 120";
}

  if (mood !== "All") {
    query += " AND LOWER(TRIM(mo.mood_name)) = LOWER(TRIM(?))";
    params.push(mood);
  }

  if (genre !== "All") {
    query += " AND g.genre_name = ?";
    params.push(genre);
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
  m.poster_url,
  m.duration_minutes,
  ct.type_name,
  rm.recommendation_score,
  rm.recommendation_reason
  `;

  console.log("MOOD:", mood);
  console.log("QUERY:", query);
  console.log("PARAMS:", params);

  const [movies] = await pool.query(query, params);

  console.log("MOVIES FOUND:", movies.length);
  return movies;
}


export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mood = searchParams.get("mood") || "All";
  const genre = searchParams.get("genre") || "All";
  const year = searchParams.get("year") || "All";
  const userId = searchParams.get("userId");
  const platform = searchParams.get("platform") || "All";
  const duration = searchParams.get("duration") || "All";

  const hasFilters =
  mood !== "All" ||
  genre !== "All" ||
  year !== "All" ||
  platform !== "All" ||
  duration !== "All";


  const watchlist = await getCategoryMovies("is_wishlist");

//   const recommended = await getMoviesByCategory(
//   "is_recommended",
//   mood,
//   genre,
//   year,
//   platform,
//   duration
// );
const recommended = hasFilters
  ? await getFilteredMovies(mood, genre, year, platform, duration)
  : await getCategoryMovies("is_recommended");


  const trending = await getCategoryMovies("is_trending");

  return NextResponse.json({
    watchlist,
    recommended,
    trending,
  });
}