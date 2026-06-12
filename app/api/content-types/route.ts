import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  const [rows] = await pool.query(`
    SELECT content_type_id, type_name
    FROM content_types
    ORDER BY type_name
  `);

  return NextResponse.json(rows);
}