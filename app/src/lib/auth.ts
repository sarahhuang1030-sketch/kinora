import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import type { RowDataPacket } from "mysql2";
import pool from "@/app/src/lib/db";

type UserRow = RowDataPacket & {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
};

type AuthUser = {
  id?: string;
  user_id?: number;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        login: {
          label: "Email or Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const login = credentials?.login?.trim();
        const password = credentials?.password;

        if (!login || !password) {
          return null;
        }

        const [users] = await pool.query<UserRow[]>(
          `
            SELECT
              user_id,
              first_name,
              last_name,
              username,
              email,
              password
            FROM users
            WHERE email = ?
               OR username = ?
            LIMIT 1
          `,
          [login, login]
        );

        const user = users[0];

        if (!user) {
          return null;
        }

        if (String(user.password) !== String(password)) {
          return null;
        }

        return {
          id: String(user.user_id),
          user_id: user.user_id,
          name:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.username,
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

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;

        token.user_id =
          authUser.user_id ??
          (authUser.id ? Number(authUser.id) : undefined);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (
          session.user as typeof session.user & {
            user_id?: number;
          }
        ).user_id = token.user_id as number;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};