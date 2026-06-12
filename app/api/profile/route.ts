import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
  username: string;
  email: string;
  phone: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  const [rows] = await pool.execute<UserRow[]>(
    "SELECT user_id, username, email, phone FROM users WHERE email = ?",
    [email]
  );

  return NextResponse.json({ user: rows[0] });
}