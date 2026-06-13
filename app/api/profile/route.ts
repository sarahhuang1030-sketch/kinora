import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ user: null }, { status: 400 });
  }

  const [rows] = await pool.execute<UserRow[]>(
    `
    SELECT user_id, first_name, last_name, username, email, phone
    FROM users
    WHERE email = ?
    `,
    [email]
  );

  return NextResponse.json({ user: rows[0] || null });
}

export async function PUT(req: Request) {
  try {
    const { user_id, first_name, last_name, username, phone } = await req.json();

    if (!user_id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await pool.execute(
      `
      UPDATE users
      SET first_name = ?, last_name = ?, username = ?, phone = ?
      WHERE user_id = ?
      `,
      [first_name, last_name, username, phone, user_id]
    );

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}