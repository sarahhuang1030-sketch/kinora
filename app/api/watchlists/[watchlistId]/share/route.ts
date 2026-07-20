import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/app/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/src/lib/auth";

type SessionUser = {
  user_id?: number;
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      watchlistId: string;
    }>;
  }
) {
  try {

    const [databaseRows] = await pool.query(
    `SELECT DATABASE() AS database_name`
    );

    console.log("APP DATABASE:", databaseRows);

    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user?.user_id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const { watchlistId } = await context.params;
    const parsedWatchlistId = Number(watchlistId);

    if (
      !Number.isInteger(parsedWatchlistId) ||
      parsedWatchlistId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid watchlist ID." },
        { status: 400 }
      );
    }

   const [rows] = await pool.query(
  `
    SELECT
      watchlist_id,
      share_token,
      is_public
    FROM watchlists
    WHERE watchlist_id = ?
      AND user_id = ?
    LIMIT 1
  `,
  [
    parsedWatchlistId,
    user.user_id,
  ]
);

    const watchlists = rows as Array<{
      watchlist_id: number;
      share_token: string | null;
      is_public: number;
    }>;

    const watchlist = watchlists[0];

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found." },
        { status: 404 }
      );
    }

    let shareToken = watchlist.share_token;

    if (!shareToken) {
      shareToken = crypto.randomBytes(24).toString("hex");
    }

   await pool.query(
  `
    UPDATE watchlists
    SET
      share_token = ?,
      is_public = 1
    WHERE watchlist_id = ?
      AND user_id = ?
  `,
  [
    shareToken,
    parsedWatchlistId,
    user.user_id,
  ]
);

const [updatedRows] = await pool.query(
  `
    SELECT
      watchlist_id,
      share_token,
      is_public
    FROM watchlists
    WHERE watchlist_id = ?
      AND user_id = ?
    LIMIT 1
  `,
  [
    parsedWatchlistId,
    user.user_id,
  ]
);

console.log(
  "UPDATED WATCHLIST SHARE DATA:",
  updatedRows
);

    const origin =
    process.env.NEXTAUTH_URL ||
    request.nextUrl.origin;

    const shareUrl = new URL(
    `/shared/watchlist/${shareToken}`,
    origin
    ).toString();

    return NextResponse.json({
      success: true,
      shareUrl,
      shareToken,
    });
  } catch (error) {
    console.error("Generate share link error:", error);

    return NextResponse.json(
      {
        error: "Unable to generate share link.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}