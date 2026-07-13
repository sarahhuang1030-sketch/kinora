import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/app/src/lib/db";
import { authOptions } from "@/app/src/lib/auth";
import { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
};

type CommentRow = RowDataPacket & {
  comment_id: number;
  rating: number;
  comment_text: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  profile_image: string | null;
  user_id: number;
};

type SavedRow = RowDataPacket & {
  movie_id: number;
};

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const movieId = Number(id);

    if (!movieId || Number.isNaN(movieId)) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    let currentUserId: number | null = null;
    let isSaved = false;

    if (session?.user?.email) {
      const [users] = await pool.query<UserRow[]>(
        `
          SELECT user_id
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [session.user.email]
      );

      currentUserId = users[0]?.user_id ?? null;
    }

    const [comments] = await pool.query<CommentRow[]>(
      `
        SELECT
          mc.comment_id,
          mc.user_id,
          mc.rating,
          mc.comment_text,
          mc.created_at,
          u.first_name,
          u.last_name,
          u.username,
          u.profile_image

        FROM movie_comments mc

        INNER JOIN users u
          ON mc.user_id = u.user_id

        WHERE mc.movie_id = ?

        ORDER BY
          mc.updated_at DESC,
          mc.created_at DESC
      `,
      [movieId]
    );

    if (currentUserId) {
      const [savedRows] = await pool.query<SavedRow[]>(
        `
          SELECT wm.movie_id

          FROM watchlist_movies wm

          INNER JOIN watchlists w
            ON wm.watchlist_id = w.watchlist_id

          WHERE w.user_id = ?
            AND wm.movie_id = ?

          LIMIT 1
        `,
        [currentUserId, movieId]
      );

      isSaved = savedRows.length > 0;
    }

    return NextResponse.json({
      isLoggedIn: Boolean(currentUserId),
      isSaved,
      comments: comments.map((comment) => ({
        ...comment,
        is_current_user: comment.user_id === currentUserId,
      })),
    });
  } catch (error) {
    console.error("Load movie interactions error:", error);

    return NextResponse.json(
      { error: "Unable to load movie interactions." },
      { status: 500 }
    );
  }
}