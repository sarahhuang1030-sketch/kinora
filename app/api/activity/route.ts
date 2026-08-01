import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import pool from "@/app/src/lib/db";
import { authOptions } from "@/app/src/lib/auth";


interface UserRow extends RowDataPacket {
  user_id: number;
}

interface ActivityStatsRow extends RowDataPacket {
  content_items_watched: number | string;
  watchlists_created: number | string;
  services_active: number | string;
  reviews_pending: number | string;
  mood_selections: number | string;
}

interface ServiceRow extends RowDataPacket {
  service_name: string;
}

interface OverallMoodTrendRow extends RowDataPacket {
  mood_name: string;
  watched_count: number | string;
}

interface WeeklyMoodTrendRow extends RowDataPacket {
  day_number: number | string;
  mood_id: number;
  mood_name: string;
  icon_url: string | null;
  watched_count: number | string;
}

async function getLoggedInUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const [users] = await pool.execute<UserRow[]>(
    `
      SELECT user_id
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [session.user.email]
  );

  return users[0]?.user_id ?? null;
}

export async function GET() {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    /*
     * Count distinct movie IDs so the same movie is not
     * counted twice if it appears in multiple watchlists.
     */
    const [statsRows] =
      await pool.execute<ActivityStatsRow[]>(
        `
          SELECT
            (
              SELECT COUNT(
                DISTINCT watched_movies.movie_id
              )

              FROM watchlist_movies watched_movies

              INNER JOIN watchlists watched_lists
                ON watched_lists.watchlist_id =
                  watched_movies.watchlist_id

              WHERE watched_lists.user_id = ?
                AND LOWER(
                  COALESCE(
                    watched_movies.status,
                    ''
                  )
                ) = 'completed'
            ) AS content_items_watched,

            (
              SELECT COUNT(*)

              FROM watchlists

              WHERE user_id = ?
            ) AS watchlists_created,

            (
              SELECT COUNT(*)

              FROM user_connected_services

              WHERE user_id = ?
            ) AS services_active,

            (
              SELECT COUNT(
                DISTINCT watched_movies.movie_id
              )

              FROM watchlist_movies watched_movies

              INNER JOIN watchlists watched_lists
                ON watched_lists.watchlist_id =
                  watched_movies.watchlist_id

              LEFT JOIN movie_comments reviews
                ON reviews.movie_id =
                  watched_movies.movie_id
                AND reviews.user_id =
                  watched_lists.user_id

              WHERE watched_lists.user_id = ?
                AND LOWER(
                  COALESCE(
                    watched_movies.status,
                    ''
                  )
                ) = 'completed'
                AND reviews.comment_id IS NULL
            ) AS reviews_pending,

            (
              SELECT COUNT(*)

              FROM (
                SELECT DISTINCT
                  watched_movies.movie_id,
                  movie_mood.mood_id

                FROM watchlist_movies watched_movies

                INNER JOIN watchlists watched_lists
                  ON watched_lists.watchlist_id =
                    watched_movies.watchlist_id

                INNER JOIN movie_moods movie_mood
                  ON movie_mood.movie_id =
                    watched_movies.movie_id

                WHERE watched_lists.user_id = ?
                  AND LOWER(
                    COALESCE(
                      watched_movies.status,
                      ''
                    )
                  ) = 'completed'
              ) AS watched_mood_pairs
            ) AS mood_selections
        `,
        [
          userId,
          userId,
          userId,
          userId,
          userId,
        ]
      );

    const [serviceRows] =
      await pool.execute<ServiceRow[]>(
        `
          SELECT service_name

          FROM user_connected_services

          WHERE user_id = ?

          ORDER BY service_name
        `,
        [userId]
      );

    const [moodRows] =
      await pool.execute<OverallMoodTrendRow[]>(
        `
          SELECT
            moods.mood_name,

            COUNT(
              DISTINCT watched_movies.movie_id
            ) AS watched_count

          FROM watchlist_movies watched_movies

          INNER JOIN watchlists watched_lists
            ON watched_lists.watchlist_id =
              watched_movies.watchlist_id

          INNER JOIN movie_moods movie_mood
            ON movie_mood.movie_id =
              watched_movies.movie_id

          INNER JOIN moods
            ON moods.mood_id =
              movie_mood.mood_id

          WHERE watched_lists.user_id = ?
            AND LOWER(
              COALESCE(
                watched_movies.status,
                ''
              )
            ) = 'completed'

          GROUP BY
            moods.mood_id,
            moods.mood_name

          ORDER BY
            watched_count DESC,
            moods.mood_name ASC
        `,
        [userId]
      );

const [weeklyMoodRows] =
  await pool.execute<WeeklyMoodTrendRow[]>(
    `
      WITH daily_mood_counts AS (
        SELECT
          WEEKDAY(
            watched_movies.added_at
          ) AS day_number,

          moods.mood_id,
          moods.mood_name,
          moods.icon_url,

          COUNT(
            DISTINCT watched_movies.movie_id
          ) AS watched_count

        FROM watchlist_movies watched_movies

        INNER JOIN watchlists watched_lists
          ON watched_lists.watchlist_id =
            watched_movies.watchlist_id

        INNER JOIN movie_moods movie_mood
          ON movie_mood.movie_id =
            watched_movies.movie_id

        INNER JOIN moods
          ON moods.mood_id =
            movie_mood.mood_id

        WHERE watched_lists.user_id = ?

          AND LOWER(
            COALESCE(
              watched_movies.status,
              ''
            )
          ) = 'completed'

          AND watched_movies.added_at >=
            DATE_SUB(
              CURDATE(),
              INTERVAL WEEKDAY(
                CURDATE()
              ) DAY
            )

          AND watched_movies.added_at <
            DATE_ADD(
              DATE_SUB(
                CURDATE(),
                INTERVAL WEEKDAY(
                  CURDATE()
                ) DAY
              ),
              INTERVAL 7 DAY
            )

        GROUP BY
          WEEKDAY(
            watched_movies.added_at
          ),
          moods.mood_id,
          moods.mood_name,
          moods.icon_url
      ),

      ranked_daily_moods AS (
        SELECT
          day_number,
          mood_id,
          mood_name,
          icon_url,
          watched_count,

          ROW_NUMBER() OVER (
            PARTITION BY day_number

            ORDER BY
              watched_count DESC,
              mood_name ASC
          ) AS mood_rank

        FROM daily_mood_counts
      )

      SELECT
        day_number,
        mood_id,
        mood_name,
        icon_url,
        watched_count

      FROM ranked_daily_moods

      WHERE mood_rank = 1

      ORDER BY day_number
    `,
    [userId]
  );

    const stats = statsRows[0];

    const weekDays = [
  {
    dayNumber: 0,
    day: "Mon",
    fullDay: "Monday",
  },
  {
    dayNumber: 1,
    day: "Tue",
    fullDay: "Tuesday",
  },
  {
    dayNumber: 2,
    day: "Wed",
    fullDay: "Wednesday",
  },
  {
    dayNumber: 3,
    day: "Thu",
    fullDay: "Thursday",
  },
  {
    dayNumber: 4,
    day: "Fri",
    fullDay: "Friday",
  },
  {
    dayNumber: 5,
    day: "Sat",
    fullDay: "Saturday",
  },
  {
    dayNumber: 6,
    day: "Sun",
    fullDay: "Sunday",
  },
];

const weeklyMoodTrends = weekDays.map(
  (day) => {
    const matchingMood =
      weeklyMoodRows.find(
        (mood) =>
          Number(mood.day_number) ===
          day.dayNumber
      );

    return {
      day: day.day,
      fullDay: day.fullDay,

      moodId:
        matchingMood?.mood_id ?? null,

      moodName:
        matchingMood?.mood_name ??
        "No Selection",

        iconUrl:
  matchingMood?.icon_url ?? null,

      count: Number(
        matchingMood?.watched_count ?? 0
      ),

      className: matchingMood
        ? matchingMood.mood_name
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(/^-|-$/g, "")
        : "no-selection",
    };
  }
);

    const moodTrends = moodRows.map(
      (mood) => ({
        label: mood.mood_name,
        count: Number(
          mood.watched_count ?? 0
        ),
        className: mood.mood_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      })
    );

    return NextResponse.json({
      stats: {
        contentItemsWatched: Number(
          stats?.content_items_watched ?? 0
        ),

        watchlistsCreated: Number(
          stats?.watchlists_created ?? 0
        ),

        servicesActive: Number(
          stats?.services_active ?? 0
        ),

        reviewsPending: Number(
          stats?.reviews_pending ?? 0
        ),

        moodSelections: Number(
          stats?.mood_selections ?? 0
        ),
      },

      services: serviceRows.map(
        (service) => service.service_name
      ),

      moodTrends,

      weeklyMoodTrends,

      mostCommonMood:
        moodTrends[0]?.label ?? null,
    });
  } catch (error) {
    console.error(
      "GET ACTIVITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load your activity.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}