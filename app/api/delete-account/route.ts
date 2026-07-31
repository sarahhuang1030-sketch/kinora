import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type {
  RowDataPacket,
} from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
};

export async function DELETE(
  request: Request
) {
  const connection =
    await pool.getConnection();

  try {
    const {
      userId,
      email,
    } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        {
          error:
            "Missing user information.",
        },
        {
          status: 400,
        }
      );
    }

    const [users] =
      await connection.query<UserRow[]>(
        `
          SELECT user_id
          FROM users
          WHERE user_id = ?
          AND email = ?
          LIMIT 1
        `,
        [userId, email]
      );

    if (users.length === 0) {
      return NextResponse.json(
        {
          error:
            "Account not found.",
        },
        {
          status: 404,
        }
      );
    }

   await connection.beginTransaction();

// These tables do not use ON DELETE CASCADE,
// so they must be cleared first.

await connection.query(
  `
    DELETE FROM user_ratings
    WHERE user_id = ?
  `,
  [userId]
);

await connection.query(
  `
    DELETE FROM user_recommendation_factors
    WHERE user_id = ?
  `,
  [userId]
);

await connection.query(
  `
    DELETE FROM user_watch_history
    WHERE user_id = ?
  `,
  [userId]
);

// The remaining user-related tables shown in the database
// use ON DELETE CASCADE.

await connection.query(
  `
    DELETE FROM users
    WHERE user_id = ?
  `,
  [userId]
);

await connection.commit();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "DELETE ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete account.",
      },
      {
        status: 500,
      }
    );
  } finally {
    connection.release();
  }
}