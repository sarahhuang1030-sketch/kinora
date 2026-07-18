import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import { RowDataPacket } from "mysql2";

type MovieRow = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  trailer_url: string | null;
  content_type_id: number | null;
  source: string | null;
  author: string | null;
  performers: string | null;
  broadcaster: string | null;
  logo_url: string | null;
};

type GenreRow = RowDataPacket & {
  genre_name: string;
};

type MoodRow = RowDataPacket & {
  mood_name: string;
};

function getContentTypeName(
  contentTypeId: number | null
) {
  switch (contentTypeId) {
    case 1:
      return "Movie";

    case 2:
      return "TV Series";

    case 4:
      return "Limited Series";

    default:
      return "Movie";
  }
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;
    const movieId = Number(id);

    if (
      !Number.isInteger(movieId) ||
      movieId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid movie ID.",
        },
        {
          status: 400,
        }
      );
    }

    const [movieRows] =
      await pool.query<MovieRow[]>(
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
            m.content_type_id,
            m.source,
            m.author,
            m.performers,

            COALESCE(
              sp.platform_name,
              m.broadcaster
            ) AS broadcaster,

            sp.logo_url

          FROM movies AS m

          LEFT JOIN movie_platforms AS mp
            ON mp.movie_id = m.movie_id

          LEFT JOIN streaming_platforms AS sp
            ON sp.platform_id = mp.platform_id

          WHERE m.movie_id = ?

          ORDER BY sp.platform_id ASC

          LIMIT 1
        `,
        [movieId]
      );

    const movie = movieRows[0];

    if (!movie) {
      return NextResponse.json(
        {
          error: "Movie not found.",
        },
        {
          status: 404,
        }
      );
    }

    const [genreRows] =
      await pool.query<GenreRow[]>(
        `
          SELECT DISTINCT
            g.genre_name

          FROM movie_genres AS mg

          INNER JOIN genres AS g
            ON g.genre_id = mg.genre_id

          WHERE mg.movie_id = ?

          ORDER BY g.genre_name
        `,
        [movieId]
      );

    const [moodRows] =
      await pool.query<MoodRow[]>(
        `
          SELECT DISTINCT
            m.mood_name

          FROM movie_moods AS mm

          INNER JOIN moods AS m
            ON m.mood_id = mm.mood_id

          WHERE mm.movie_id = ?

          ORDER BY m.mood_name
        `,
        [movieId]
      );

    const performers = movie.performers
      ? movie.performers
          .split(",")
          .map((performer) =>
            performer.trim()
          )
          .filter(Boolean)
      : [];

    return NextResponse.json({
      movie_id: movie.movie_id,
      title: movie.title,
      description: movie.description,
      release_year: movie.release_year,
      duration_minutes:
        movie.duration_minutes,
      poster_url: movie.poster_url,
      portrait_url: movie.portrait_url,
      trailer_url: movie.trailer_url,
      content_type_id:
        movie.content_type_id,

      content_type: getContentTypeName(
        movie.content_type_id
      ),

      source: movie.source,
      author: movie.author,
      performers,
      broadcaster: movie.broadcaster,
      logo_url: movie.logo_url,

      genres: genreRows.map(
        (genre) => genre.genre_name
      ),

      moods: moodRows.map(
        (mood) => mood.mood_name
      ),
    });
  } catch (error) {
    console.error(
      "Unable to load movie:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load this movie.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}