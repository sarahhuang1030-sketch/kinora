import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

type ConnectedServiceRow = RowDataPacket & {
  service_name: string;
};

type SaveServicesBody = {
  userId?: number;
  services?: string[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "A valid userId is required." },
        { status: 400 }
      );
    }

    const [rows] =
      await pool.query<ConnectedServiceRow[]>(
        `
          SELECT service_name
          FROM user_connected_services
          WHERE user_id = ?
          ORDER BY service_name
        `,
        [userId]
      );

    return NextResponse.json({
      services: rows.map((row) => row.service_name),
    });
  } catch (error) {
    console.error(
      "LOAD CONNECTED SERVICES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load connected services.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const connection = await pool.getConnection();

  try {
    const body =
      (await request.json()) as SaveServicesBody;

    const userId = Number(body.userId);

    const services = Array.isArray(body.services)
      ? Array.from(
          new Set(
            body.services
              .map((service) => service.trim())
              .filter(Boolean)
          )
        )
      : [];

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "A valid userId is required." },
        { status: 400 }
      );
    }

    const [userRows] =
      await connection.query<RowDataPacket[]>(
        `
          SELECT user_id
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [userId]
      );

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    await connection.beginTransaction();

    await connection.query<ResultSetHeader>(
      `
        DELETE FROM user_connected_services
        WHERE user_id = ?
      `,
      [userId]
    );

    for (const service of services) {
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO user_connected_services
            (user_id, service_name)
          VALUES (?, ?)
        `,
        [userId, service]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "SAVE CONNECTED SERVICES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to save connected services.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}