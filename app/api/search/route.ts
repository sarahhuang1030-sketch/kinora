import { NextResponse } from "next/server";
import pool from "../../src/lib/db";
import { RowDataPacket } from "mysql2";

type Movie = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  const [movies] = await pool.query<Movie[]>(
  `
  SELECT movie_id, title, release_year
  FROM movies
  WHERE title LIKE ?
  LIMIT 6
  `,
  [`%${query}%`]
);

  return NextResponse.json(movies);
}