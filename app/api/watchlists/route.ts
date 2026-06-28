import { NextResponse } from 'next/server';
import pool from "@/app/src/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const [rows] = await pool.execute(
        `
        SELECT 
            w.watchlist_id,
            w.name,
            COUNT(wm.movie_id) AS total_titles,
            COALESCE(SUM(CASE WHEN wm.status = 'Completed' THEN 1 ELSE 0 END), 0) AS watched_count
        FROM watchlists w
        LEFT JOIN watchlist_movies wm 
            ON w.watchlist_id = wm.watchlist_id
        WHERE w.user_id = ?
        GROUP BY w.watchlist_id, w.name
        ORDER BY w.watchlist_id;
        `,
        [userId]
        );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET WATCHLISTS ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to load watchlists' },
      { status: 500 }
    );
  }
}