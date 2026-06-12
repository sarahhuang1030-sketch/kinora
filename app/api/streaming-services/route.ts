import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  const [rows] = await pool.query(`
    SELECT platform_id, platform_name
    FROM streaming_platforms
    ORDER BY platform_name
  `);

  return NextResponse.json(rows);
}