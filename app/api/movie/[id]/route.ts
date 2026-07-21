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
   worldwide_gross: number | string | null;
};

type GenreRow = RowDataPacket & {
  genre_name: string;
};

type MoodRow = RowDataPacket & {
  mood_name: string;
};

type PersonRow = RowDataPacket & {
  name: string;
  photo_url: string | null;
};

type Creator ={
  name: string;
  role: string;
}

type AwardRow = RowDataPacket & {
  award_name: string;
  category: string | null;
  award_year: number | null;
  is_featured: number | boolean;
};

function parseCreator(value: string): Creator {
  const match = value.match(/^(.*?)\s*\((.*?)\)\s*$/);

  if (match) {
    return {
      name: match[1].trim(),
      role: match[2].trim(),
    };
  }

  return {
    name: value.trim(),
    role: "Director",
  };
}

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
            m.worldwide_gross,

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

const [awards] = await pool.query<AwardRow[]>(
  `
    SELECT
      award_name,
      category,
      award_year,
      is_featured
    FROM movie_awards
    WHERE movie_id = ?
      AND is_winner = TRUE
    ORDER BY
      is_featured DESC,
      award_year DESC
  `,
  [movieId]
);

const featuredAward =
  awards.find((award) => Boolean(award.is_featured)) ||
  awards[0] ||
  null;

    const performers = movie.performers
      ? movie.performers
          .split(",")
          .map((performer) =>
            performer.trim()
          )
          .filter(Boolean)
      : [];

      const creators = movie.author
  ? movie.author
      .split(",")
      .map((creator) => creator.trim())
      .filter(Boolean)
      .map(parseCreator)
  : [];


    const peopleNames = [
  ...performers,
  ...creators.map((creator) => creator.name),
];


let peopleRows: PersonRow[] = [];

if (peopleNames.length > 0) {
  const [rows] = await pool.query<PersonRow[]>(
    `
      SELECT
        name,
        photo_url
      FROM people
      WHERE name IN (?)
    `,
    [peopleNames]
  );

  peopleRows = rows;
}



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
        worldwide_gross: movie.worldwide_gross
    ? Number(movie.worldwide_gross)
    : null,

  award_count: awards.length,
  
  award_name: featuredAward?.award_name ?? null,

featured_award:
  featuredAward?.category ?? null,

featured_award_year:
  featuredAward?.award_year ?? null,

      source: movie.source,
      author: movie.author,
     creators: creators.map((creator) => {
  const person = peopleRows.find(
    (item) =>
      item.name.toLowerCase() ===
      creator.name.toLowerCase()
  );

  return {
    name: creator.name,
    role: creator.role,
    photo_url: person?.photo_url || null,
  };
}),
      performers: performers.map((name) => {
        const person = peopleRows.find(
          (item) =>
            item.name.toLowerCase() === name.toLowerCase()
        );

        return {
          name,
          photo_url: person?.photo_url || null,
        };
      }),
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