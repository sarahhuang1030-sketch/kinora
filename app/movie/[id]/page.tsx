"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Clock3,
  Film,
  Play,
  Share2,
  Star,
} from "lucide-react";

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
  performers: string[];
  broadcaster: string | null;
  genres: string[];
  moods: string[];
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

// function getBaseUrl() {
//   if (process.env.NEXT_PUBLIC_APP_URL) {
//     return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
//   }

//   if (process.env.NEXTAUTH_URL) {
//     return process.env.NEXTAUTH_URL.replace(/\/$/, "");
//   }

//   return "http://localhost:3000";
// }

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

export default function MovieDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

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

  const portraitImage =
    movie.portrait_url ||
    movie.poster_url ||
    "/placeholder.jpg";

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

              <button
                type="button"
                className="movie-detail-watchlist-button"
              >
                <Bookmark size={17} />
                Add to watchlist
              </button>

              <div className="movie-detail-poster-actions">
                <button type="button">
                  <Share2 size={15} />
                  Share
                </button>

                <button type="button">
                  ... More
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
                <div>
                  <span className="movie-detail-stat-label">
                    Rating
                  </span>

                  <strong>
                    <Star size={17} fill="currentColor" />
                    New
                  </strong>

                  <small>User reviews</small>
                </div>

                <div>
                  <span className="movie-detail-stat-label">
                    Runtime
                  </span>

                  <strong>
                    {movie.duration_minutes
                      ? `${movie.duration_minutes} min`
                      : "N/A"}
                  </strong>

                  <small>Feature length</small>
                </div>

                <div>
                  <span className="movie-detail-stat-label">
                    Released
                  </span>

                  <strong>
                    {movie.release_year || "N/A"}
                  </strong>

                  <small>
                    {movie.content_type || "Movie"}
                  </small>
                </div>
              </div>

              {movie.broadcaster && (
                <div className="movie-detail-streaming-section">
                  <span className="movie-detail-streaming-label">
                    Available on
                  </span>

                  <div className="movie-detail-streaming-buttons">
                    <button type="button">
                      <Play size={15} fill="currentColor" />
                      {movie.broadcaster}
                    </button>
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

      <div className="movie-detail-creators-grid">
        <article className="movie-detail-creator-card">
          <div className="movie-detail-creator-avatar">
            {movie.author
              ? movie.author
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "DR"}
          </div>

          <div className="movie-detail-creator-copy">
            <span>Director</span>

            <strong>
              {movie.author || "Not available"}
            </strong>

            <p>
              {movie.content_type || "Movie"} creator
            </p>
          </div>
        </article>

        <article className="movie-detail-creator-card">
          <div className="movie-detail-creator-copy">
            <span>Production</span>

            <strong>
              {movie.source || "Not available"}
            </strong>

            <p>
              {movie.broadcaster || "Platform unavailable"}
            </p>
          </div>
        </article>
      </div>
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
              const initials = performer
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <article
                  className="movie-detail-cast-card"
                  key={performer}
                >
                  <div className="movie-detail-cast-placeholder">
                    {initials}
                  </div>

                  <h3>{performer}</h3>
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
      {movie.trailer_url ? (
        <Link
          href={movie.trailer_url}
          target="_blank"
          rel="noreferrer"
          className="movie-detail-trailer-button"
        >
          <Play size={13} fill="currentColor" />
          Watch trailer
        </Link>
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

                  <h2 className="dongle-font" style={{ fontSize: '54px' }}>
                    Reviews
                  </h2>
                </div>

                <button
                  type="button"
                  className="movie-detail-write-review-button"
                >
                  Write a review
                </button>
              </div>

              <div className="movie-detail-review-empty">
                <Star size={21} />

                <div>
                  <h3>Be the first to review</h3>
                  <p>
                    Share what you thought about{" "}
                    {movie.title}.
                  </p>
                </div>
              </div>
            </section>

            <aside className="movie-detail-match-card">
              <div className="movie-detail-match-heading">
                <strong>98</strong>

                <div>
                  <span>%</span>
                  <p>match for you</p>
                </div>
              </div>

              <div className="movie-detail-match-reasons">
                {[
                  ["Genre match", 96],
                  ["Mood match", 92],
                  ["Content preference", 90],
                  ["Streaming service", 88],
                  ["Similar titles", 94],
                ].map(([label, value]) => (
                  <div
                    className="movie-detail-match-reason"
                    key={String(label)}
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
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="movie-detail-similar-section">
        <div className="movie-detail-container">
          <div className="movie-detail-section-heading">
            <div>
              <span className="movie-detail-eyebrow">
                You might also enjoy
              </span>

              <h2 className="dongle-font" style={{ fontSize: '54px' }}>More like this</h2>
            </div>

            <Link href="/discover">
              See all
              <ChevronRight size={15} />
            </Link>
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

    <div className="movie-detail-movie-actions">
      <button
        type="button"
        className="movie-detail-card-watchlist"
      >
        <Bookmark size={12} />
        Add to watchlist
      </button>

      <Link
        href={`/movie/${similarMovie.movie_id}`}
        className="movie-detail-card-details"
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
    </main>
  );
}