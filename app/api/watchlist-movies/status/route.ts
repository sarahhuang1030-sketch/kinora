import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/app/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/src/lib/auth";

interface UserRow extends RowDataPacket {
  user_id: number;
}

interface MovieStatusRow extends RowDataPacket {
  watchlist_id: number;
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

export async function GET(req: Request) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const movieId = Number(
      searchParams.get("movieId")
    );

    if (
      !Number.isInteger(movieId) ||
      movieId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid movie ID.",
        },
        { status: 400 }
      );
    }

    const [rows] =
      await pool.execute<MovieStatusRow[]>(
        `
          SELECT
            wm.watchlist_id,
            wm.status
          FROM watchlist_movies wm

          INNER JOIN watchlists w
            ON w.watchlist_id = wm.watchlist_id

          WHERE w.user_id = ?
            AND wm.movie_id = ?

          ORDER BY
            CASE
              WHEN LOWER(COALESCE(wm.status, ''))
                = 'completed'
              THEN 0
              ELSE 1
            END

          LIMIT 1
        `,
        [userId, movieId]
      );

    const status =
      rows.length > 0
        ? rows[0].status
        : null;

    return NextResponse.json({
      status,
      isWatched:
        status?.toLowerCase() === "completed",
    });
  } catch (error) {
    console.error(
      "GET WATCHED STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load watched status.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const movieId = Number(body.movieId);
    const status = String(body.status || "");

    if (
      !Number.isInteger(movieId) ||
      movieId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid movie ID.",
        },
        { status: 400 }
      );
    }

    if (
      !["Want to Watch", "completed"].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid status.",
        },
        { status: 400 }
      );
    }

    const [rows] =
      await pool.execute<MovieStatusRow[]>(
        `
          SELECT
            wm.watchlist_id,
            wm.status
          FROM watchlist_movies wm

          INNER JOIN watchlists w
            ON w.watchlist_id = wm.watchlist_id

          WHERE w.user_id = ?
            AND wm.movie_id = ?

          LIMIT 1
        `,
        [userId, movieId]
      );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Add this title to a watchlist before marking it as watched.",
        },
        { status: 400 }
      );
    }

    await pool.execute(
      `
        UPDATE watchlist_movies wm

        INNER JOIN watchlists w
          ON w.watchlist_id =
            wm.watchlist_id

        SET wm.status = ?

        WHERE w.user_id = ?
          AND wm.movie_id = ?
      `,
      [
        status,
        userId,
        movieId,
      ]
    );

    return NextResponse.json({
      success: true,
      status,
      isWatched:
        status.toLowerCase() === "completed",
    });
  } catch (error) {
    console.error(
      "UPDATE WATCHED STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update watched status.",
      },
      { status: 500 }
    );
  }
}