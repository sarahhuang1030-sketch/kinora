import { NextResponse } from "next/server";
import pool from "../../src/lib/db";

export async function PUT(req: Request) {
  try {
    const {
      email,
      phone,
      country,
      dateOfBirth,
    } = await req.json();

    await pool.query(
      `
      UPDATE users
      SET
        phone = ?,
        country = ?,
        date_of_birth = ?
      WHERE email = ?
      `,
      [phone, country, dateOfBirth, email]
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to update profile",
      },
      { status: 500 }
    );
  }
}