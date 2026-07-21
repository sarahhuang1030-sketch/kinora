"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Film,
  Mail,
  MessageCircle,
  Play,
  Share2,
  Star,
  X,
} from "lucide-react";
import MovieWatchlistButton from "../../components/MovieWatchlistButton";
import { FaFacebookF } from "react-icons/fa6";
import { useSession } from "next-auth/react";

type Movie = {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  trailer_url: string | null;
  content_type_id: number | null;
  content_type: string | null;
  source: string | null;
 author: string | null;
 creators: {
  name: string;
  role: string;
  photo_url: string | null;
}[];

  performers: {
    name: string;
    photo_url: string | null;
  }[];

  broadcaster: string | null;
  genres: string[];
  moods: string[];
  logo_url: string | null;
  award_name: string | null;
  worldwide_gross: number | null;
  award_count: number;
  featured_award: string | null;
  featured_award_year: number | null;
};



type SimilarMovie = {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  content_type: string | null;
  broadcaster: string | null;
  genres: string[];
  match_score: number;
};

type MovieReview = {
  comment_id: number;
  movie_id: number;
  user_id: number;
  rating: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  reviewer_name?: string | null;
};

type UserProfileAnswers = {
  genres: string[];
  streamingServices: string[];
  contentTypes: string[];
  excludedContentTypes: string[];
  preferences: string[];
};

type MatchReason = {
  label: string;
  value: number;
};

type MovieMatch = {
  overall: number;
  reasons: MatchReason[];
};

const emptyMovieMatch: MovieMatch = {
  overall: 0,
  reasons: [],
};

function normalizeMatchValue(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[+]/g, " plus")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateListOverlap(
  movieValues: string[],
  userValues: string[]
) {
  if (movieValues.length === 0 || userValues.length === 0) {
    return 0;
  }

  const normalizedMovieValues = movieValues.map(
    normalizeMatchValue
  );

  const normalizedUserValues = new Set(
    userValues.map(normalizeMatchValue)
  );

  const matchingValues = normalizedMovieValues.filter((value) =>
    normalizedUserValues.has(value)
  );

  /*
   * Score is based on how many of this movie's values
   * match the user's selected values.
   */
  return Math.round(
    (matchingValues.length / normalizedMovieValues.length) * 100
  );
}

function calculateSingleValueMatch(
  movieValue: string | null | undefined,
  userValues: string[]
) {
  if (!movieValue || userValues.length === 0) {
    return 0;
  }

  const normalizedMovieValue =
    normalizeMatchValue(movieValue);

  const matches = userValues.some(
    (userValue) =>
      normalizeMatchValue(userValue) === normalizedMovieValue
  );

  return matches ? 100 : 0;
}

function getPriorityWeight(
  savedPreferences: string[],
  keywords: string[]
) {
  const normalizedPreferences =
    savedPreferences.map(normalizeMatchValue);

  const isPriority = normalizedPreferences.some((preference) =>
    keywords.some((keyword) =>
      preference.includes(normalizeMatchValue(keyword))
    )
  );

  /*
   * A selected priority counts twice in the final score.
   */
  return isPriority ? 2 : 1;
}

function formatRuntime(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return "Runtime unavailable";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getYouTubeEmbedUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}


function formatWorldwideGross(
  amount: number | string | null | undefined
) {
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    return "N/A";
  }

  if (numericAmount >= 1_000_000_000) {
    const billions = numericAmount / 1_000_000_000;

    return `$${billions.toFixed(
      billions >= 10 ? 0 : 1
    )}B`;
  }

  if (numericAmount >= 1_000_000) {
    const millions = numericAmount / 1_000_000;

    return `$${millions.toFixed(
      millions >= 10 ? 0 : 1
    )}M`;
  }

  if (numericAmount >= 1_000) {
    return `$${Math.round(numericAmount / 1_000)}K`;
  }

  return `$${numericAmount.toLocaleString()}`;
}

export default function MovieDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  
const { data: session } = useSession();

const [reviews, setReviews] = useState<MovieReview[]>([]);
const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
const [reviewRating, setReviewRating] = useState(5);
const [reviewText, setReviewText] = useState("");
const [reviewError, setReviewError] = useState("");
const [reviewMessage, setReviewMessage] = useState("");
const [isSubmittingReview, setIsSubmittingReview] = useState(false);

const [movieMatch, setMovieMatch] =
  useState<MovieMatch>(emptyMovieMatch);

const [isMatchLoading, setIsMatchLoading] =
  useState(false);

useEffect(() => {
  if (!id) {
    return;
  }

  let cancelled = false;

  async function loadMoviePage() {
    try {
      setIsLoading(true);
      setPageError("");

      const [movieResponse, similarResponse] =
        await Promise.all([
          fetch(`/api/movie/${id}`, {
            cache: "no-store",
          }),
          fetch(`/api/movie/${id}/similar`, {
            cache: "no-store",
          }),
        ]);

      if (!movieResponse.ok) {
        const result = await movieResponse
          .json()
          .catch(() => null);

        throw new Error(
          result?.details ||
            result?.error ||
            `Unable to load movie (${movieResponse.status}).`
        );
      }

      const movieData: Movie =
        await movieResponse.json();

      let similarData: SimilarMovie[] = [];

      if (similarResponse.ok) {
        const result = await similarResponse.json();

        similarData = Array.isArray(result)
          ? result
          : [];
      } else {
        const result = await similarResponse
          .json()
          .catch(() => null);

        console.error(
          "Similar movies API error:",
          result?.details ||
            result?.error ||
            similarResponse.statusText
        );
      }

      if (!cancelled) {
        setMovie(movieData);
        setSimilarMovies(similarData);
      }
    } catch (error) {
      console.error(
        "Unable to load movie detail page:",
        error
      );

      if (!cancelled) {
        setMovie(null);
        setSimilarMovies([]);

        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load this movie."
        );
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  void loadMoviePage();

  return () => {
    cancelled = true;
  };
}, [id]);

useEffect(() => {
  if (!id) {
    return;
  }

  let cancelled = false;

  async function fetchReviews() {
    try {
      const response = await fetch(`/api/movie/${id}/reviews`, {
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.details ||
            result?.error ||
            "Unable to load reviews."
        );
      }

      if (!cancelled) {
        setReviews(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Unable to load reviews:", error);

      if (!cancelled) {
        setReviews([]);
      }
    }
  }

  void fetchReviews();

  return () => {
    cancelled = true;
  };
}, [id]);

useEffect(() => {
  const email = session?.user?.email ?? "";

  if (!email || !movie) {
    return;
  }

  // TypeScript now knows this is definitely a Movie.
  const movieForMatch: Movie = movie;

  let cancelled = false;

  async function loadMovieMatch() {
    try {
      setIsMatchLoading(true);

      const response = await fetch(
        `/api/profile?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.user) {
        throw new Error(
          result?.error ||
            "Unable to calculate your movie match."
        );
      }

      const answers: UserProfileAnswers = {
        genres: Array.isArray(result.answers?.genres)
          ? result.answers.genres
          : [],

        streamingServices: Array.isArray(
          result.answers?.streamingServices
        )
          ? result.answers.streamingServices
          : [],

        contentTypes: Array.isArray(
          result.answers?.contentTypes
        )
          ? result.answers.contentTypes
          : [],

        excludedContentTypes: Array.isArray(
          result.answers?.excludedContentTypes
        )
          ? result.answers.excludedContentTypes
          : [],

        preferences: Array.isArray(
          result.answers?.preferences
        )
          ? result.answers.preferences
          : [],
      };

      const genreScore = calculateListOverlap(
        movieForMatch.genres || [],
        answers.genres
      );

      const contentTypeScore =
        calculateSingleValueMatch(
          movieForMatch.content_type,
          answers.contentTypes
        );

      const streamingScore =
        calculateSingleValueMatch(
          movieForMatch.broadcaster,
          answers.streamingServices
        );

      const excludedContentScore =
        calculateSingleValueMatch(
          movieForMatch.content_type,
          answers.excludedContentTypes
        );

      

      /*
       * The priority score represents how many personalization
       * factors the user selected in "What matters most."
       */
      const priorityScore =
        answers.preferences.length === 0
          ? 50
          : Math.min(
              100,
              Math.round(
                (answers.preferences.length / 3) * 100
              )
            );

      /*
       * Preferences selected under "What matters most"
       * increase that category's influence.
       */
      const genreWeight = getPriorityWeight(
        answers.preferences,
        ["genre", "genres"]
      );

      const contentWeight = getPriorityWeight(
        answers.preferences,
        ["content", "content type"]
      );

      const streamingWeight = getPriorityWeight(
        answers.preferences,
        ["streaming", "service", "availability"]
      );

      const priorityWeight = 1;

      const totalWeight =
        genreWeight +
        contentWeight +
        streamingWeight +
        priorityWeight;

      let overallScore = Math.round(
        (
          genreScore * genreWeight +
          contentTypeScore * contentWeight +
          streamingScore * streamingWeight +
          priorityScore * priorityWeight
        ) / totalWeight
      );

      /*
       * Penalize titles the user explicitly said
       * they do not want to see.
       */
      if (excludedContentScore === 100) {
        overallScore = Math.min(overallScore, 20);
      }

      const calculatedMatch: MovieMatch = {
        overall: Math.max(
          0,
          Math.min(100, overallScore)
        ),

        reasons: [
          {
            label: "Genre match",
            value: genreScore,
          },
          {
            label: "Content preference",
            value:
              excludedContentScore === 100
                ? 0
                : contentTypeScore,
          },
          {
            label: "Streaming service",
            value: streamingScore,
          },
          {
            label: "Preference priorities",
            value: priorityScore,
          },
        ],
      };

      if (!cancelled) {
        setMovieMatch(calculatedMatch);
      }
    } catch (error) {
      console.error(
        "Unable to calculate movie match:",
        error
      );

      if (!cancelled) {
        setMovieMatch(emptyMovieMatch);
      }
    } finally {
      if (!cancelled) {
        setIsMatchLoading(false);
      }
    }
  }

  void loadMovieMatch();

  return () => {
    cancelled = true;
  };
}, [movie, session?.user?.email]);

async function refreshReviews() {
  if (!id) {
    return;
  }

  const response = await fetch(`/api/movie/${id}/reviews`, {
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.details ||
        result?.error ||
        "Unable to refresh reviews."
    );
  }

  setReviews(Array.isArray(result) ? result : []);
}

async function handleSubmitReview(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setReviewError("");
  setReviewMessage("");

 if (!id) {
    setReviewError("The movie ID is missing.");
    return;
  }


 const sessionUser = session?.user as
  | {
      id?: string | number;
      user_id?: string | number;
    }
  | undefined;

const currentUserId = Number(
  sessionUser?.id || sessionUser?.user_id
);

  if (!session?.user) {
    setReviewError("Please sign in before writing a review.");
    return;
  }

  if (!currentUserId) {
    setReviewError("Your user account could not be identified.");
    return;
  }

  if (!reviewText.trim()) {
    setReviewError("Please write something about the movie.");
    return;
  }

  if (reviewText.trim().length < 5) {
    setReviewError("Your review must contain at least 5 characters.");
    return;
  }

  try {
    setIsSubmittingReview(true);

    const response = await fetch(`/api/movie/${id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUserId,
        rating: reviewRating,
        commentText: reviewText.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || "Unable to save your review.");
    }

    setReviewText("");
    setReviewRating(5);
    setIsReviewFormOpen(false);
    setReviewMessage("Your review was posted successfully.");

    setTimeout(() => {
    setReviewMessage("");
      }, 3000);

    await refreshReviews();
  } catch (error) {
    console.error("Submit review error:", error);

    setReviewError(
      error instanceof Error
        ? error.message
        : "Unable to save your review."
    );
  } finally {
    setIsSubmittingReview(false);
  }
}

if (!id) {
  return (
    <main className="movie-detail-page">
      <div className="movie-detail-container">
        <section className="movie-detail-review-empty">
          <div>
            <h1>Invalid movie</h1>
            <p>No movie ID was provided.</p>

            <Link
              href="/discover"
              className="movie-detail-card-details"
            >
              Back to Discover
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

  if (isLoading) {
    return (
      <main className="movie-detail-page">
        <div className="movie-detail-container">
          <p className="movie-detail-empty-copy">Loading movie...</p>
        </div>
      </main>
    );
  }

  if (pageError || !movie) {
    return (
      <main className="movie-detail-page">
        <div className="movie-detail-container">
          <section className="movie-detail-review-empty">
            <div>
              <h1>Movie unavailable</h1>
              <p>{pageError || "This movie could not be found."}</p>
              <Link href="/discover" className="movie-detail-card-details">
                Back to Discover
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const currentMovie = movie;

  const reviewCount = reviews.length;

const averageReviewRating =
  reviewCount > 0
    ? reviews.reduce(
        (total, review) =>
          total + Number(review.rating || 0),
        0
      ) / reviewCount
    : 0;

const roundedReviewRating = Math.round(
  averageReviewRating
);

const formattedReviewRating =
  averageReviewRating > 0
    ? averageReviewRating.toFixed(1)
    : "New";

const trailerEmbedUrl = getYouTubeEmbedUrl(
  currentMovie.trailer_url
);

const portraitImage =
  currentMovie.portrait_url ||
  currentMovie.poster_url ||
  "/placeholder.jpg";



function handleShare() {
  setShareMessage("");
  setIsShareOpen(true);
}

async function handleCopyLink() {
  const url =
    `${window.location.origin}/movie/${currentMovie.movie_id}`;

  try {
    await navigator.clipboard.writeText(url);
    setShareMessage("Movie link copied!");
  } catch (error) {
    console.error("Copy link error:", error);
    setShareMessage("Unable to copy the link.");
  }
}

function handleEmailShare() {
  const url =
    `${window.location.origin}/movie/${currentMovie.movie_id}`;

  window.location.href =
    `mailto:?subject=${encodeURIComponent(
      `Check out ${currentMovie.title} on Cineri`
    )}` +
    `&body=${encodeURIComponent(
      `I thought you might like ${currentMovie.title}.\n\n${url}`
    )}`;
}

function handleWhatsAppShare() {
  const url =
    `${window.location.origin}/movie/${currentMovie.movie_id}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      `Check out ${currentMovie.title} on Cineri!\n${url}`
    )}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function handleFacebookShare() {
  const url =
    `${window.location.origin}/movie/${currentMovie.movie_id}`;

  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`,
    "_blank",
    "noopener,noreferrer"
  );
}

async function handleNativeShare() {
  const url =
    `${window.location.origin}/movie/${currentMovie.movie_id}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: currentMovie.title,
        text: `Check out ${currentMovie.title} on Cineri!`,
        url,
      });

      return;
    }

    await handleCopyLink();
  } catch (error) {
    console.error("Native share error:", error);
  }
}

async function handleDownloadCard() {
  if (!shareCardRef.current) {
    return;
  }

  try {
    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(
      shareCardRef.current,
      {
        cacheBust: true,
        pixelRatio: 2,
      }
    );

    const link = document.createElement("a");

    link.download = `${currentMovie.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-cineri.png`;

    link.href = dataUrl;
    link.click();

    setShareMessage("Share card downloaded!");
  } catch (error) {
    console.error(
      "Download share card error:",
      error
    );

    setShareMessage(
      "Unable to download the share card."
    );
  }
}



  return (
    <main className="movie-detail-page">
      <section
        className="movie-detail-hero"
        // style={{
        //   backgroundImage: `
        //     linear-gradient(
        //       90deg,
        //       rgba(7, 16, 25, 0.99) 0%,
        //       rgba(7, 16, 25, 0.96) 34%,
        //       rgba(7, 16, 25, 0.79) 68%,
        //       rgba(7, 16, 25, 0.94) 100%
        //     ),
        //     url("${backdropImage}")
        //   `,
        // }}
      >
        {/* <div className="movie-detail-hero-glow" /> */}

        <div className="movie-detail-container">
          <div className="movie-detail-hero-grid">
            <aside className="movie-detail-poster-column">
              <div className="movie-detail-poster-wrapper">
                <Image
                  src={portraitImage}
                  alt={`${movie.title} poster`}
                  fill
                  priority
                  sizes="(max-width: 760px) 76vw, 245px"
                  className="movie-detail-poster"
                />
              </div>

             {session?.user && (
                  <MovieWatchlistButton
                    movieId={movie.movie_id}
                    movieTitle={movie.title}
                  />
                )}

              <div className="movie-detail-poster-actions">
                <button
                  type="button"
                  className="movie-detail-share-button"
                  onClick={handleShare}
                >
                  <Share2 size={15} />
                  Share
                </button>

                <button
                  type="button"
                  className="movie-detail-more-button"
                >
                  <span className="movie-detail-more-dots">•••</span>
                  <span>More</span>
                </button>
              </div>
            </aside>

            <div className="movie-detail-hero-content">
              <div className="movie-detail-badge-row">
                  {/* Content Type */}
                  {/* <span className="movie-detail-primary-badge">
                    {movie.content_type || "Movie"}
                  </span> */}

                  {/* Mood Badges */}
                  {movie.moods?.length ? (
                    movie.moods.map((mood) => (
                      <span
                        key={mood}
                        className={`movie-detail-mood-badge ${mood
                        .toLowerCase()
                        .replace(/\s*\/\s*/g, "-")
                        .replace(/\s+/g, "-")}`}
                      >
                        {mood}
                      </span>
                    ))
                  ) : (
                    <span className="movie-detail-mood-badge">
                      No mood
                    </span>
                  )}
                </div>

              <h1 className="dongle-font">{movie.title}</h1>

              <div className="movie-detail-metadata">
                <span>
                  <Film size={15} />
                  {movie.content_type || "Movie"}
                </span>

                <span>
                  <Clock3 size={15} />
                  {formatRuntime(movie.duration_minutes)}
                </span>

                {movie.release_year && (
                  <span>
                    <CalendarDays size={15} />
                    {movie.release_year}
                  </span>
                )}
              </div>

              {movie.genres.length > 0 && (
                <div className="movie-detail-genre-row">
                  {movie.genres.map((genre) => (
                    <span key={genre}>{genre}</span>
                  ))}
                </div>
              )}

              <p className="movie-detail-description">
                {movie.description ||
                  "No description is currently available."}
              </p>

              <div className="movie-detail-statistics-grid">
  <div className="movie-detail-stat-item">
    <span className="movie-detail-stat-label">
      Audience score
    </span>

    <div className="movie-detail-stat-rating-row">
      {reviewCount > 0 ? (
        <>
          <div className="movie-detail-stat-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={15}
                fill={
                  roundedReviewRating >= star
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </div>

          
        </>
      ) : (
        <strong className="movie-detail-no-rating">
          New
        </strong>
      )}
    </div>
      
    <small>
      {formattedReviewRating} 
       {" • "}
      {reviewCount > 0
        ? `${reviewCount.toLocaleString()} ${
            reviewCount === 1 ? "rating" : "ratings"
          }`
        : "No ratings yet"}
    </small>
  </div>

  <div className="movie-detail-stat-item">
    <span className="movie-detail-stat-label">
      Box office
    </span>

    <strong>
      {formatWorldwideGross(
        movie.worldwide_gross
      )}
    </strong>

    <small>Worldwide gross</small>
  </div>

  <div className="movie-detail-stat-item">
    <span className="movie-detail-stat-label">
      Awards
    </span>

    <strong>
  {movie.award_name || "No awards"}
</strong>

<small>
  {movie.featured_award
    ? `${movie.featured_award}${
        movie.featured_award_year
          ? ` • ${movie.featured_award_year}`
          : ""
      }`
    : "Award information unavailable"}
</small>
  </div>
</div>

              {movie.broadcaster && (
                <div className="movie-detail-streaming-section">
                  <span className="movie-detail-streaming-label">
                    Available on
                  </span>

                  <div className="movie-detail-streaming-buttons">
                   
                      {movie.logo_url && (
                        <img
                          src={movie.logo_url}
                          alt={movie.broadcaster ?? "Streaming service"}
                          className="movie-detail-streaming-logo"
                        />
                      )}

                      <span>{movie.broadcaster}</span>
                    
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="movie-detail-information-grid">
            <div className="movie-detail-people-column">
              <section className="movie-detail-creators-section">
  <span className="movie-detail-eyebrow">
    Creators
  </span>

  {movie.creators?.length > 0 ? (
    <div className="movie-detail-creators-scroll">
      {movie.creators.map((creator, index) => {
        const initials = creator.name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <article
            key={`${creator.role}-${creator.name}-${index}`}
            className="movie-detail-creator-card"
          >
            <div className="movie-detail-creator-avatar">
              {creator.photo_url ? (
                <img
                  src={creator.photo_url}
                  alt={creator.name}
                  className="movie-detail-creator-image"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="movie-detail-creator-copy">
              <span>{creator.role}</span>

              <strong>{creator.name}</strong>

              <p>
                {movie.content_type || "Movie"} creator
              </p>
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <p className="movie-detail-empty-copy">
      Creator information is not available.
    </p>
  )}
</section>

    <section className="movie-detail-cast-section">
      <div className="movie-detail-cast-heading-row">
        <span className="movie-detail-eyebrow">
          Cast
        </span>

        {movie.performers.length > 5 && (
          <Link
            href={`/movie/${movie.movie_id}/cast`}
            className="movie-detail-cast-see-all"
          >
            See all
            <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {movie.performers.length > 0 ? (
        <div className="movie-detail-cast-grid">
          {movie.performers
            .slice(0, 5)
            .map((performer) => {
              const initials = performer.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <article
                  className="movie-detail-cast-card"
                  key={performer.name}
                >
                  <div className="movie-detail-cast-placeholder">
                    {performer.photo_url ? (
                      <img
                        src={performer.photo_url}
                        alt={performer.name}
                        className="movie-detail-cast-image"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <h3>{performer.name}</h3>
                  <p>Cast member</p>
                </article>
              );
            })}
        </div>
      ) : (
        <p className="movie-detail-empty-copy">
          Cast information is not available.
        </p>
      )}
    </section>
  </div>

  <section className="movie-detail-trailer-section">
  <span className="movie-detail-eyebrow">
    Trailer
  </span>

  <div className="movie-detail-trailer-box">
    {trailerEmbedUrl ? (
      <iframe
        src={trailerEmbedUrl}
        title={`${movie.title} Trailer`}
        className="movie-detail-trailer-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ) : (
      <span className="movie-detail-trailer-unavailable">
        Trailer unavailable
      </span>
    )}
  </div>
</section>
</div>
        </div>
      </section>

      <section className="movie-detail-review-area">
        <div className="movie-detail-container">
          <div className="movie-detail-review-grid">
            <section className="movie-detail-review-section">
  <div className="movie-detail-section-heading">
    <div>
      <span className="movie-detail-eyebrow">
        What viewers say
      </span>

      <h2
        className="dongle-font"
        style={{ fontSize: "54px" }}
      >
        Reviews
      </h2>
    </div>

    <button
      type="button"
      className="movie-detail-write-review-button"
      onClick={() => {
        setReviewError("");
        setReviewMessage("");
        setIsReviewFormOpen((current) => !current);
      }}
    >
      {isReviewFormOpen ? "Cancel" : "Write a review"}
    </button>
  </div>

  {reviewMessage && (
    <p className="movie-detail-review-success">
      <Check size={16} />
      {reviewMessage}
    </p>
  )}

  {isReviewFormOpen && (
    <form
      className="movie-detail-review-form"
      onSubmit={handleSubmitReview}
    >
      <div className="movie-detail-review-form-heading">
        <div>
          <h3>Share your thoughts</h3>
          <p>
            What did you think about {movie.title}?
          </p>
        </div>

        <button
          type="button"
          className="movie-detail-review-form-close"
          aria-label="Close review form"
          onClick={() => {
            setIsReviewFormOpen(false);
            setReviewError("");
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="movie-detail-rating-field">
        <span>Your rating</span>

        <div className="movie-detail-rating-buttons">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              className={
                reviewRating >= rating ? "active" : ""
              }
              onClick={() => setReviewRating(rating)}
              aria-label={`${rating} star rating`}
            >
              <Star
                size={23}
                fill={
                  reviewRating >= rating
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          ))}

          <strong>{reviewRating}.0</strong>
        </div>
      </div>

      <label className="movie-detail-review-textarea-field">
        <span>Your review</span>

        <textarea
          value={reviewText}
          onChange={(event) =>
            setReviewText(event.target.value)
          }
          placeholder={`Write what you thought about ${movie.title}...`}
          rows={5}
          maxLength={1000}
        />

        <small>
          {reviewText.length}/1000 characters
        </small>
      </label>

      {reviewError && (
        <p className="movie-detail-review-error">
          {reviewError}
        </p>
      )}

      <div className="movie-detail-review-form-actions">
        <button
          type="button"
          className="movie-detail-review-cancel-button"
          onClick={() => {
            setIsReviewFormOpen(false);
            setReviewError("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="movie-detail-review-submit-button"
          disabled={isSubmittingReview}
        >
          {isSubmittingReview
            ? "Posting..."
            : "Post review"}
        </button>
      </div>
    </form>
  )}

  {reviews.length > 0 ? (
    <div className="movie-detail-review-list">
      {reviews.map((review) => (
        <article
          className="movie-detail-review-card"
          key={review.comment_id}
        >
          <div className="movie-detail-review-card-top">
            <div className="movie-detail-review-score">
              {Number(review.rating).toFixed(1)}
            </div>

            {/* <div className="movie-detail-review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  fill={
                    review.rating >= star
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div> */}
          </div>

          <p className="movie-detail-review-comment">
            “{review.comment_text}”
          </p>
{/* 
          <div className="movie-detail-review-footer">
            <span>
              {review.reviewer_name || "Cineri viewer"}
            </span>

            <time dateTime={review.created_at}>
              {new Date(review.created_at).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              )}
            </time>
          </div> */}
        </article>
      ))}
    </div>
  ) : (
    !isReviewFormOpen && (
      <div className="movie-detail-review-empty">
        <Star size={21} />

        <div>
          <h3>Be the first to review</h3>
          <p>
            Share what you thought about {movie.title}.
          </p>
        </div>
      </div>
    )
  )}
</section>

            {session?.user ? (
  <aside className="movie-detail-match-card">
    <div className="movie-detail-match-heading">
      <strong>
        {isMatchLoading ? "—" : movieMatch.overall}
      </strong>

      <div>
        <span>%</span>
        <p>
          {isMatchLoading
            ? "calculating match"
            : "match for you"}
        </p>
      </div>
    </div>

    <div className="movie-detail-match-reasons">
      {isMatchLoading ? (
        <p className="movie-detail-match-loading">
          Comparing this title with your preferences...
        </p>
      ) : movieMatch.reasons.length > 0 ? (
        movieMatch.reasons.map(({ label, value }) => (
          <div
            className="movie-detail-match-reason"
            key={label}
          >
            <div>
              <span>{label}</span>
              <strong>{value}%</strong>
            </div>

            <div className="movie-detail-progress-track">
              <span
                className="movie-detail-progress-fill"
                style={{
                  width: `${value}%`,
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="movie-detail-match-loading">
          Complete your preferences to receive a match score.
        </p>
      )}
    </div>
  </aside>
) : (
  <aside className="movie-detail-match-card movie-detail-match-guest">
    <div className="movie-detail-match-guest-icon">
      <Star size={22} />
    </div>

    <div className="movie-detail-match-guest-copy">
      <span className="movie-detail-eyebrow">
        Personalized for you
      </span>

      <h3>See how well this title matches your taste</h3>

      <p>
        Sign in to compare this title with your favourite
        genres, content preferences, and streaming services.
      </p>
    </div>

    <Link
      href={`/login?callbackUrl=${encodeURIComponent(
        `/movie/${movie.movie_id}`
      )}`}
      className="movie-detail-match-login"
    >
      Sign in to see your match
      <ChevronRight size={15} />
    </Link>
  </aside>
)}
          </div>
        </div>
      </section>

      <section className="movie-detail-similar-section">
        <div className="movie-detail-container">
          <div className="movie-detail-section-heading movie-detail-similar-heading">
  <div className="movie-detail-similar-heading">
  <div>
    <span className="movie-detail-eyebrow">
      You might also enjoy
    </span>

    <div className="movie-detail-similar-title-row">
      <h2
        className="dongle-font"
        style={{ fontSize: "54px" }}
      >
        More like this
      </h2>

      <Link
        href="/discover"
        className="movie-detail-similar-see-all"
      >
        See all
        <ChevronRight size={15} />
      </Link>
    </div>
  </div>
</div>
</div>

          {similarMovies.length > 0 ? (
            <div className="movie-detail-similar-grid">
              {similarMovies.map((similarMovie) => {
                // const similarImage =
                //   similarMovie.poster_url ||
                //   similarMovie.portrait_url ||
                //   "/placeholder.jpg";

                const matchPercentage = Math.min(
                  99,
                  75 +
                    Number(similarMovie.match_score || 0) *
                      3
                );

                return (
                 <article
  className="movie-detail-movie-card"
  key={similarMovie.movie_id}
>
  <Link
    href={`/movie/${similarMovie.movie_id}`}
    className="movie-detail-movie-image-wrapper"
  >
    <img
      src={
        similarMovie.poster_url ||
        similarMovie.portrait_url ||
        "/placeholder.jpg"
      }
      alt={`${similarMovie.title} poster`}
      className="movie-detail-movie-image"
    />

    <div className="movie-detail-movie-image-overlay" />

    <span className="movie-detail-movie-match">
      {matchPercentage}% match
    </span>
  </Link>

  <div className="movie-detail-movie-card-content">
    <p className="movie-detail-movie-meta">
      {similarMovie.broadcaster || "Platform unavailable"}
      {" · "}
      {similarMovie.content_type || "Movie"}
      {" · "}
      {formatRuntime(similarMovie.duration_minutes)}
    </p>

    <h3>{similarMovie.title}</h3>

    <p className="movie-detail-movie-description">
      {similarMovie.description ||
        "Open this title to learn more about the story."}
    </p>

    <div
  className={`movie-detail-movie-actions ${
    !session?.user ? "details-only" : ""
  }`}
>
{session?.user && (
  <MovieWatchlistButton
    movieId={similarMovie.movie_id}
    movieTitle={similarMovie.title}
  />
)}

  <Link
    href={`/movie/${similarMovie.movie_id}`}
    className="movie-detail-watchlist-button"
  >
    <Play size={11} />
    Show details
  </Link>
</div>
  </div>
</article>
                );
              })}
            </div>
          ) : (
            <p className="movie-detail-empty-copy">
              No similar movies were found.
            </p>
          )}
        </div>
      </section>

      {isShareOpen && (
  <div
    className="movie-share-overlay"
    onClick={() => setIsShareOpen(false)}
  >
    <div
      className="movie-share-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-share-title"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="movie-share-close"
        aria-label="Close share popup"
        onClick={() => setIsShareOpen(false)}
      >
        <X size={20} />
      </button>

      <div className="movie-share-heading">
        <span>Share movie</span>
        <h2 id="movie-share-title">
          Share {movie.title}
        </h2>
        <p>
          Send the movie link or download a shareable card.
        </p>
      </div>

      <div
        className="movie-share-card"
        ref={shareCardRef}
      >
        <div className="movie-share-card-poster">
          <img
            src={portraitImage}
            alt={`${movie.title} poster`}
          />
          <div className="movie-share-card-poster-overlay" />
        </div>

        <div className="movie-share-card-content">
          <span className="movie-share-card-brand">
            CINERI
          </span>

          <h3>{movie.title}</h3>

          <div className="movie-share-card-metadata">
            <span>
              <Film size={14} />
              {movie.content_type || "Movie"}
            </span>

            <span>
              <Clock3 size={14} />
              {formatRuntime(movie.duration_minutes)}
            </span>

            {movie.release_year && (
              <span>
                <CalendarDays size={14} />
                {movie.release_year}
              </span>
            )}
          </div>

          {movie.genres.length > 0 && (
            <div className="movie-share-card-genres">
              {movie.genres.slice(0, 3).map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
          )}

          {movie.moods.length > 0 && (
            <div className="movie-share-card-moods">
              {movie.moods.slice(0, 2).map((mood) => (
                <span key={mood}>{mood}</span>
              ))}
            </div>
          )}

          {movie.broadcaster && (
            <p className="movie-share-card-streaming">
              Available on{" "}
              <strong>{movie.broadcaster}</strong>
            </p>
          )}

          <p className="movie-share-card-tagline">
            Find your next favorite story on Cineri.
          </p>

          <span className="movie-share-card-url">
            {typeof window !== "undefined"
              ? `${window.location.host}/movie/${movie.movie_id}`
              : `/movie/${movie.movie_id}`}
          </span>
        </div>
      </div>

      <div className="movie-share-options">
        <button
          type="button"
          onClick={handleCopyLink}
        >
          <Copy size={17} />
          Copy link
        </button>

        <button
          type="button"
          onClick={handleNativeShare}
        >
          <Share2 size={17} />
          Share
        </button>

        <button
          type="button"
          onClick={handleEmailShare}
        >
          <Mail size={17} />
          Email
        </button>

        <button
          type="button"
          onClick={handleWhatsAppShare}
        >
          <MessageCircle size={17} />
          WhatsApp
        </button>

       <button
          type="button"
          onClick={handleFacebookShare}
        >
          <FaFacebookF size={17} />
          Facebook
        </button>

        <button
          type="button"
          onClick={handleDownloadCard}
        >
          <Download size={17} />
          Download card
        </button>
      </div>

      {shareMessage && (
        <p className="movie-share-message">
          <Check size={15} />
          {shareMessage}
        </p>
      )}
    </div>
  </div>
)}
    </main>
  );
}