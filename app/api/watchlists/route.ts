import { NextResponse } from 'next/server';
import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2';
import pool from '@/app/src/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/src/lib/auth";

interface WatchlistRow extends RowDataPacket {
  watchlist_id: number;
  name: string;
  total_titles: number | string;
  movie_count: number | string;
  tv_count: number | string;
  completed_count: number | string;
  contains_movie: number;
}

interface PreviewRow extends RowDataPacket {
  watchlist_id: number;
  movie_id: number;
  title: string;
  portrait_url: string | null;
}

interface StatsRow extends RowDataPacket {
  total_watchlists: number | string;
  total_items: number | string;
  movies: number | string;
  tv_shows: number | string;
  completed: number | string;
}

interface UserRow extends RowDataPacket {
  user_id: number;
}

async function getLoggedInUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const [users] = await pool.execute<UserRow[]>(
    `
      SELECT user_id
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [session.user.email]
  );

  return users[0]?.user_id ?? null;
}

export async function GET(req: Request) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
          requiresLogin: true,
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const movieIdParam =
      searchParams.get("movieId");

    const movieId = movieIdParam
      ? Number(movieIdParam)
      : null;

    if (
      movieId !== null &&
      (!Number.isInteger(movieId) || movieId <= 0)
    ) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    const [watchlistRows] =
      await pool.execute<WatchlistRow[]>(
        `
          SELECT
            w.watchlist_id,
            w.name,
            COUNT(wm.movie_id) AS total_titles,

            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(ct.type_name, ''))
                    LIKE '%movie%'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS movie_count,

            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(ct.type_name, ''))
                    LIKE '%tv%'
                    OR LOWER(COALESCE(ct.type_name, ''))
                      LIKE '%show%'
                    OR LOWER(COALESCE(ct.type_name, ''))
                      LIKE '%series%'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS tv_count,

            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(wm.status, ''))
                    = 'completed'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS completed_count,

            CASE
              WHEN EXISTS (
                SELECT 1
                FROM watchlist_movies selected_movie
                WHERE selected_movie.watchlist_id =
                  w.watchlist_id
                  AND selected_movie.movie_id = ?
              )
              THEN 1
              ELSE 0
            END AS contains_movie

          FROM watchlists w

          LEFT JOIN watchlist_movies wm
            ON wm.watchlist_id = w.watchlist_id

          LEFT JOIN movies m
            ON m.movie_id = wm.movie_id

          LEFT JOIN content_types ct
            ON ct.content_type_id =
              m.content_type_id

          WHERE w.user_id = ?

          GROUP BY
            w.watchlist_id,
            w.name

          ORDER BY w.watchlist_id DESC
        `,
        [movieId, userId]
      );

    const [previewRows] =
      await pool.execute<PreviewRow[]>(
        `
          SELECT
            wm.watchlist_id,
            m.movie_id,
            m.title,
            COALESCE(
              m.portrait_url,
              m.poster_url
            ) AS portrait_url

          FROM watchlist_movies wm

          INNER JOIN watchlists w
            ON w.watchlist_id = wm.watchlist_id

          INNER JOIN movies m
            ON m.movie_id = wm.movie_id

          WHERE w.user_id = ?

          ORDER BY
            wm.watchlist_id DESC,
            wm.movie_id DESC
        `,
        [userId]
      );

    const [statsRows] =
      await pool.execute<StatsRow[]>(
        `
          SELECT
            COUNT(DISTINCT w.watchlist_id)
              AS total_watchlists,

            COUNT(wm.movie_id)
              AS total_items,

            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(ct.type_name, ''))
                    LIKE '%movie%'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS movies,

            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(ct.type_name, ''))
                    LIKE '%tv%'
                    OR LOWER(COALESCE(ct.type_name, ''))
                      LIKE '%show%'
                    OR LOWER(COALESCE(ct.type_name, ''))
                      LIKE '%series%'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS tv_shows,

            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(wm.status, ''))
                    = 'completed'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS completed

          FROM watchlists w

          LEFT JOIN watchlist_movies wm
            ON wm.watchlist_id = w.watchlist_id

          LEFT JOIN movies m
            ON m.movie_id = wm.movie_id

          LEFT JOIN content_types ct
            ON ct.content_type_id =
              m.content_type_id

          WHERE w.user_id = ?
        `,
        [userId]
      );

    const previewsByWatchlist = new Map<
      number,
      Array<{
        movie_id: number;
        title: string;
        portrait_url: string | null;
      }>
    >();

    for (const row of previewRows) {
      const watchlistId = Number(
        row.watchlist_id
      );

      const current =
        previewsByWatchlist.get(watchlistId) ?? [];

      if (current.length < 3) {
        current.push({
          movie_id: Number(row.movie_id),
          title: row.title,
          portrait_url: row.portrait_url,
        });

        previewsByWatchlist.set(
          watchlistId,
          current
        );
      }
    }

    const watchlists = watchlistRows.map(
      (watchlist) => ({
        watchlist_id: Number(
          watchlist.watchlist_id
        ),

        name: watchlist.name,

        total_titles: Number(
          watchlist.total_titles ?? 0
        ),

        movie_count: Number(
          watchlist.movie_count ?? 0
        ),

        tv_count: Number(
          watchlist.tv_count ?? 0
        ),

        completed_count: Number(
          watchlist.completed_count ?? 0
        ),

        contains_movie: Boolean(
          watchlist.contains_movie
        ),

        previews:
          previewsByWatchlist.get(
            Number(watchlist.watchlist_id)
          ) ?? [],
      })
    );

    const statsRow = statsRows[0];

    return NextResponse.json({
      watchlists,

      stats: {
        total_watchlists: Number(
          statsRow?.total_watchlists ?? 0
        ),

        total_items: Number(
          statsRow?.total_items ?? 0
        ),

        movies: Number(
          statsRow?.movies ?? 0
        ),

        tv_shows: Number(
          statsRow?.tv_shows ?? 0
        ),

        completed: Number(
          statsRow?.completed ?? 0
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET WATCHLISTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load watchlists",
        details:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = body.userId;

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    if (!userId || !name) {
      return NextResponse.json(
        {
          error:
            'User and watchlist name are required.',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            'Watchlist name must be 100 characters or fewer.',
        },
        { status: 400 }
      );
    }

    const [result] =
      await pool.execute<ResultSetHeader>(
        `
          INSERT INTO watchlists (
            user_id,
            name
          )
          VALUES (?, ?)
        `,
        [userId, name]
      );

    return NextResponse.json(
      {
        success: true,
        watchlistId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'CREATE WATCHLIST ERROR:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown database error';

    return NextResponse.json(
      {
        error: 'Failed to create watchlist',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const connection = await pool.getConnection();

  try {
    const { searchParams } = new URL(req.url);

    const watchlistId =
      searchParams.get('watchlistId');

    const userId =
      searchParams.get('userId');

    if (!watchlistId || !userId) {
      return NextResponse.json(
        {
          error:
            'Missing watchlistId or userId',
        },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [ownershipRows] =
      await connection.execute<RowDataPacket[]>(
        `
          SELECT watchlist_id
          FROM watchlists
          WHERE watchlist_id = ?
            AND user_id = ?
          LIMIT 1
        `,
        [watchlistId, userId]
      );

    if (ownershipRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    await connection.execute(
      `
        DELETE FROM watchlist_movies
        WHERE watchlist_id = ?
      `,
      [watchlistId]
    );

    await connection.execute(
      `
        DELETE FROM watchlists
        WHERE watchlist_id = ?
          AND user_id = ?
      `,
      [watchlistId, userId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      'DELETE WATCHLIST ERROR:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown database error';

    return NextResponse.json(
      {
        error: 'Failed to delete watchlist',
        details: message,
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}