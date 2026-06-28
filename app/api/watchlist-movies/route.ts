import { NextResponse } from 'next/server';
import pool from '@/app/src/lib/db';

export async function POST(req: Request) {
  try {
    const { watchlistId, movieId } = await req.json();

    if (!watchlistId || !movieId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await pool.execute(
      `
      INSERT INTO watchlist_movies (watchlist_id, movie_id, status)
      VALUES (?, ?, 'Want to Watch')
      `,
      [watchlistId, movieId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ADD WATCHLIST MOVIE ERROR:', error);
    return NextResponse.json({ error: 'Failed to save movie' }, { status: 500 });
  }
}