import { NextResponse } from "next/server";
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
  name: string;
};

type MovieRow = RowDataPacket & {
  movie_id: number;
};

type RequestBody = {
  watchlistId?: number;
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

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must log in before adding a movie.",
          requiresLogin: true,
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;
    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid movie ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body = (await request
      .json()
      .catch(() => ({}))) as RequestBody;

    const watchlistId = Number(body.watchlistId);

    if (
      !Number.isInteger(watchlistId) ||
      watchlistId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Please select a watchlist.",
        },
        {
          status: 400,
        }
      );
    }

    const [movieRows] = await pool.query<MovieRow[]>(
      `
        SELECT movie_id
        FROM movies
        WHERE movie_id = ?
        LIMIT 1
      `,
      [movieId]
    );

    if (!movieRows[0]) {
      return NextResponse.json(
        {
          error: "Movie not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      This check is important. It makes sure the selected
      watchlist belongs to the logged-in user.
    */
    const [watchlistRows] =
      await pool.query<WatchlistRow[]>(
        `
          SELECT
            watchlist_id,
            name
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
          error:
            "That watchlist was not found or does not belong to you.",
        },
        {
          status: 404,
        }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
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

    const alreadySaved = result.affectedRows === 0;

    return NextResponse.json({
      success: true,
      isSaved: true,
      alreadySaved,
      watchlistId: watchlist.watchlist_id,
      watchlistName: watchlist.name,
      message: alreadySaved
        ? `This movie is already saved in ${watchlist.name}.`
        : `Movie added to ${watchlist.name}.`,
    });
  } catch (error) {
    console.error("Add to watchlist error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to add this movie to your watchlist.",
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

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
          requiresLogin: true,
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;
    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid movie ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body = (await request
      .json()
      .catch(() => ({}))) as RequestBody;

    const watchlistId = Number(body.watchlistId);

    if (
      !Number.isInteger(watchlistId) ||
      watchlistId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Please select a watchlist.",
        },
        {
          status: 400,
        }
      );
    }

    const [watchlistRows] =
      await pool.query<WatchlistRow[]>(
        `
          SELECT
            watchlist_id,
            name
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
          error:
            "That watchlist was not found or does not belong to you.",
        },
        {
          status: 404,
        }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
        DELETE FROM watchlist_movies
        WHERE watchlist_id = ?
          AND movie_id = ?
      `,
      [watchlistId, movieId]
    );

    return NextResponse.json({
      success: true,
      isSaved: false,
      removed: result.affectedRows > 0,
      watchlistId: watchlist.watchlist_id,
      watchlistName: watchlist.name,
    });
  } catch (error) {
    console.error("Remove from watchlist error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to remove this movie from your watchlist.",
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