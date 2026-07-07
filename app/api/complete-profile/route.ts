import { NextResponse } from "next/server";
import pool from "../../src/lib/db";
import type { ResultSetHeader } from "mysql2";

export async function PUT(req: Request) {
  try {
    const { email, phone, country, dateOfBirth } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Missing email." },
        { status: 400 }
      );
    }

    const username = email.split("@")[0];

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO users
        (first_name, last_name, username, email, password, phone, country, date_of_birth)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        phone = VALUES(phone),
        country = VALUES(country),
        date_of_birth = VALUES(date_of_birth)
      `,
      [
        username,
        "",
        username,
        email,
        "google-login",
        phone,
        country,
        dateOfBirth,
      ]
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("COMPLETE PROFILE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update profile",
        error: String(error),
      },
      { status: 500 }
    );
  }
}