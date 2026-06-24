import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket } from "mysql2";

type ExistingServiceRow = RowDataPacket & {
  id: number;
};

const sampleHistory: Record<string, number[]> = {
  Netflix: [3, 5, 8],
  "Disney+": [1, 4, 7],
  Crave: [2, 6, 10],
  "Prime Video": [9, 11, 12],
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

    const movieIds = sampleHistory[service] || [];

    for (const movieId of movieIds) {
      await pool.query(
        `
        INSERT IGNORE INTO user_watch_history
        (user_id, movie_id)
        VALUES (?, ?)
        `,
        [userId, movieId]
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