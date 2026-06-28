import { NextResponse } from 'next/server';
import pool from '@/app/src/lib/db';

export async function POST(req: Request) {
  try {
    const { movieId } = await req.json();

    await pool.execute(
      `
      DELETE FROM watchlist_movies
      WHERE movie_id = ?
      `,
      [movieId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to remove movie' },
      { status: 500 }
    );
  }
}