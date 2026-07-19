import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        platform_id,
        platform_name,
        logo_url
      FROM streaming_platforms
      ORDER BY
        CASE
          WHEN platform_name = 'Netflix' THEN 1
          WHEN platform_name = 'Prime Video' THEN 2
          WHEN platform_name = 'Crave' THEN 3
          WHEN platform_name IN (
            'Disney Plus',
            'Disney+'
          ) THEN 4
          ELSE 5
        END,
        platform_name
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(
      "LOAD STREAMING PLATFORMS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load streaming platforms.",
      },
      {
        status: 500,
      }
    );
  }
}