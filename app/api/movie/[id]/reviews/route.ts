import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

type ReviewRow = RowDataPacket & {
  comment_id: number;
  movie_id: number;
  user_id: number;
  rating: number;
  comment_text: string;
  review_tags: string | string[] | null;
  would_recommend: number | boolean | null;
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
          mc.review_tags,
          mc.would_recommend,
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

        ORDER BY
          mc.updated_at DESC,
          mc.created_at DESC
      `,
      [movieId]
    );

    const reviews = rows.map((review) => {
      let tags: string[] = [];

      if (Array.isArray(review.review_tags)) {
        tags = review.review_tags;
      } else if (review.review_tags) {
        try {
          tags = JSON.parse(
            String(review.review_tags)
          );
        } catch {
          tags = [];
        }
      }

      return {
        comment_id: review.comment_id,
        movie_id: review.movie_id,
        user_id: review.user_id,
        rating: review.rating,
        comment_text: review.comment_text,
        tags,
        would_recommend:
          review.would_recommend === null
            ? null
            : Boolean(review.would_recommend),
        created_at: review.created_at,
        updated_at: review.updated_at,
        reviewer_name: review.reviewer_name,
      };
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error(
      "GET movie reviews error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load reviews.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
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

    const reviewTags = Array.isArray(body.tags)
      ? body.tags
          .map((tag: unknown) =>
            String(tag).trim()
          )
          .filter(Boolean)
      : [];

    const wouldRecommend =
      typeof body.wouldRecommend === "boolean"
        ? body.wouldRecommend
        : null;

    if (
      !Number.isInteger(movieId) ||
      movieId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid movie ID." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please sign in before reviewing.",
        },
        { status: 401 }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          error:
            "Rating must be between 1 and 5.",
        },
        { status: 400 }
      );
    }

    /*
     * Review text is optional for the
     * Mark as Watched popup.
     */
    if (commentText.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Your review cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    const [existingRows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT comment_id

          FROM movie_comments

          WHERE movie_id = ?
            AND user_id = ?

          LIMIT 1
        `,
        [movieId, userId]
      );

    /*
     * If this user already reviewed the movie,
     * update their existing review.
     */
    if (existingRows.length > 0) {
      await pool.query<ResultSetHeader>(
        `
          UPDATE movie_comments

          SET
            rating = ?,
            comment_text = ?,
            review_tags = ?,
            would_recommend = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE movie_id = ?
            AND user_id = ?
        `,
        [
          rating,
          commentText,
          JSON.stringify(reviewTags),
          wouldRecommend,
          movieId,
          userId,
        ]
      );

      return NextResponse.json({
        success: true,
        updated: true,
        message:
          "Review updated successfully.",
      });
    }

    /*
     * Otherwise create a new review.
     */
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO movie_comments (
            movie_id,
            user_id,
            rating,
            comment_text,
            review_tags,
            would_recommend,
            created_at,
            updated_at
          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `,
        [
          movieId,
          userId,
          rating,
          commentText,
          JSON.stringify(reviewTags),
          wouldRecommend,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        updated: false,
        commentId: result.insertId,
        message:
          "Review created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST movie review error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to save review.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}