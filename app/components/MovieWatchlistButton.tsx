"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Loader2,
  Plus,
  X,
} from "lucide-react";

type MovieWatchlistButtonProps = {
  movieId: number;
  movieTitle: string;
};

type Watchlist = {
  watchlist_id: number;
  name: string;
  contains_movie: boolean;
};

export default function MovieWatchlistButton({
  movieId,
  movieTitle,
}: MovieWatchlistButtonProps) {
  const { data: session, status } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingWatchlistId, setSavingWatchlistId] =
    useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function loadWatchlists() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/watchlists?movieId=${movieId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load your watchlists."
        );
      }

      setWatchlists(
        Array.isArray(result.watchlists)
          ? result.watchlists
          : []
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your watchlists."
      );
    } finally {
      setIsLoading(false);
    }
  }

 

 async function handleAddToWatchlist(
  watchlistId: number
) {
  setSavingWatchlistId(watchlistId);
  setMessage("");

  try {
   const response = await fetch(
  `/api/movie/${movieId}/watchlist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          watchlistId,
        }),
      }
    );

    const contentType =
      response.headers.get("content-type");

    const result =
      contentType?.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Unable to add this movie to the watchlist."
      );
    }

    setWatchlists((currentWatchlists) =>
      currentWatchlists.map((watchlist) =>
        watchlist.watchlist_id === watchlistId
          ? {
              ...watchlist,
              contains_movie: true,
            }
          : watchlist
      )
    );

    setMessage(
      result?.message ||
        `${movieTitle} was added to the watchlist.`
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to add this movie."
    );
  } finally {
    setSavingWatchlistId(null);
  }
}

async function handleOpen() {
  if (isOpen) {
    return;
  }

  setIsOpen(true);
  setMessage("");

  if (status === "authenticated") {
    await loadWatchlists();
  }
}

  return (
    <>
      <button
        type="button"
        className="movie-detail-watchlist-button"
        onClick={handleOpen}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2
            size={17}
            className="watchlist-spinner"
          />
        ) : (
          <Bookmark size={17} />
        )}

        Add to watchlist
      </button>

    {isOpen && (
  <div
    className="movie-watchlist-modal-overlay"
    onClick={() => setIsOpen(false)}
  >
    <div
      className="movie-watchlist-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-watchlist-title"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="movie-watchlist-modal-close"
        aria-label="Close"
        onClick={() => setIsOpen(false)}
      >
        <X size={20} />
      </button>

      {status === "unauthenticated" ? (
        <div className="movie-watchlist-modal-state">
          <div className="movie-watchlist-modal-icon">
            <Bookmark size={26} />
          </div>

          <h2 id="movie-watchlist-title">
            Save this movie
          </h2>

          <p>
            Log in or create an account before adding{" "}
            <strong>{movieTitle}</strong> to a watchlist.
          </p>

          <div className="movie-watchlist-auth-actions">
            <Link
              href="/login"
              className="movie-watchlist-login-link"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="movie-watchlist-register-link"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="movie-watchlist-modal-state">
          <Loader2
            size={28}
            className="watchlist-spinner"
          />

          <p>Loading your watchlists...</p>
        </div>
      ) : watchlists.length === 0 ? (
        <div className="movie-watchlist-modal-state">
          <div className="movie-watchlist-modal-icon">
            <Plus size={26} />
          </div>

          <h2 id="movie-watchlist-title">
            Create a watchlist first
          </h2>

          <p>
            You do not have any watchlists yet. Create one
            before saving <strong>{movieTitle}</strong>.
          </p>

          <Link
            href="/watchlists"
            className="movie-watchlist-create-link"
          >
            <Plus size={16} />
            Create a watchlist
          </Link>
        </div>
      ) : (
        <>
          <div className="movie-watchlist-modal-heading">
            <span>Save movie</span>

            <h2 id="movie-watchlist-title">
              Choose a watchlist
            </h2>

            <p>
              Select where you want to save{" "}
              <strong>{movieTitle}</strong>.
            </p>
          </div>

          <div className="movie-watchlist-list">
            {watchlists.map((watchlist) => (
              <button
                type="button"
                key={watchlist.watchlist_id}
                className={`movie-watchlist-option ${
                  watchlist.contains_movie
                    ? "is-saved"
                    : ""
                }`}
                disabled={
                  watchlist.contains_movie ||
                  savingWatchlistId !== null
                }
                onClick={() =>
                  handleAddToWatchlist(
                    watchlist.watchlist_id
                  )
                }
              >
                <span className="movie-watchlist-option-icon">
                  {watchlist.contains_movie ? (
                    <Check size={17} />
                  ) : (
                    <Bookmark size={17} />
                  )}
                </span>

                <span className="movie-watchlist-option-copy">
                  <strong>{watchlist.name}</strong>

                  <small>
                    {watchlist.contains_movie
                      ? "Already saved"
                      : "Add to this list"}
                  </small>
                </span>

                {savingWatchlistId ===
                  watchlist.watchlist_id && (
                  <Loader2
                    size={17}
                    className="watchlist-spinner"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {message && (
        <p className="movie-watchlist-message">
          {message}
        </p>
      )}
    </div>
  </div>
)}
    </>
  );
}