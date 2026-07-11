import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import pool from '@/app/src/lib/db';

type MovieRow = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  trailer_url: string | null;
  content_type: string | null;
  genres: string | null;
  moods: string | null;
  platforms: string | null;
};

type MoodRow = RowDataPacket & {
  mood_id: number;
  mood_name: string;
  icon_url: string | null;
};

function splitValues(value: string | null) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    /*
      This query follows your current database naming:

      movies.duration_minutes
      content_types.type_name
      genres.genre_name
      moods.mood_name
      streaming_platforms.platform_name

      poster_url is used for horizontal/landscape artwork.
      portrait_url is used for vertical card artwork.
    */
    const [movieRows] = await pool.query<MovieRow[]>(
      `
        SELECT
          m.movie_id,
          m.title,
          m.description,
          m.release_year,
          m.duration_minutes,
          m.poster_url,
          m.portrait_url,
          m.trailer_url,
          ct.type_name AS content_type,

          GROUP_CONCAT(
            DISTINCT g.genre_name
            ORDER BY g.genre_name
            SEPARATOR ', '
          ) AS genres,

          GROUP_CONCAT(
            DISTINCT mo.mood_name
            ORDER BY mo.mood_name
            SEPARATOR ', '
          ) AS moods,

          GROUP_CONCAT(
            DISTINCT sp.platform_name
            ORDER BY sp.platform_name
            SEPARATOR ', '
          ) AS platforms

        FROM movies m

        LEFT JOIN content_types ct
          ON m.content_type_id = ct.content_type_id

        LEFT JOIN movie_genres mg
          ON m.movie_id = mg.movie_id

        LEFT JOIN genres g
          ON mg.genre_id = g.genre_id

        LEFT JOIN movie_moods mm
          ON m.movie_id = mm.movie_id

        LEFT JOIN moods mo
          ON mm.mood_id = mo.mood_id

        LEFT JOIN movie_platforms mp
          ON m.movie_id = mp.movie_id

        LEFT JOIN streaming_platforms sp
          ON mp.platform_id = sp.platform_id

        GROUP BY
          m.movie_id,
          m.title,
          m.description,
          m.release_year,
          m.duration_minutes,
          m.poster_url,
          m.portrait_url,
          m.trailer_url,
          ct.type_name

        ORDER BY m.title ASC
      `
    );

    const movies = movieRows.map((movie) => ({
      movie_id: Number(movie.movie_id),
      title: movie.title,
      description: movie.description,
      release_year:
        movie.release_year === null ? null : Number(movie.release_year),
      duration_minutes:
        movie.duration_minutes === null
          ? null
          : Number(movie.duration_minutes),
      poster_url: movie.poster_url,
      portrait_url: movie.portrait_url,
      trailer_url: movie.trailer_url,
      content_type: movie.content_type,
      genres: movie.genres,
      moods: movie.moods,
      platforms: movie.platforms,
    }));

    const [moodRows] = await pool.query<MoodRow[]>(
      `
        SELECT
          mood_id,
          mood_name,
          icon_url
        FROM moods
        WHERE mood_name <> 'Surprise Me'
        ORDER BY mood_id ASC
      `
    );

    /*
      The featured movie is chosen in JavaScript rather than with ORDER BY RAND()
      so the main movie query only needs to run once.
    */
    const featured =
      movies.length > 0
        ? movies[Math.floor(Math.random() * movies.length)]
        : null;

    const collections = moodRows
      .map((mood) => {
        const collectionMovies = movies
          .filter((movie) =>
            splitValues(movie.moods).includes(mood.mood_name)
          )
          .slice(0, 12);

        return {
          mood_id: Number(mood.mood_id),
          mood_name: mood.mood_name,
          icon_url: mood.icon_url,
          movies: collectionMovies,
        };
      })
      .filter((collection) => collection.movies.length > 0)
      .slice(0, 5);

    return NextResponse.json(
      {
        featured,
        collections,
        movies,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Discover API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to load the Discover page.',
      },
      {
        status: 500,
      }
    );
  }
}
