import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import type { RowDataPacket } from "mysql2";
import pool from "../../../src/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/src/lib/auth";

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

const handler = NextAuth(authOptions);


export { handler as GET, handler as POST };