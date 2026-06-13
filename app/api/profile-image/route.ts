import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function PUT(req: Request) {
  try {
    const { userId, profileImage } = await req.json();

    if (!userId ) {
      return NextResponse.json(
        { message: "Missing userId or profile image" },
        { status: 400 }
      );
    }

    await pool.query(
      "UPDATE users SET profile_image = ? WHERE user_id = ?",
      [profileImage, userId]
    );

    return NextResponse.json({ message: "Profile image updated" });
  } catch (error) {
    console.error("Profile image update error:", error);

    return NextResponse.json(
      { message: "Could not update profile image" },
      { status: 500 }
    );
  }
}