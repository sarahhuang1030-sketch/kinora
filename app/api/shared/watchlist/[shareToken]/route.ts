import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import pool from "@/app/src/lib/db";

type SharedWatchlistRow = RowDataPacket & {
  watchlist_id: number;
  name: string;
  created_at: string;
  movie_id: number | null;
  title: string | null;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  portrait_url: string | null;
  content_type: string | null;
  status: string | null;
};

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      shareToken: string;
    }>;
  }
) {
  try {
    const { shareToken } = await context.params;

    const cleanToken = shareToken?.trim();

    if (!cleanToken) {
      return NextResponse.json(
        {
          error: "Invalid share link.",
        },
        {
          status: 400,
        }
      );
    }

    const [rows] = await pool.query<
      SharedWatchlistRow[]
    >(
      `
        SELECT
          w.watchlist_id,
          w.name,
          w.created_at,
          m.movie_id,
          m.title,
          m.description,
          m.release_year,
          m.duration_minutes,
          m.portrait_url,
          ct.type_name AS content_type,
          wm.status
        FROM watchlists AS w
        LEFT JOIN watchlist_movies AS wm
          ON wm.watchlist_id = w.watchlist_id
        LEFT JOIN movies AS m
          ON m.movie_id = wm.movie_id
        LEFT JOIN content_types AS ct
          ON ct.content_type_id =
             m.content_type_id
        WHERE w.share_token = ?
          AND w.is_public = 1
        ORDER BY m.title ASC
      `,
      [cleanToken]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "This watchlist is private, unavailable, or the share link is invalid.",
        },
        {
          status: 404,
        }
      );
    }

    const firstRow = rows[0];

    const items = rows
      .filter(
        (
          row
        ): row is SharedWatchlistRow & {
          movie_id: number;
          title: string;
        } =>
          row.movie_id !== null &&
          row.title !== null
      )
      .map((row) => ({
        movie_id: row.movie_id,
        title: row.title,
        description: row.description,
        release_year: row.release_year,
        duration_minutes:
          row.duration_minutes,
        portrait_url: row.portrait_url,
        content_type: row.content_type,
        status: row.status,
      }));

    return NextResponse.json({
      watchlist: {
        watchlist_id: firstRow.watchlist_id,
        name: firstRow.name,
        created_at: firstRow.created_at,
        items,
      },
    });
  } catch (error) {
    console.error(
      "Shared watchlist API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load the shared watchlist.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      {
        status: 500,
      }
    );
  }
}