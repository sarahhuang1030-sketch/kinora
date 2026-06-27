import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  const [rows] = await pool.query(`
    SELECT mood_id, mood_name, icon_url
    FROM moods
    ORDER BY mood_name
  `);

  return NextResponse.json(rows);
}