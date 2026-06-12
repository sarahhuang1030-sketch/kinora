import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function POST(req: Request) {
  try {
    const {
      userId,
      genres,
      streamingServices,
      contentTypes,
      preferences,
    } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await pool.execute("DELETE FROM user_genres WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM user_streaming_services WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM user_content_types WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM user_preferences WHERE user_id = ?", [userId]);

    for (const genre of genres || []) {
      await pool.execute(
        "INSERT INTO user_genres (user_id, genre_name) VALUES (?, ?)",
        [userId, genre]
      );
    }

    for (const service of streamingServices || []) {
      await pool.execute(
        "INSERT INTO user_streaming_services (user_id, service_name) VALUES (?, ?)",
        [userId, service]
      );
    }

    for (const type of contentTypes || []) {
      await pool.execute(
        "INSERT INTO user_content_types (user_id, content_type) VALUES (?, ?)",
        [userId, type]
      );
    }

    for (const preference of preferences || []) {
      await pool.execute(
        "INSERT INTO user_preferences (user_id, preference_name) VALUES (?, ?)",
        [userId, preference]
      );
    }

    return NextResponse.json({ message: "Onboarding saved successfully" });
  } catch (error) {
    console.error("ONBOARDING ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}