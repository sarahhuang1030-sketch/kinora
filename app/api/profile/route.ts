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
  country?: string;
  date_of_birth?: string;
  profile_image?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ user: null }, { status: 400 });
    }

    const [rows] = await pool.execute<UserRow[]>(
      `
     SELECT
  user_id,
  first_name,
  last_name,
  username,
  email,
  phone,
  country,
  DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
  profile_image
FROM users
WHERE email = ?
      `,
      [email]
    );

    const user = rows[0];

    console.log("PROFILE VIEWED", {
      userId: user?.user_id,
      email: user?.email,
      viewedAt: new Date().toISOString(),
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const [genreRows] = await pool.execute<RowDataPacket[]>(
  `SELECT genre_name FROM user_genres WHERE user_id = ?`,
  [user.user_id]
);

const [serviceRows] = await pool.execute<RowDataPacket[]>(
  `SELECT service_name FROM user_connected_services WHERE user_id = ?`,
  [user.user_id]
);

const [contentRows] = await pool.execute<RowDataPacket[]>(
  `SELECT content_type FROM user_content_types WHERE user_id = ?`,
  [user.user_id]
);

const [preferenceRows] = await pool.execute<RowDataPacket[]>(
  `SELECT preference_name FROM user_preferences WHERE user_id = ?`,
  [user.user_id]
);

    return NextResponse.json({
      user,
      answers: {
        genres: genreRows.map((row) => row.genre_name),
        streamingServices: serviceRows.map((row) => row.service_name),
        contentTypes: contentRows.map((row) => row.content_type),
        preferences: preferenceRows.map((row) => row.preference_name),
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      { message: "Profile API error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const {
  user_id,
  first_name,
  last_name,
  username,
  phone,
  country,
  date_of_birth,
} = await req.json();

    if (!user_id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const formattedDate =
  date_of_birth && date_of_birth !== ""
    ? date_of_birth.split("T")[0]
    : null;

   await pool.execute(
  `
  UPDATE users
  SET first_name = ?, last_name = ?, username = ?, phone = ?, country = ?, date_of_birth = ?
  WHERE user_id = ?
  `,
  [
    first_name,
    last_name,
    username,
    phone || null,
    country || null,
    formattedDate,
    user_id,
  ]
);

    console.log("PROFILE UPDATED", {
    userId: user_id,
    username,
    updatedAt: new Date().toISOString(),
  });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
  console.error("UPDATE PROFILE ERROR:", error);

  return NextResponse.json(
    { message: "Server error", error: String(error) },
    { status: 500 }
  );
}
}