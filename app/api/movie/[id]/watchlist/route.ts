import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/app/src/lib/db";
import { authOptions } from "@/app/src/lib/auth";
import {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
};

type WatchlistRow = RowDataPacket & {
  watchlist_id: number;
};

async function getLoggedInUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const [users] = await pool.query<UserRow[]>(
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

async function getOrCreateDefaultWatchlist(userId: number) {
  const [watchlists] = await pool.query<WatchlistRow[]>(
    `
      SELECT watchlist_id
      FROM watchlists
      WHERE user_id = ?
      ORDER BY watchlist_id ASC
      LIMIT 1
    `,
    [userId]
  );

  if (watchlists[0]) {
    return watchlists[0].watchlist_id;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO watchlists (user_id, name)
      VALUES (?, 'My Watchlist')
    `,
    [userId]
  );

  return result.insertId;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const movieId = Number(id);

    if (!movieId || Number.isNaN(movieId)) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    const watchlistId = await getOrCreateDefaultWatchlist(userId);

    await pool.query(
      `
        INSERT IGNORE INTO watchlist_movies (
          watchlist_id,
          movie_id,
          status
        )
        VALUES (?, ?, 'saved')
      `,
      [watchlistId, movieId]
    );

    return NextResponse.json({
      success: true,
      isSaved: true,
    });
  } catch (error) {
    console.error("Add to watchlist error:", error);

    return NextResponse.json(
      { error: "Unable to add this movie to your watchlist." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const movieId = Number(id);

    if (!movieId || Number.isNaN(movieId)) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    await pool.query(
      `
        DELETE wm

        FROM watchlist_movies wm

        INNER JOIN watchlists w
          ON wm.watchlist_id = w.watchlist_id

        WHERE w.user_id = ?
          AND wm.movie_id = ?
      `,
      [userId, movieId]
    );

    return NextResponse.json({
      success: true,
      isSaved: false,
    });
  } catch (error) {
    console.error("Remove from watchlist error:", error);

    return NextResponse.json(
      { error: "Unable to remove this movie from your watchlist." },
      { status: 500 }
    );
  }
}