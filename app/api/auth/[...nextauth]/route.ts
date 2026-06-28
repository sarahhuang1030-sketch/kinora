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

type AuthUser = {
  user_id?: number;
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
    const login = credentials?.login;
    const password = credentials?.password;

    if (!login || !password) {
      return null;
    }
    const [users] = await pool.query<UserRow[]>(
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
      user_id: user.user_id,
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
  async jwt({ token, user }) {
    if (user) {
      token.user_id = (user as AuthUser).user_id;
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      (session.user as AuthUser).user_id = token.user_id as number;
    }

    return session;
  },
},
});

export { handler as GET, handler as POST };