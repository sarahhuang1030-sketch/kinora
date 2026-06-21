import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket } from "mysql2";

type ConnectedServiceRow = RowDataPacket & {
  service_name: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<ConnectedServiceRow[]>(
      `
      SELECT service_name
      FROM user_connected_services
      WHERE user_id = ?
      `,
      [userId]
    );

    return NextResponse.json({
      services: rows.map((row) => row.service_name),
    });
  } catch (error) {
    console.error("LOAD CONNECTED SERVICES ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load connected services" },
      { status: 500 }
    );
  }
}