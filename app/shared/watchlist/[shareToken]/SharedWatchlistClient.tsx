"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Clock3,
  Film,
  MonitorPlay,
  Tv,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type SharedWatchlistClientProps = {
  shareToken: string;
};

type WatchlistItem = {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  portrait_url: string | null;
  content_type: string | null;
  status: string | null;
};

type SharedWatchlist = {
  watchlist_id: number;
  name: string;
  created_at: string;
  items: WatchlistItem[];
};

export default function SharedWatchlistClient({
  shareToken,
}: SharedWatchlistClientProps) {
 

  const [watchlist, setWatchlist] =
    useState<SharedWatchlist | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  if (!shareToken) {
    return;
  }

  const controller = new AbortController();

  async function loadSharedWatchlist() {
    try {
      const apiUrl =
        `/api/shared/watchlist/${encodeURIComponent(
          shareToken
        )}`;

      console.log("SHARED PAGE TOKEN:", shareToken);
      console.log("SHARED PAGE API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await response.json();

      console.log(
        "SHARED WATCHLIST RESPONSE:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            "Unable to load this shared watchlist."
        );
      }

      setWatchlist(data.watchlist);
      setError("");
    } catch (loadError) {
      if (
        loadError instanceof DOMException &&
        loadError.name === "AbortError"
      ) {
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this shared watchlist."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  void loadSharedWatchlist();

  return () => {
    controller.abort();
  };
}, [shareToken]);

  const allItems = watchlist?.items ?? [];

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        allItems
          .map((item) => item.content_type)
          .filter(
            (type): type is string =>
              Boolean(type) &&
              type !== "No Preference"
          )
      )
    );
  }, [allItems]);

  const filteredItems =
    selectedCategory === "All"
      ? allItems
      : allItems.filter(
          (item) =>
            item.content_type === selectedCategory
        );

  const categoryCounts = useMemo(() => {
    return allItems.reduce<Record<string, number>>(
      (counts, item) => {
        const category =
          item.content_type ?? "Other";

        if (category === "No Preference") {
          return counts;
        }

        counts[category] =
          (counts[category] ?? 0) + 1;

        return counts;
      },
      {}
    );
  }, [allItems]);

  function getCategoryIcon(category: string) {
    const normalized = category.toLowerCase();

    if (
      normalized.includes("tv") ||
      normalized.includes("series")
    ) {
      return <Tv size={17} />;
    }

    if (
      normalized.includes("documentary") ||
      normalized.includes("reality")
    ) {
      return <MonitorPlay size={17} />;
    }

    return <Film size={17} />;
  }

  if (!shareToken) {
  return (
    <main className="shared-watchlist-page">
      <section className="watchlists-login-card">
        <Bookmark size={42} />

        <h1>Invalid share link</h1>

        <p>
          This shared watchlist link is missing its
          access token.
        </p>

        <Link
          href="/discover"
          className="watchlists-login-button"
        >
          Browse Movies and Shows
        </Link>
      </section>
    </main>
  );
}

  if (loading) {
    return (
      <main className="shared-watchlist-page">
        <div className="watchlists-loading">
          Loading shared watchlist...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="shared-watchlist-page">
        <section className="watchlists-login-card">
          <Bookmark size={42} />

          <h1>Watchlist unavailable</h1>

          <p>{error}</p>

          <Link
            href="/discover"
            className="watchlists-login-button"
          >
            Browse Movies and Shows
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shared-watchlist-page">
      <div className="shared-watchlist-shell">
        <section className="shared-watchlist-content">
          <Link
            href="/"
            className="watchlist-detail-back"
          >
            <ArrowLeft size={17} />
            Back to Cineri
          </Link>

          <header className="watchlist-detail-header">
            <div>
              <p className="watchlist-detail-eyebrow">
                Shared Watchlist
              </p>

              <h1>
                {watchlist?.name ?? "Watchlist"}
              </h1>

              <p>
                {allItems.length}{" "}
                {allItems.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>
          </header>

          {allItems.length > 0 && (
            <div className="watchlist-category-tabs">
              <button
                type="button"
                className={
                  selectedCategory === "All"
                    ? "watchlist-category-tab active"
                    : "watchlist-category-tab"
                }
                onClick={() =>
                  setSelectedCategory("All")
                }
              >
                All
                <span>{allItems.length}</span>
              </button>

              {availableCategories.map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory === category
                        ? "watchlist-category-tab active"
                        : "watchlist-category-tab"
                    }
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                  >
                    {category}

                    <span>
                      {categoryCounts[category] ?? 0}
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {allItems.length === 0 ? (
            <div className="watchlists-empty">
              <Bookmark size={38} />

              <h2>This watchlist is empty</h2>

              <p>
                There are no saved movies or shows
                in this watchlist yet.
              </p>

              <Link href="/discover">
                Browse Movies and Shows
              </Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="watchlists-empty">
              <Film size={38} />

              <h2>
                No {selectedCategory} saved
              </h2>

              <p>
                This watchlist does not contain
                anything in this category.
              </p>
            </div>
          ) : (
            <div className="watchlist-detail-grid">
              {filteredItems.map((item) => (
                <article
                  key={item.movie_id}
                  className="watchlist-detail-card"
                >
                  <Link
                    href={`/movie/${item.movie_id}`}
                    className="watchlist-detail-image"
                  >
                    {item.portrait_url ? (
                      <img
                        src={item.portrait_url}
                        alt={`${item.title} poster`}
                      />
                    ) : (
                      <div className="watchlist-detail-placeholder">
                        <Film size={34} />
                      </div>
                    )}
                  </Link>

                  <div className="watchlist-detail-card-body">
                    <div className="watchlist-detail-card-copy">
                      <p className="watchlist-detail-type">
                        {item.content_type ??
                          "Movie or Show"}
                      </p>

                      <Link
                        href={`/movie/${item.movie_id}`}
                      >
                        <h2>{item.title}</h2>
                      </Link>

                      <div className="watchlist-detail-meta">
                        {item.release_year && (
                          <span>
                            {item.release_year}
                          </span>
                        )}

                        {item.duration_minutes && (
                          <span>
                            <Clock3 size={13} />
                            {item.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* <aside className="shared-watchlist-sidebar">
          <section className="watchlists-info-card">
            <h2 className="watchlists-stats-title">
              Watchlist Details
            </h2>

            <div className="watchlists-stat-row">
              <span className="watchlists-stat-icon">
                <Bookmark size={17} />
              </span>

              <span>Total Items</span>

              <strong>{allItems.length}</strong>
            </div>

            {Object.entries(categoryCounts).map(
              ([category, count]) => (
                <div
                  key={category}
                  className="watchlists-stat-row"
                >
                  <span className="watchlists-stat-icon">
                    {getCategoryIcon(category)}
                  </span>

                  <span>{category}</span>

                  <strong>{count}</strong>
                </div>
              )
            )}
          </section>
        </aside> */}
      </div>
    </main>
  );
}