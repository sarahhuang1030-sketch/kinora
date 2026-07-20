import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth';

import pool from '@/app/src/lib/db';
import { authOptions } from '@/app/src/lib/auth';

interface UserRow extends RowDataPacket {
  user_id: number;
}

interface WatchlistRow extends RowDataPacket {
  watchlist_id: number;
  name: string;
  created_at: string;
}

interface WatchlistItemRow extends RowDataPacket {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  content_type: string | null;
  status: string | null;
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

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      watchlistId: string;
    }>;
  }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'You must be logged in.',
        },
        { status: 401 }
      );
    }

    const { watchlistId: watchlistIdParam } =
      await context.params;

    const watchlistId = Number(watchlistIdParam);

    if (
      !Number.isInteger(watchlistId) ||
      watchlistId <= 0
    ) {
      return NextResponse.json(
        {
          error: 'Invalid watchlist ID.',
        },
        { status: 400 }
      );
    }

    const [watchlistRows] =
      await pool.execute<WatchlistRow[]>(
        `
          SELECT
            watchlist_id,
            name,
            created_at
          FROM watchlists
          WHERE watchlist_id = ?
            AND user_id = ?
          LIMIT 1
        `,
        [watchlistId, userId]
      );

    const watchlist = watchlistRows[0];

    if (!watchlist) {
      return NextResponse.json(
        {
          error: 'Watchlist not found.',
        },
        { status: 404 }
      );
    }

    const [itemRows] =
      await pool.execute<WatchlistItemRow[]>(
        `
          SELECT
            m.movie_id,
            m.title,
            m.description,
            m.release_year,
            m.duration_minutes,
            m.poster_url,
            m.portrait_url,
            ct.type_name AS content_type,
            wm.status
          FROM watchlist_movies wm

          INNER JOIN movies m
            ON m.movie_id = wm.movie_id

          LEFT JOIN content_types ct
            ON ct.content_type_id =
              m.content_type_id

          WHERE wm.watchlist_id = ?

          ORDER BY m.title ASC
        `,
        [watchlistId]
      );

    return NextResponse.json({
      watchlist: {
        watchlist_id: Number(
          watchlist.watchlist_id
        ),
        name: watchlist.name,
        created_at: watchlist.created_at,
        items: itemRows.map((item) => ({
          movie_id: Number(item.movie_id),
          title: item.title,
          description: item.description,
          release_year: item.release_year
            ? Number(item.release_year)
            : null,
          duration_minutes: item.duration_minutes
            ? Number(item.duration_minutes)
            : null,
          portrait_url:
            item.portrait_url ??
            item.poster_url ??
            null,
          content_type: item.content_type,
          status: item.status,
        })),
      },
    });
  } catch (error) {
    console.error(
      'GET WATCHLIST DETAILS ERROR:',
      error
    );

    return NextResponse.json(
      {
        error: 'Failed to load watchlist.',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}