import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/app/src/lib/db";
import { authOptions } from "@/app/src/lib/auth";
import { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to leave a review." },
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

    const body = await request.json();

    const rating = Number(body.rating);
    const commentText = String(body.commentText || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    if (!commentText) {
      return NextResponse.json(
        { error: "Please enter a comment." },
        { status: 400 }
      );
    }

    if (commentText.length > 1000) {
      return NextResponse.json(
        { error: "Your comment cannot exceed 1000 characters." },
        { status: 400 }
      );
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

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { error: "Your user account could not be found." },
        { status: 404 }
      );
    }

    await pool.query(
      `
        INSERT INTO movie_comments (
          movie_id,
          user_id,
          rating,
          comment_text
        )
        VALUES (?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          rating = VALUES(rating),
          comment_text = VALUES(comment_text),
          updated_at = CURRENT_TIMESTAMP
      `,
      [movieId, user.user_id, rating, commentText]
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Save movie comment error:", error);

    return NextResponse.json(
      { error: "Unable to save your review." },
      { status: 500 }
    );
  }
}