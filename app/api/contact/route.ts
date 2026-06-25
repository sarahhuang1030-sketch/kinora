import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO contact_messages (name, email, message)
       VALUES (?, ?, ?)`,
      [name, email, message]
    );

    return NextResponse.json({
      success: true,
      message: "Message saved successfully.",
    });
  } catch (error) {
    console.error("Contact message error:", error);

    return NextResponse.json(
      { error: "Failed to save message." },
      { status: 500 }
    );
  }
}