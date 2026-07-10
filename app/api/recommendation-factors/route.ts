import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  const [rows] = await pool.query(`
    SELECT factor_id, factor_name, factor_icon
    FROM recommendation_factors
    ORDER BY factor_id
  `);

  return NextResponse.json(rows);
}