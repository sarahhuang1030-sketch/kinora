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
  X,
  Check,
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
  date: string | null;
  image: string;
  hasReview: boolean;
};

type ReviewItem = {
  id: number;
  movieId: number;
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
  recentWatchHistory: WatchHistoryItem[];
  recentReviews: ReviewItem[];
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

// const watchHistory: WatchHistoryItem[] = [
//   {
//     id: 1,
//     title: "Oppenheimer",
//     year: "2023",
//     type: "Movie",
//     mood: "Mind-Bending",
//     date: "Today",
//     image: "/posters/oppenheimer.jpg",
//   },
//   {
//     id: 2,
//     title: "Severance",
//     year: "2022",
//     type: "TV Series",
//     mood: "Mind-Bending",
//     date: "Jul 29",
//     image: "/posters/severance.jpg",
//   },
//   {
//     id: 3,
//     title: "Dune: Part Two",
//     year: "2024",
//     type: "Movie",
//     mood: "Adventurous",
//     date: "Jul 27",
//     image: "/posters/dune-part-two.jpg",
//   },
// ];

// const recentReviews: ReviewItem[] = [
//   {
//     id: 1,
//     title: "Everything Everywhere All at Once",
//     rating: 5,
//     date: "May 4, 2026",
//     tags: [
//       "Funny",
//       "Bold",
//       "Mind-Bending",
//       "Moving",
//     ],
//     review:
//       "A wildly creative movie that somehow balances humor, emotion, and action while still feeling personal.",
//     image:
//       "/posters/everything-everywhere-all-at-once.jpg",
//   },
//   {
//     id: 2,
//     title: "Spider-Man: Into the Spider-Verse",
//     rating: 4,
//     date: "May 1, 2026",
//     tags: [
//       "Fun",
//       "Stylish",
//       "Adventurous",
//     ],
//     review:
//       "Beautiful animation and a really fun story. The visual style makes every scene feel unique.",
//     image:
//       "/posters/spider-verse.jpg",
//   },
// ];

function formatWatchDate(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return `Today ${date.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    )}`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
}

const watchedTagGroups = [
  {
    label: "INTENSITY",
    tags: [
      "Relaxing",
      "Engaging",
      "Suspenseful",
      "Unsettling",
      "Gripping",
      "Intense",
      "Edge-of-Your-Seat",
    ],
  },
  {
    label: "COMPLEXITY",
    tags: [
      "Easy Watch",
      "Straightforward",
      "Thought-Provoking",
      "Complex",
      "Mind-Bending",
      "Challenging",
    ],
  },
  {
    label: "EMOTIONAL IMPACT",
    tags: [
      "Feel-Good",
      "Heartwarming",
      "Hopeful",
      "Emotional",
      "Bittersweet",
      "Heavy",
      "Heartbreaking",
    ],
  },
  {
    label: "VISUAL IMPACT",
    tags: [
      "Classic Style",
      "Atmospheric",
      "Stylish",
      "Cinematic",
      "Immersive",
      "Breathtaking",
    ],
  },
  {
    label: "PACING",
    tags: [
      "Slow Burn",
      "Steady Pace",
      "Fast-Paced",
      "Action-Packed",
      "Nonstop Action",
    ],
  },
  {
    label: "WATCH CONTEXT",
    tags: [
      "Solo Watch",
      "Date Night",
      "Family Friendly",
      "Great for Groups",
      "Party Movie",
    ],
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


  const [
  recentWatchHistory,
  setRecentWatchHistory,
] = useState<WatchHistoryItem[]>([]);

const [
  updatingHistoryId,
  setUpdatingHistoryId,
] = useState<number | null>(null);


const [
  selectedReviewMovie,
  setSelectedReviewMovie,
] = useState<WatchHistoryItem | null>(null);

const [reviewRating, setReviewRating] =
  useState(0);

const [reviewTags, setReviewTags] =
  useState<string[]>([]);

const [reviewText, setReviewText] =
  useState("");

const [wouldRecommend, setWouldRecommend] =
  useState(true);

const [reviewPopupError, setReviewPopupError] =
  useState("");

const [submittingReview, setSubmittingReview] =
  useState(false);

  const [
  recentReviews,
  setRecentReviews,
] = useState<ReviewItem[]>([]);

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

      setRecentWatchHistory(
      Array.isArray(data.recentWatchHistory)
        ? data.recentWatchHistory
        : []
    );

    setRecentReviews(
  Array.isArray(data.recentReviews)
    ? data.recentReviews
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
      setRecentWatchHistory([]);
      setRecentReviews([]);
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

function openReviewPopup(
  item: WatchHistoryItem
) {
  setSelectedReviewMovie(item);
  setReviewRating(0);
  setReviewTags([]);
  setReviewText("");
  setWouldRecommend(true);
  setReviewPopupError("");
}

function closeReviewPopup() {
  if (submittingReview) {
    return;
  }

  setSelectedReviewMovie(null);
  setReviewRating(0);
  setReviewTags([]);
  setReviewText("");
  setWouldRecommend(true);
  setReviewPopupError("");
}

function toggleReviewTag(tag: string) {
  setReviewTags((current) =>
    current.includes(tag)
      ? current.filter(
          (currentTag) =>
            currentTag !== tag
        )
      : [...current, tag]
  );
}

async function handleSubmitActivityReview(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (!selectedReviewMovie) {
    return;
  }

  if (!sessionUser?.user_id) {
    setReviewPopupError(
      "Your user account could not be identified."
    );
    return;
  }

  if (reviewRating === 0) {
    setReviewPopupError(
      "Please choose a rating before submitting."
    );
    return;
  }

  try {
    setSubmittingReview(true);
    setReviewPopupError("");

    const response = await fetch(
      `/api/movie/${selectedReviewMovie.id}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: sessionUser.user_id,
          rating: reviewRating,
          commentText: reviewText.trim(),
          tags: reviewTags,
          wouldRecommend,
        }),
      }
    );

    const result = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Unable to save your review."
      );
    }

    setRecentWatchHistory((current) =>
      current.map((item) =>
        item.id ===
        selectedReviewMovie.id
          ? {
              ...item,
              hasReview: true,
            }
          : item
      )
    );

    setActivityStats((current) => ({
      ...current,
      reviewsPending: Math.max(
        0,
        current.reviewsPending - 1
      ),
    }));

    const submittedMovie =
  selectedReviewMovie;

setRecentReviews((current) => [
  {
    id: Number(
      result?.commentId ||
        Date.now()
    ),

    movieId:
      submittedMovie.id,

    title:
      submittedMovie.title,

    rating:
      reviewRating,

    date:
      new Date().toISOString(),

    tags:
      reviewTags,

    review:
      reviewText.trim(),

    image:
      submittedMovie.image ||
      "/placeholder.jpg",
  },

  ...current.filter(
    (review) =>
      review.movieId !==
      submittedMovie.id
  ),
].slice(0, 3));

   setSelectedReviewMovie(null);
    setReviewRating(0);
    setReviewTags([]);
    setReviewText("");
    setWouldRecommend(true);
    setReviewPopupError("");
  } catch (reviewError) {
    setReviewPopupError(
      reviewError instanceof Error
        ? reviewError.message
        : "Unable to save your review."
    );
  } finally {
    setSubmittingReview(false);
  }
}

async function handleMarkAsUnwatched(
  movieId: number
) {
  try {
    setUpdatingHistoryId(movieId);
    setError("");

    const selectedItem =
      recentWatchHistory.find(
        (item) => item.id === movieId
      );

    const response = await fetch(
      "/api/watchlist-movies/status",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          movieId,
          status: "Want to Watch",
        }),
      }
    );

    const result = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Unable to mark this title as unwatched."
      );
    }

    setRecentWatchHistory((current) =>
      current.filter(
        (item) => item.id !== movieId
      )
    );

    setActivityStats((current) => ({
      ...current,

      contentItemsWatched: Math.max(
        0,
        current.contentItemsWatched - 1
      ),

      reviewsPending: Math.max(
        0,
        current.reviewsPending -
          (selectedItem?.hasReview ? 0 : 1)
      ),
    }));
  } catch (unwatchError) {
    setError(
      unwatchError instanceof Error
        ? unwatchError.message
        : "Unable to update watch history."
    );
  } finally {
    setUpdatingHistoryId(null);
  }
}

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
        <p>Mood selections over the last 7 days</p>
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
    <span>
      <i className="legend-romantic" />
      Romantic
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
                    <p>
  Content you marked as watched.
</p>
                  </div>
                </div>

                {/* <button
                  className="activity-view-all"
                  type="button"
                >
                  View all
                </button> */}
              </div>

              <div className="activity-history-list">
  {recentWatchHistory.length === 0 ? (
    <div className="activity-history-empty">
      <History size={28} />

      <div>
        <h4>No watch history yet</h4>

        <p>
          Titles you mark as watched
          will appear here.
        </p>
      </div>
    </div>
  ) : (
    recentWatchHistory.map((item) => (
      <div
        className="activity-history-row"
        key={item.id}
      >
        <Link
          href={`/movie/${item.id}`}
          className="activity-history-image"
        >
          <img
            src={
              item.image ||
              "/placeholder.jpg"
            }
            alt={item.title}
          />
        </Link>

        <div className="activity-history-info">
          <Link
            href={`/movie/${item.id}`}
          >
            <h4>{item.title}</h4>
          </Link>

          <p>
            {item.year && (
              <>
                {item.year}
                <span>•</span>
              </>
            )}

            {item.type}
          </p>

          <strong className="activity-history-status">
            WATCHED
          </strong>

          {item.hasReview ? (
            <span className="activity-history-review-added">
              Review added
            </span>
          ) : (
            <span className="activity-history-review-missing">
              No review left ·{" "}

             <button
                type="button"
                className="activity-add-review-button"
                onClick={() =>
                  openReviewPopup(item)
                }
              >
                Add Review
              </button>
            </span>
          )}
        </div>
<div className="activity-history-actions">
        <span className="activity-history-date">
          {formatWatchDate(item.date)}
        </span>

        <button
          type="button"
          className="activity-watch-again"
          disabled={
            updatingHistoryId === item.id
          }
          onClick={() =>
            void handleMarkAsUnwatched(
              item.id
            )
          }
        >
          {updatingHistoryId === item.id
            ? "Updating..."
            : "Mark as Unwatched"}
        </button>
        </div>
      </div>
    ))
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
  {recentReviews.length === 0 ? (
    <div className="activity-review-empty">
      <div>
        <h4>No reviews yet</h4>

        <p>
          Reviews you submit will appear
          here.
        </p>
      </div>
    </div>
  ) : (
    recentReviews.map((review) => (
      <article
        className="activity-review-row"
        key={review.id}
      >
        <Link
          href={`/movie/${review.movieId}`}
          className="activity-review-poster"
        >
          <img
            src={
              review.image ||
              "/placeholder.jpg"
            }
            alt={review.title}
          />
        </Link>

        <div className="activity-review-content">
          <div className="activity-review-top">
            <div className="activity-review-summary">
              <Star
                size={16}
                fill="currentColor"
              />

              <strong>
                {review.rating.toFixed(1)}
              </strong>

              <span>review for</span>

              <Link
                href={`/movie/${review.movieId}`}
              >
                {review.title}
              </Link>
            </div>

            <time
              dateTime={review.date}
              className="activity-review-date"
            >
              {formatWatchDate(
                review.date
              )}
            </time>
          </div>

          {Array.isArray(review.tags) &&
  review.tags.length > 0 && (
            <div className="activity-review-tags">
              {review.tags.map((tag) => (
                <span key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {review.review && (
            <div className="activity-review-comment">
              <span>Your Comments:</span>

              <p>{review.review}</p>
            </div>
          )}
        </div>
      </article>
    ))
  )}
</div>
            </section>
          </section>
        </div>
      </div>
      {selectedReviewMovie && (
  <div
    className="movie-watched-review-overlay"
    onClick={closeReviewPopup}
  >
    <form
      className="movie-watched-review-modal"
      onSubmit={handleSubmitActivityReview}
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        className="movie-watched-review-close"
        onClick={closeReviewPopup}
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div className="movie-watched-review-heading">
        <span>YOU WATCHED IT</span>

        <h2>
          How did you like{" "}
          <strong>
            {selectedReviewMovie.title}?
          </strong>
        </h2>

        <p>
          Share your thoughts to get better
          recommendations and help others decide
          what to watch.
        </p>
      </div>

      <section className="movie-watched-review-section">
        <h3>Your rating</h3>

        <p>
          How much did you enjoy{" "}
          {selectedReviewMovie.title}?
        </p>

        <div className="movie-watched-review-stars">
          {[1, 2, 3, 4, 5].map(
            (rating) => (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  setReviewRating(rating)
                }
                className={
                  reviewRating >= rating
                    ? "active"
                    : ""
                }
                aria-label={`${rating} star rating`}
              >
                <Star
                  size={32}
                  fill={
                    reviewRating >= rating
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            )
          )}
        </div>
      </section>

      <section className="movie-watched-review-section">
        <h3>
          How did it make you feel?
        </h3>

        <p>
          Select all mood tags that match your
          viewing experience. Your choices help
          Cineri personalize your recommendations.
        </p>

        <div className="movie-watched-review-tag-groups">
          {watchedTagGroups.map(
            (group) => (
              <div
                className="movie-watched-review-tag-group"
                key={group.label}
              >
                <span className="movie-watched-review-tag-label">
                  {group.label}
                </span>

                <div className="movie-watched-review-tags">
                  {group.tags.map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={
                          reviewTags.includes(tag)
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleReviewTag(tag)
                        }
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="movie-watched-review-section">
        <h3>Your review</h3>

        <p>
          What did you love? What surprised you?
          You don&apos;t need to write a formal
          review - just be honest.
        </p>

        <textarea
          value={reviewText}
          onChange={(event) =>
            setReviewText(event.target.value)
          }
          placeholder="Start typing here..."
          maxLength={1000}
          rows={5}
        />

        <small>
          {reviewText.length}/1000 characters
        </small>
      </section>

      <section className="movie-watched-review-recommend">
        <div>
          <h3>
            Would you recommend this?
          </h3>

          <p>
            Let others know if you think they
            should watch it.
          </p>
        </div>

        <button
          type="button"
          className={`movie-watched-review-toggle ${
            wouldRecommend ? "active" : ""
          }`}
          onClick={() =>
            setWouldRecommend(
              (current) => !current
            )
          }
          aria-pressed={wouldRecommend}
        >
          <span />
        </button>
      </section>

      {reviewPopupError && (
        <p className="movie-detail-review-error">
          {reviewPopupError}
        </p>
      )}

      <div className="movie-watched-review-actions">
        <button
          type="button"
          onClick={closeReviewPopup}
          disabled={submittingReview}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submittingReview}
        >
          <Check size={15} />

          {submittingReview
            ? "Submitting..."
            : "Submit review"}
        </button>
      </div>
    </form>
  </div>
)}
    </main>
  );
}