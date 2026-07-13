"use client";

import { FormEvent, useEffect, useState } from "react";

type MovieComment = {
  comment_id: number;
  rating: number;
  comment_text: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  profile_image: string | null;
  is_current_user?: boolean;
};

type MovieInteractionPanelProps = {
  movieId: number;
  movieTitle: string;
  director?: string | null;
  production?: string | null;
  performers?: string | null;
  platforms?: string | null;
  broadcaster?: string | null;
  genres?: string | null;
  moods?: string | null;
};

export default function MovieInteractionPanel({
  movieId,
  movieTitle,
  director,
  production,
  performers,
  platforms,
  broadcaster,
  genres,
  moods,
}: MovieInteractionPanelProps) {
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");

  const [isSaved, setIsSaved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const [loadingComments, setLoadingComments] = useState(true);
  const [savingComment, setSavingComment] = useState(false);
  const [savingWatchlist, setSavingWatchlist] = useState(false);

  const [message, setMessage] = useState("");

  async function loadMovieInteractions(options?: {
  showLoading?: boolean;
  signal?: AbortSignal;
}) {
  const showLoading = options?.showLoading ?? true;

  try {
    if (showLoading) {
      setLoadingComments(true);
    }

    const response = await fetch(`/api/movie/${movieId}/interactions`, {
      cache: "no-store",
      signal: options?.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to load movie interactions."
      );
    }

    setComments(data.comments || []);
    setIsSaved(Boolean(data.isSaved));
    setIsLoggedIn(Boolean(data.isLoggedIn));

    const currentUserComment = data.comments?.find(
      (comment: MovieComment) => comment.is_current_user
    );

    if (currentUserComment) {
      setRating(Number(currentUserComment.rating));
      setCommentText(currentUserComment.comment_text);
    }
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return;
    }

    console.error("Load movie interactions error:", error);
    setMessage("We could not load the reviews right now.");
  } finally {
    if (showLoading && !options?.signal?.aborted) {
      setLoadingComments(false);
    }
  }
}

useEffect(() => {
  const controller = new AbortController();

  async function initializeInteractions() {
    try {
      const response = await fetch(
        `/api/movie/${movieId}/interactions`,
        {
          cache: "no-store",
          signal: controller.signal,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load movie interactions."
        );
      }

      if (controller.signal.aborted) return;

      setComments(data.comments || []);
      setIsSaved(Boolean(data.isSaved));
      setIsLoggedIn(Boolean(data.isLoggedIn));

      const currentUserComment = data.comments?.find(
        (comment: MovieComment) => comment.is_current_user
      );

      if (currentUserComment) {
        setRating(Number(currentUserComment.rating));
        setCommentText(currentUserComment.comment_text);
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error("Initialize movie interactions error:", error);

      if (!controller.signal.aborted) {
        setMessage("We could not load the reviews right now.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingComments(false);
      }
    }
  }

  void initializeInteractions();

  return () => {
    controller.abort();
  };
}, [movieId]);

  async function handleWatchlist() {
    if (!isLoggedIn) {
      setMessage("Please log in to add this movie to your watchlist.");
      return;
    }

    try {
      setSavingWatchlist(true);
      setMessage("");

      const response = await fetch(`/api/movie/${movieId}/watchlist`, {
        method: isSaved ? "DELETE" : "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update your watchlist.");
      }

      setIsSaved(data.isSaved);
      setMessage(
        data.isSaved
          ? `${movieTitle} was added to your watchlist.`
          : `${movieTitle} was removed from your watchlist.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your watchlist."
      );
    } finally {
      setSavingWatchlist(false);
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isLoggedIn) {
      setMessage("Please log in to leave a review.");
      return;
    }

    if (!commentText.trim()) {
      setMessage("Please write a comment before submitting.");
      return;
    }

    try {
      setSavingComment(true);
      setMessage("");

      const response = await fetch(`/api/movie/${movieId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          commentText: commentText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save your review.");
      }

      setMessage("Your review has been saved.");
       setTimeout(() => {
        setMessage("");
      }, 3000);
      await loadMovieInteractions({
        showLoading: false,
        });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save your review."
      );
    } finally {
      setSavingComment(false);
    }
  }

  const totalReviews = comments.length;

  const audienceScore =
    totalReviews > 0
      ? comments.reduce(
          (total, comment) => total + Number(comment.rating),
          0
        ) / totalReviews
      : 0;

  const matchScore = calculateMatchScore(genres, moods, platforms);

  const castMembers =
    performers
      ?.split(",")
      .map((performer) => performer.trim())
      .filter(Boolean)
      .slice(0, 5) || [];

  return (
    <section className="movie-community-section">
      <div className="movie-community-inner">
        <div className="movie-score-row">
          <div className="movie-audience-score">
            <p className="movie-small-label">AUDIENCE SCORE</p>

            <div className="movie-score-stars">
              {renderStars(audienceScore || 0)}
            </div>

            <p className="movie-score-summary">
              {totalReviews > 0 ? (
                <>
                  {audienceScore.toFixed(1)} · {totalReviews}{" "}
                  {totalReviews === 1 ? "rating" : "ratings"}
                </>
              ) : (
                "No ratings yet"
              )}
            </p>
          </div>

          <button
            type="button"
            className={`movie-watchlist-button ${
              isSaved ? "saved" : ""
            }`}
            onClick={handleWatchlist}
            disabled={savingWatchlist}
          >
            <span>{isSaved ? "✓" : "+"}</span>
            {savingWatchlist
              ? "Updating..."
              : isSaved
                ? "Saved to Watchlist"
                : "Add to Watchlist"}
          </button>
        </div>

        {message && <p className="movie-interaction-message">{message}</p>}

        <div className="movie-information-layout">
          <div className="movie-credits-column">
            <p className="movie-small-label">CREATORS</p>

            <div className="movie-credit-grid">
              <article className="movie-credit-card">
                <div className="movie-credit-icon">✦</div>

                <div>
                  <span>DIRECTOR</span>
                  <h3>{director || "Not available"}</h3>
                  <p>{movieTitle}</p>
                </div>
              </article>

              <article className="movie-credit-card">
                <div className="movie-credit-icon">◆</div>

                <div>
                  <span>PRODUCTION</span>
                  <h3>{production || broadcaster || "Not available"}</h3>
                  <p>Production and distribution</p>
                </div>
              </article>
            </div>

            <div className="movie-cast-heading">
              <p className="movie-small-label">CAST</p>

              {castMembers.length > 5 && (
                <button type="button">See all →</button>
              )}
            </div>

            <div className="movie-cast-grid">
              {castMembers.length > 0 ? (
                castMembers.map((performer, index) => (
                  <article className="movie-cast-member" key={performer}>
                    <div className="movie-cast-avatar">
                      {getInitials(performer)}
                    </div>

                    <h4>{performer}</h4>
                    <p>Cast member {index + 1}</p>
                  </article>
                ))
              ) : (
                <p className="movie-empty-state">
                  Cast information is not available.
                </p>
              )}
            </div>

            <div className="movie-availability-card">
              <div>
                <p className="movie-small-label">AVAILABLE ON</p>
                <h3>
                  {platforms || broadcaster || "Availability not listed"}
                </h3>
              </div>

              <span className="movie-availability-icon">▶</span>
            </div>
          </div>

          <aside className="movie-match-card">
            <div className="movie-match-heading">
              <strong>{matchScore}%</strong>
              <span>match for you</span>
            </div>

            <div className="movie-match-divider" />

            <MatchBar
              label="Your genres"
              value={genres ? 96 : 70}
            />

            <MatchBar
              label="Your mood today"
              value={moods ? 92 : 65}
            />

            <MatchBar
              label="Streaming availability"
              value={platforms ? 98 : 72}
            />

            <MatchBar label="Global popularity" value={89} />

            <MatchBar
              label="Similar users loved it"
              value={94}
            />
          </aside>
        </div>

        <div className="movie-reviews-layout">
          <div className="movie-reviews-list">
            <div className="movie-reviews-title">
              <div>
                <p className="movie-small-label">COMMUNITY</p>
                <h2>Reviews</h2>
              </div>

              <span>{totalReviews}</span>
            </div>

            {loadingComments ? (
              <p className="movie-empty-state">Loading reviews...</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <article
                  className="movie-review-card"
                  key={comment.comment_id}
                >
                  <div className="movie-review-header">
                    <div className="movie-review-user">
                      {comment.profile_image ? (
                        <img
                          src={comment.profile_image}
                          alt={getCommenterName(comment)}
                        />
                      ) : (
                        <div className="movie-review-avatar">
                          {getInitials(getCommenterName(comment))}
                        </div>
                      )}

                      <div>
                        <h3>{getCommenterName(comment)}</h3>
                        <p>
                          {new Date(
                            comment.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <strong>
                      {Number(comment.rating).toFixed(1)}
                    </strong>
                  </div>

                  <div className="movie-review-stars">
                    {renderStars(Number(comment.rating))}
                  </div>

                  <p className="movie-review-text">
                    “{comment.comment_text}”
                  </p>

                  {comment.is_current_user && (
                    <span className="movie-your-review-label">
                      Your review
                    </span>
                  )}
                </article>
              ))
            ) : (
              <div className="movie-no-reviews">
                <span>✦</span>
                <h3>Be the first to review this movie</h3>
                <p>
                  Share what you thought and help other viewers decide.
                </p>
              </div>
            )}
          </div>

          <form
            className="movie-review-form"
            onSubmit={handleCommentSubmit}
          >
            <p className="movie-small-label">SHARE YOUR THOUGHTS</p>
            <h2>Leave a review</h2>

            <p className="movie-review-form-description">
              What did you think of {movieTitle}?
            </p>

            <fieldset className="movie-rating-field">
              <legend>Your rating</legend>

              <div className="movie-rating-buttons">
                {[1, 2, 3, 4, 5].map((number) => (
                  <button
                    type="button"
                    key={number}
                    className={rating >= number ? "active" : ""}
                    onClick={() => setRating(number)}
                    aria-label={`${number} star rating`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <span>{rating}.0 out of 5</span>
            </fieldset>

            <label className="movie-comment-field">
              <span>Your comment</span>

              <textarea
                value={commentText}
                onChange={(event) =>
                  setCommentText(event.target.value)
                }
                maxLength={1000}
                rows={7}
                placeholder="What did you enjoy? What stood out to you?"
              />

              <small>{commentText.length}/1000</small>
            </label>

            <button
              type="submit"
              className="movie-submit-review-button"
              disabled={savingComment}
            >
              {savingComment ? "Saving..." : "Post Review"}
            </button>

            {!isLoggedIn && isLoggedIn !== null && (
              <p className="movie-login-notice">
                You must be logged in to post a review or save this
                movie.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

function MatchBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="movie-match-item">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>

      <div className="movie-match-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function getCommenterName(comment: MovieComment) {
  const fullName = [comment.first_name, comment.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || comment.username || "Movie fan";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function renderStars(rating: number) {
  return [1, 2, 3, 4, 5].map((number) => (
    <span key={number} className={rating >= number ? "filled" : ""}>
      ★
    </span>
  ));
}

function calculateMatchScore(
  genres?: string | null,
  moods?: string | null,
  platforms?: string | null
) {
  let score = 79;

  if (genres) score += 7;
  if (moods) score += 6;
  if (platforms) score += 5;

  return Math.min(score, 98);
}