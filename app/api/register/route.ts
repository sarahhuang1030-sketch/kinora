import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

type UserRow = RowDataPacket & {
  user_id: number;
  username: string;
  email: string;
};

export async function POST(req: Request) {
  try {
    const {
  firstName,
  lastName,
  username,
  email,
  phone,
  password,
  country,
  dateOfBirth,
} = await req.json();

console.log("REGISTER DATA", {
  firstName,
  lastName,
  username,
  email,
  phone,
  country,
  dateOfBirth,
});

  if (!firstName?.trim()) {
      return NextResponse.json({ message: "First name is required" }, { status: 400 });
    }

   if (!lastName?.trim()) {
      return NextResponse.json({ message: "Last name is required" }, { status: 400 });
    }

   if (
        !firstName?.trim() ||
        !lastName?.trim() ||
        !username?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !country?.trim() ||
        !dateOfBirth ||
        !password
      ) {
        return NextResponse.json(
          { message: "Please fill in all required fields" },
          { status: 400 }
        );
      }

    if (username.trim().length < 3) {
      return NextResponse.json({ message: "Username must be at least 3 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address" }, { status: 400 });
    }

    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;

    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ message: "Please enter a valid phone number" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanCountry = country.trim();
    const cleanPassword = password.trim();
    const cleanDateOfBirth = dateOfBirth;

    const [existingUsers] = await pool.execute<UserRow[]>(
  "SELECT user_id, username, email FROM users WHERE email = ? OR username = ?",
  [cleanEmail, cleanUsername]
);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      if (existingUser.email === email) {
        return NextResponse.json({ message: "Email already registered" }, { status: 409 });
      }

      if (existingUser.username === username) {
        return NextResponse.json({ message: "Username already taken" }, { status: 409 });
      }
    }

    const [result] = await pool.execute<ResultSetHeader>(
  `
  INSERT INTO users
(
  first_name,
  last_name,
  username,
  email,
  phone,
  password,
  country,
  date_of_birth
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
  cleanFirstName,
  cleanLastName,
  cleanUsername,
  cleanEmail,
  cleanPhone,
  cleanPassword,
  cleanCountry,
  cleanDateOfBirth,
]
);

console.log("NEW USER REGISTERED", {
  userId: result.insertId,
  username: username.trim(),
  email: email.trim(),
  createdAt: new Date().toISOString(),
});

return NextResponse.json({
  message: "Registration successful",
  userId: result.insertId,
});
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}