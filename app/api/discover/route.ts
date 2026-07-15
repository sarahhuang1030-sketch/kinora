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
  content_type_id: number | null;
  content_type: string | null;
  genres: string | null;
  moods: string | null;
  platforms: string | null;
};

type CuratedCollectionRow = RowDataPacket & {
  collection_id: number;
  collection_name: string;
  collection_display_order: number;

  movie_display_order: number | null;

  movie_id: number | null;
  title: string | null;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  trailer_url: string | null;

  content_type_id: number | null;
  content_type: string | null;

  genres: string | null;
  moods: string | null;
  platforms: string | null;
};

type DiscoverMovie = {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  trailer_url: string | null;
  content_type_id: number | null;
  content_type: string | null;
  genres: string | null;
  moods: string | null;
  platforms: string | null;
};

type DiscoverCollection = {
  collection_id: number;
  collection_name: string;
  display_order: number;
  movie_count: number;
  show_count: number;
  movies: DiscoverMovie[];
};

export async function GET() {
  try {
    /*
      Load every movie for:
      - Trending Today
      - Browse All Content
      - Filtering by genre, mood and platform
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
      m.content_type_id,

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
      ON ct.content_type_id = m.content_type_id

    LEFT JOIN movie_genres mg
      ON mg.movie_id = m.movie_id

    LEFT JOIN genres g
      ON g.genre_id = mg.genre_id

    LEFT JOIN movie_moods mm
      ON mm.movie_id = m.movie_id

    LEFT JOIN moods mo
      ON mo.mood_id = mm.mood_id

    LEFT JOIN movie_platforms mp
      ON mp.movie_id = m.movie_id

    LEFT JOIN streaming_platforms sp
      ON sp.platform_id = mp.platform_id

    GROUP BY
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.duration_minutes,
      m.poster_url,
      m.portrait_url,
      m.trailer_url,
      m.content_type_id,
      ct.type_name

    ORDER BY m.title ASC
  `
);

    const movies: DiscoverMovie[] = movieRows.map((movie) => ({
      movie_id: Number(movie.movie_id),
      title: movie.title,
      description: movie.description,

      release_year:
        movie.release_year === null
          ? null
          : Number(movie.release_year),

      duration_minutes:
        movie.duration_minutes === null
          ? null
          : Number(movie.duration_minutes),

      poster_url: movie.poster_url,
      portrait_url: movie.portrait_url,
      trailer_url: movie.trailer_url,

      content_type_id:
        movie.content_type_id === null
          ? null
          : Number(movie.content_type_id),

      content_type: movie.content_type,
      genres: movie.genres,
      moods: movie.moods,
      platforms: movie.platforms,
    }));

    /*
      Load the real database-driven curated collections.

      The order comes from:
      curated_collections.display_order
      curated_collection_movies.display_order
    */
    const [curatedRows] = await pool.query<CuratedCollectionRow[]>(
  `
    SELECT
      cc.collection_id,
      cc.collection_name,
      cc.display_order AS collection_display_order,

      ccm.display_order AS movie_display_order,

      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.duration_minutes,
      m.poster_url,
      m.portrait_url,
      m.trailer_url,
      m.content_type_id,

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

    FROM curated_collections cc

    LEFT JOIN curated_collection_movies ccm
      ON ccm.collection_id = cc.collection_id

    LEFT JOIN movies m
      ON m.movie_id = ccm.movie_id

    LEFT JOIN content_types ct
      ON ct.content_type_id = m.content_type_id

    LEFT JOIN movie_genres mg
      ON mg.movie_id = m.movie_id

    LEFT JOIN genres g
      ON g.genre_id = mg.genre_id

    LEFT JOIN movie_moods mm
      ON mm.movie_id = m.movie_id

    LEFT JOIN moods mo
      ON mo.mood_id = mm.mood_id

    LEFT JOIN movie_platforms mp
      ON mp.movie_id = m.movie_id

    LEFT JOIN streaming_platforms sp
      ON sp.platform_id = mp.platform_id

    WHERE cc.is_active = TRUE

    GROUP BY
      cc.collection_id,
      cc.collection_name,
      cc.display_order,
      ccm.display_order,
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.duration_minutes,
      m.poster_url,
      m.portrait_url,
      m.trailer_url,
      m.content_type_id,
      ct.type_name

    ORDER BY
      cc.display_order ASC,
      ccm.display_order ASC
  `
);

    const collectionMap = new Map<number, DiscoverCollection>();

    for (const row of curatedRows) {
      const collectionId = Number(row.collection_id);

      if (!collectionMap.has(collectionId)) {
        collectionMap.set(collectionId, {
          collection_id: collectionId,
          collection_name: row.collection_name,
          display_order: Number(row.collection_display_order),
          movie_count: 0,
          show_count: 0,
          movies: [],
        });
      }

      const collection = collectionMap.get(collectionId);

      if (!collection) {
        continue;
      }

      /*
        LEFT JOIN allows an empty collection to still be returned.
        Only add a movie when the row actually contains one.
      */
      if (row.movie_id === null || row.title === null) {
        continue;
      }

      const contentTypeId =
        row.content_type_id === null
          ? null
          : Number(row.content_type_id);

      collection.movies.push({
        movie_id: Number(row.movie_id),
        title: row.title,
        description: row.description,

        release_year:
          row.release_year === null
            ? null
            : Number(row.release_year),

        duration_minutes:
          row.duration_minutes === null
            ? null
            : Number(row.duration_minutes),

        poster_url: row.poster_url,
        portrait_url: row.portrait_url,
        trailer_url: row.trailer_url,

        content_type_id: contentTypeId,
        content_type: row.content_type,

        genres: row.genres,
        moods: row.moods,
        platforms: row.platforms,
      });

      /*
        Your content type IDs:
        1 = Movies
        2 = TV Series
        4 = Limited Series

        Limited Series are counted as Shows.
      */
      if (contentTypeId === 1) {
        collection.movie_count += 1;
      }

      if (contentTypeId === 2 || contentTypeId === 4) {
        collection.show_count += 1;
      }
    }

    const collections = Array.from(collectionMap.values()).sort(
      (a, b) => a.display_order - b.display_order
    );

    /*
      The page currently creates its own three-item Trending Today carousel.
      This featured value is kept for compatibility with your response type.
    */
    const featured =
      movies.length > 0
        ? movies[Math.floor(Math.random() * movies.length)]
        : null;

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