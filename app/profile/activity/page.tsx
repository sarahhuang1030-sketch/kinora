"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  CircleUserRound,
  Clock3,
  Film,
  History,
  Smile,
  Star,
} from "lucide-react";

import AccountSidebar from "@/app/components/AccountSidebar";

type SessionUser = {
  user_id?: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  country?: string;
  date_of_birth?: string;
  profile_image?: string;
  created_at?: string;
};

type ActivityFilter =
  | "All Time"
  | "30 Days"
  | "7 Days";

type MoodTrend = {
  label: string;
  count: number;
  className: string;
};

type WatchHistoryItem = {
  id: number;
  title: string;
  year: string;
  type: string;
  mood: string;
  date: string;
  image: string;
};

type ReviewItem = {
  id: number;
  title: string;
  rating: number;
  date: string;
  tags: string[];
  review: string;
  image: string;
};

 type ActivityStats = {
  contentItemsWatched: number;
  watchlistsCreated: number;
  servicesActive: number;
  reviewsPending: number;
  moodSelections: number;
};

type ActivityApiResponse = {
  stats: ActivityStats;
  services: string[];
  moodTrends: MoodTrend[];
  weeklyMoodTrends: WeeklyMoodTrend[];
  mostCommonMood: string | null;
};

const emptyActivityStats: ActivityStats = {
  contentItemsWatched: 0,
  watchlistsCreated: 0,
  servicesActive: 0,
  reviewsPending: 0,
  moodSelections: 0,
};

type WeeklyMoodTrend = {
  day: string;
  fullDay: string;
  moodId: number | null;
  moodName: string;
  iconUrl: string | null;
  count: number;
  className: string;
};

// const moodTrends: MoodTrend[] = [
//   {
//     label: "Adventurous",
//     count: 18,
//     className: "adventurous",
//   },
//   {
//     label: "Thrilling",
//     count: 15,
//     className: "thrilling",
//   },
//   {
//     label: "Mind-Bending",
//     count: 12,
//     className: "mind-bending",
//   },
//   {
//     label: "Relaxing",
//     count: 9,
//     className: "relaxing",
//   },
//   {
//     label: "Feel Good",
//     count: 7,
//     className: "feel-good",
//   },
//   {
//     label: "Romantic",
//     count: 5,
//     className: "romantic",
//   },
// ];

const watchHistory: WatchHistoryItem[] = [
  {
    id: 1,
    title: "Oppenheimer",
    year: "2023",
    type: "Movie",
    mood: "Mind-Bending",
    date: "Today",
    image: "/posters/oppenheimer.jpg",
  },
  {
    id: 2,
    title: "Severance",
    year: "2022",
    type: "TV Series",
    mood: "Mind-Bending",
    date: "Jul 29",
    image: "/posters/severance.jpg",
  },
  {
    id: 3,
    title: "Dune: Part Two",
    year: "2024",
    type: "Movie",
    mood: "Adventurous",
    date: "Jul 27",
    image: "/posters/dune-part-two.jpg",
  },
];

const recentReviews: ReviewItem[] = [
  {
    id: 1,
    title: "Everything Everywhere All at Once",
    rating: 5,
    date: "May 4, 2026",
    tags: [
      "Funny",
      "Bold",
      "Mind-Bending",
      "Moving",
    ],
    review:
      "A wildly creative movie that somehow balances humor, emotion, and action while still feeling personal.",
    image:
      "/posters/everything-everywhere-all-at-once.jpg",
  },
  {
    id: 2,
    title: "Spider-Man: Into the Spider-Verse",
    rating: 4,
    date: "May 1, 2026",
    tags: [
      "Fun",
      "Stylish",
      "Adventurous",
    ],
    review:
      "Beautiful animation and a really fun story. The visual style makes every scene feel unique.",
    image:
      "/posters/spider-verse.jpg",
  },
];

export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <main className="profile-streaming-page">
          <div className="profile-streaming-loading">
            Loading your activity...
          </div>
        </main>
      }
    >
      <ActivityContent />
    </Suspense>
  );
}

function ActivityContent() {
  const { data: session, status } = useSession();

  const searchParams = useSearchParams();

  const sessionUser =
    session?.user as SessionUser | undefined;

  const email =
    searchParams.get("email") ||
    sessionUser?.email ||
    "";

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activityFilter, setActivityFilter] =
    useState<ActivityFilter>("30 Days");
    
    const [activityStats, setActivityStats] =
  useState<ActivityStats>(
    emptyActivityStats
  );

const [moodTrends, setMoodTrends] =
  useState<MoodTrend[]>([]);

const [activeServices, setActiveServices] =
  useState<string[]>([]);

const [mostCommonMood, setMostCommonMood] =
  useState<string | null>(null);

const [activityLoading, setActivityLoading] =
  useState(true);

  const [weeklyMoodTrends, setWeeklyMoodTrends] =
  useState<WeeklyMoodTrend[]>([]);

  useEffect(() => {
    if (
      status === "loading" ||
      !email
    ) {
      return;
    }

    let cancelled = false;

    fetch(
      `/api/profile?email=${encodeURIComponent(
        email
      )}`,
      {
        cache: "no-store",
      }
    )
      .then(async (response) => {
        const data = await response.json();

        if (
          !response.ok ||
          !data.user
        ) {
          throw new Error(
            data.error ||
              "Unable to load your profile."
          );
        }

        return data.user as User;
      })
      .then((loadedUser) => {
        if (cancelled) {
          return;
        }

        setUser(loadedUser);
        setError("");
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your profile."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status, email]);

useEffect(() => {
  if (status !== "authenticated") {
    return;
  }

  let cancelled = false;

  async function loadActivity() {
    try {
      setActivityLoading(true);

      const response = await fetch(
        "/api/activity",
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as
          Partial<ActivityApiResponse> & {
            error?: string;
          };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load your activity."
        );
      }

      if (cancelled) {
        return;
      }

      setActivityStats(
        data.stats ?? emptyActivityStats
      );

      setMoodTrends(
        Array.isArray(data.moodTrends)
          ? data.moodTrends
          : []
      );

      setWeeklyMoodTrends(
        Array.isArray(data.weeklyMoodTrends)
          ? data.weeklyMoodTrends
          : []
      );

      setActiveServices(
        Array.isArray(data.services)
          ? data.services
          : []
      );

      setMostCommonMood(
        data.mostCommonMood ?? null
      );
    } catch (activityError) {
      if (cancelled) {
        return;
      }

      console.error(
        "Unable to load activity:",
        activityError
      );

      setActivityStats(
        emptyActivityStats
      );

      setMoodTrends([]);
      setActiveServices([]);
      setMostCommonMood(null);
      setWeeklyMoodTrends([]);
    } finally {
      if (!cancelled) {
        setActivityLoading(false);
      }
    }
  }

  void loadActivity();

  return () => {
    cancelled = true;
  };
}, [status]);

  const firstName = useMemo(() => {
    return user?.first_name || "User";
  }, [user]);

 

  const stats = useMemo(
  () => [
    {
      value:
        activityStats.contentItemsWatched,
      label: "Content Items Watched",
      tag:
        activityStats.contentItemsWatched === 1
          ? "1 title marked as watched"
          : `${activityStats.contentItemsWatched} titles marked as watched`,
    },
    {
      value:
        activityStats.watchlistsCreated,
      label: "Watchlists Created",
      tag:
        activityStats.watchlistsCreated === 1
          ? "1 watchlist"
          : `${activityStats.watchlistsCreated} watchlists`,
    },
    {
      value:
        activityStats.servicesActive,
      label: "Services Active",
      tag:
        activeServices.length > 0
          ? activeServices.join(" · ")
          : "No connected services",
    },
    {
      value:
        activityStats.reviewsPending,
      label: "Reviews Pending",
      tag: "Watched without a review",
    },
    {
      value:
        activityStats.moodSelections,
      label: "Mood Selections",
      tag: mostCommonMood
        ? `Most common · ${mostCommonMood}`
        : "No watched moods yet",
    },
  ],
  [
    activityStats,
    activeServices,
    mostCommonMood,
  ]
);

  if (
    status === "loading" ||
    loading  ||
  activityLoading
  ) {
    return (
      <main className="profile-streaming-page">
        <div className="profile-streaming-loading">
          Loading your activity...
        </div>
      </main>
    );
  }

  if (!sessionUser?.email) {
    return (
      <main className="profile-streaming-page">
        <section className="profile-streaming-message-card">
          <CircleUserRound size={44} />

          <h1>
            Sign in to view your activity
          </h1>

          <p>
            See your viewing history,
            reviews, mood trends, and activity.
          </p>

          <Link href="/login">
            Sign In
          </Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-streaming-page">
        <section className="profile-streaming-message-card">
          <CircleUserRound size={44} />

          <h1>
            Activity unavailable
          </h1>

          <p>
            {error ||
              "We could not find your account information."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-streaming-page">
      <div className="profile-streaming-shell">
        <h1 className="profile-streaming-welcome">
          Welcome,{" "}
          <span>{firstName}!</span>
        </h1>

        <div className="profile-streaming-layout">
          <AccountSidebar active="activity" />

          <section className="activity-card">
            {/* HEADER */}
            <div className="activity-header">
              <div>
                <h2>Your Activity</h2>

                <p>
                  A summary of everything
                  you&apos;ve watched, saved,
                  and reviewed
                </p>
              </div>

              {/* <div className="activity-filter-tabs">
                {(
                  [
                    "7 Days",
                    "30 Days",
                    "All Time",
                  ] as ActivityFilter[]
                ).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={
                      activityFilter ===
                      filter
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActivityFilter(
                        filter
                      )
                    }
                  >
                    {filter}
                  </button>
                ))}
              </div> */}
            </div>

            {/* STATS */}
            <div className="activity-stats-card">
              {stats.map((stat) => (
                <div
                  className="activity-stat"
                  key={stat.label}
                >
                  <strong>
                    {stat.value}
                  </strong>

                  <span>
                    {stat.label}
                  </span>

                   <p>
                    {stat.tag}
                  </p>
                </div>
              ))}
            </div>

            {/* MOOD TRENDS */}
            <section className="activity-section">
  <div className="activity-section-heading">
    <div className="activity-section-title">
      <div className="activity-section-icon">
        <Smile size={17} />
      </div>

      <div>
        <h3>Mood Trends</h3>
        <p>Your most watched mood each day</p>
      </div>
    </div>
  </div>

  <div className="activity-weekly-mood-grid">
    {weeklyMoodTrends.map((mood) => (
      <div
        key={mood.day}
        className="activity-weekly-mood-column"
      >
        <div
          className={`activity-weekly-mood-card ${mood.className}`}
        >
          {mood.iconUrl && (
              <span className="activity-weekly-mood-icon">
                <img
                  src={mood.iconUrl}
                  alt=""
                />
              </span>
            )}

          <strong>{mood.moodName}</strong>
        </div>

        <span className="activity-weekly-mood-day">
          {mood.day}
        </span>
      </div>
    ))}
  </div>

  <div className="activity-mood-legend">
    <span>
      <i className="legend-thrilling" />
      Thrilling
    </span>

    <span>
      <i className="legend-feel-good" />
      Feel Good
    </span>

    <span>
      <i className="legend-spooky" />
      Spooky
    </span>

    <span>
      <i className="legend-mind" />
      Mind-Bending
    </span>
  </div>
</section>

            {/* WATCH HISTORY */}
            <section className="activity-section">
              <div className="activity-section-heading">
                <div className="activity-section-title">
                  <div className="activity-section-icon">
                    <History size={17} />
                  </div>

                  <div>
                    <h3>
                      Recent Watch History
                    </h3>
                  </div>
                </div>

                <button
                  className="activity-view-all"
                  type="button"
                >
                  View all
                </button>
              </div>

              <div className="activity-history-list">
                {watchHistory.map(
                  (item) => (
                    <div
                      className="activity-history-row"
                      key={item.id}
                    >
                      <div className="activity-history-image">
                        <img
                          src={item.image}
                          alt={item.title}
                        />
                      </div>

                      <div className="activity-history-info">
                        <h4>
                          {item.title}
                        </h4>

                        <p>
                          {item.year}
                          <span>•</span>
                          {item.type}
                        </p>

                        <span className="activity-history-mood">
                          {item.mood}
                        </span>
                      </div>

                      <span className="activity-history-date">
                        {item.date}
                      </span>

                      <button
                        type="button"
                        className="activity-watch-again"
                      >
                        Watch in Recommendations
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* RECENT REVIEWS */}
            <section className="activity-section activity-reviews-section">
              <div className="activity-section-heading">
                <div className="activity-section-title">
                  <div className="activity-section-icon">
                    <BookOpen
                      size={17}
                    />
                  </div>

                  <div>
                    <h3>
                      Recent Reviews
                    </h3>

                    <p>
                      Your latest reviews
                    </p>
                  </div>
                </div>
              </div>

              <div className="activity-review-list">
                {recentReviews.map(
                  (review) => (
                    <article
                      className="activity-review-row"
                      key={review.id}
                    >
                      <div className="activity-review-poster">
                        <img
                          src={review.image}
                          alt={review.title}
                        />
                      </div>

                      <div className="activity-review-content">
                        <div className="activity-review-top">
                          <div>
                            <h4>
                              {review.title}
                            </h4>

                            <div className="activity-review-rating">
                              {Array.from(
                                {
                                  length: 5,
                                }
                              ).map(
                                (
                                  _,
                                  index
                                ) => (
                                  <Star
                                    key={
                                      index
                                    }
                                    size={
                                      10
                                    }
                                    fill={
                                      index <
                                      review.rating
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>

                          <span>
                            {review.date}
                          </span>
                        </div>

                        <div className="activity-review-tags">
                          {review.tags.map(
                            (tag) => (
                              <span
                                key={
                                  tag
                                }
                              >
                                {tag}
                              </span>
                            )
                          )}
                        </div>

                        <p className="activity-review-text">
                          {review.review}
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}