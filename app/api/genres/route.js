import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  const [rows] = await pool.query(`
    SELECT genre_id, genre_name
    FROM genres
    ORDER BY genre_name
  `);

  return NextResponse.json(rows);
}