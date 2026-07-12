import { NextResponse } from 'next/server';
import pool from '@/app/src/lib/db';

export async function POST(req: Request) {
  try {
    const { watchlistId, movieId } = await req.json();

    if (!watchlistId || !movieId) {
      return NextResponse.json(
        { error: 'Missing watchlistId or movieId' },
        { status: 400 }
      );
    }

    await pool.execute(
      `
        DELETE FROM watchlist_movies
        WHERE watchlist_id = ?
          AND movie_id = ?
      `,
      [watchlistId, movieId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('REMOVE WATCHLIST MOVIE ERROR:', error);

    return NextResponse.json(
      { error: 'Failed to remove movie' },
      { status: 500 }
    );
  }
}