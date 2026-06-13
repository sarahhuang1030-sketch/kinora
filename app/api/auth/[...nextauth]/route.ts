import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import type { RowDataPacket } from "mysql2";
import pool from "../../../src/lib/db";

type UserRow = RowDataPacket & {
  user_id: number;
};

const handler = NextAuth({
  providers: [
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