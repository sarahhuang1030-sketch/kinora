import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type ReviewRow = RowDataPacket & {
  comment_id: number;
  movie_id: number;
  user_id: number;
  rating: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  reviewer_name: string | null;
};

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<ReviewRow[]>(
      `
        SELECT
          mc.comment_id,
          mc.movie_id,
          mc.user_id,
          mc.rating,
          mc.comment_text,
          mc.created_at,
          mc.updated_at,
          COALESCE(
            NULLIF(
              TRIM(
                CONCAT(
                  COALESCE(u.first_name, ''),
                  ' ',
                  COALESCE(u.last_name, '')
                )
              ),
              ''
            ),
            u.username,
            'Cineri viewer'
          ) AS reviewer_name
        FROM movie_comments mc
        LEFT JOIN users u
          ON u.user_id = mc.user_id
        WHERE mc.movie_id = ?
        ORDER BY mc.created_at DESC
      `,
      [movieId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET movie reviews error:", error);

    return NextResponse.json(
      {
        error: "Unable to load reviews.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const movieId = Number(id);

    const body = await request.json();

    const userId = Number(body.userId);
    const rating = Number(body.rating);
    const commentText = String(
      body.commentText || ""
    ).trim();

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Please sign in before reviewing." },
        { status: 401 }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    if (commentText.length < 5) {
      return NextResponse.json(
        {
          error:
            "Your review must contain at least 5 characters.",
        },
        { status: 400 }
      );
    }

    if (commentText.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Your review cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `
        SELECT comment_id
        FROM movie_comments
        WHERE movie_id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [movieId, userId]
    );

    if (existingRows.length > 0) {
      await pool.query<ResultSetHeader>(
        `
          UPDATE movie_comments
          SET
            rating = ?,
            comment_text = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE movie_id = ?
            AND user_id = ?
        `,
        [rating, commentText, movieId, userId]
      );

      return NextResponse.json({
        success: true,
        updated: true,
        message: "Review updated successfully.",
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO movie_comments (
          movie_id,
          user_id,
          rating,
          comment_text,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [movieId, userId, rating, commentText]
    );

    return NextResponse.json(
      {
        success: true,
        updated: false,
        commentId: result.insertId,
        message: "Review created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST movie review error:", error);

    return NextResponse.json(
      {
        error: "Unable to save review.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}