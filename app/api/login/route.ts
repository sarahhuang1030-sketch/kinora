import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
  username: string;
  email: string;
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const [rows] = await pool.execute<UserRow[]>(
      "SELECT user_id, username, email FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login successful",
      user: rows[0],
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}