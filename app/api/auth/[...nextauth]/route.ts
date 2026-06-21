import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import type { RowDataPacket } from "mysql2";
import pool from "../../../src/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

type UserRow = RowDataPacket & {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

const handler = NextAuth({
  providers: [

    CredentialsProvider({
  name: "Credentials",
  credentials: {
    login: { label: "Email or Username", type: "text" },
    password: { label: "Password", type: "password" },
  },

  async authorize(credentials) {
    const login = credentials?.login || credentials?.email || credentials?.username;
    const password = credentials?.password;

    if (!login || !password) return null;

    const [users]: any = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = ? OR username = ?
      LIMIT 1
      `,
      [login, login]
    );

    const user = users[0];

    if (!user) return null;

    if (String(user.password) !== String(password)) {
      return null;
    }

    return {
      id: String(user.user_id),
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
    };
  },
}),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const email = user.email;
      const fullName = user.name || "";
      const firstName = fullName.split(" ")[0] || "";
      const lastName = fullName.split(" ").slice(1).join(" ") || "";
      const baseUsername = email.split("@")[0];

      try {
        const [existingUsers] = await pool.query<UserRow[]>(
          "SELECT user_id FROM users WHERE email = ?",
          [email]
        );

        if (existingUsers.length === 0) {
          let username = baseUsername;

          const [sameUsername] = await pool.query<UserRow[]>(
            "SELECT user_id FROM users WHERE username = ?",
            [username]
          );

          if (sameUsername.length > 0) {
            username = `${baseUsername}_${Date.now()}`;
          }

          await pool.query(
            `INSERT INTO users
            (first_name, last_name, username, email, phone, password)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              firstName,
              lastName,
              username,
              email,
              "",
              `${account?.provider}-login`,
            ]
          );
        }

        return true;
      } catch (error) {
        console.error("Social login DB error:", error);
        return false;
      }
    },

    async session({ session }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };