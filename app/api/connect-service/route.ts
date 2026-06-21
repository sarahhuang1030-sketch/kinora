import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket } from "mysql2";

type ExistingServiceRow = RowDataPacket & {
  id: number;
};

export async function POST(req: Request) {
  try {
    const { userId, service } = await req.json();

    if (!userId || !service) {
      return NextResponse.json(
        { error: "Missing userId or service" },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<ExistingServiceRow[]>(
      `
      SELECT id
      FROM user_connected_services
      WHERE user_id = ?
      AND service_name = ?
      `,
      [userId, service]
    );

    if (existing.length === 0) {
      await pool.query(
        `
        INSERT INTO user_connected_services
        (user_id, service_name)
        VALUES (?, ?)
        `,
        [userId, service]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CONNECT SERVICE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to connect service" },
      { status: 500 }
    );
  }
}