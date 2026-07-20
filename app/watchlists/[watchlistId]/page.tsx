'use client';

import Link from 'next/link';
import {
    Copy,
  ArrowLeft,
  Bookmark,
  CircleUserRound,
  Clock3,
  Film,
  LogOut,
  MonitorPlay,
  Settings,
  Trash2,
  Share,
  Share2,
  Check,
  Link2,
  UserRound,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

type SessionUser = {
  user_id?: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
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

type WatchlistDetails = {
  watchlist_id: number;
  name: string;
  created_at: string;
  items: WatchlistItem[];
};

export default function WatchlistDetailsPage() {
    const [selectedCategory, setSelectedCategory] =
  useState("All");
  const { data: session, status } = useSession();
  const params = useParams();

  const user =
    session?.user as SessionUser | undefined;
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
const [shareError, setShareError] = useState("");
const [generatedShareUrl, setGeneratedShareUrl] =
  useState("");
  const watchlistId = Number(
    params.watchlistId
  );

  const [watchlist, setWatchlist] =
    useState<WatchlistDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWatchlist = useCallback(async () => {
    if (!user?.user_id || !watchlistId) {
      setLoading(false);
      return;
    }



    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/watchlists/${watchlistId}`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            'Unable to load this watchlist.'
        );
      }

      setWatchlist(data.watchlist);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this watchlist.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, watchlistId]);

 useEffect(() => {
  if (
    status === 'loading' ||
    !user?.user_id ||
    !Number.isInteger(watchlistId) ||
    watchlistId <= 0
  ) {
    return;
  }

  let cancelled = false;

  fetch(`/api/watchlists/${watchlistId}`, {
    cache: 'no-store',
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            'Unable to load this watchlist.'
        );
      }

      return data;
    })
    .then((data) => {
      if (!cancelled) {
        setWatchlist(data.watchlist);
        setError('');
      }
    })
    .catch((loadError) => {
      if (!cancelled) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load this watchlist.'
        );
      }
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [status, user?.user_id, watchlistId]);

async function copyTextToClipboard(text: string) {
  try {
    if (
      navigator.clipboard &&
      document.hasFocus()
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea =
      document.createElement("textarea");

    textArea.value = text;
    textArea.setAttribute(
      "readonly",
      ""
    );

    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    const copied =
      document.execCommand("copy");

    document.body.removeChild(textArea);

    return copied;
  } catch (copyError) {
    console.error(
      "Copy link error:",
      copyError
    );

    return false;
  }
}

async function handleGenerateLink() {
  try {
    setShareError("");
    setShareMessage("");

    const response = await fetch(
      `/api/watchlists/${watchlistId}/share`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.details ||
          data.error ||
          "Unable to generate the share link."
      );
    }

    if (!data.shareUrl) {
      throw new Error(
        "The server did not return a share link."
      );
    }

    setGeneratedShareUrl(data.shareUrl);

    const copiedSuccessfully =
  await copyTextToClipboard(data.shareUrl);

if (!copiedSuccessfully) {
  throw new Error(
    "The link was generated, but it could not be copied automatically."
  );
}

    setCopied(true);
    setShareMessage(
      "Share link generated and copied!"
    );

    window.setTimeout(() => {
      setCopied(false);
      setShareMessage("");
    }, 3000);
  } catch (shareError) {
    console.error(
      "Generate share link error:",
      shareError
    );

    setShareError(
      shareError instanceof Error
        ? shareError.message
        : "Unable to generate the share link."
    );
  }
}

async function handleSocialShare() {
  try {
    setShareError("");
    setShareMessage("");

    const response = await fetch(
      `/api/watchlists/${watchlistId}/share`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.details ||
          data.error ||
          "Unable to generate the share link."
      );
    }

    if (!data.shareUrl) {
      throw new Error(
        "The server did not return a share link."
      );
    }

    setGeneratedShareUrl(data.shareUrl);

    const shareData = {
      title: watchlist?.name ?? "My Watchlist",
      text: `Check out my "${
        watchlist?.name ?? "watchlist"
      }" on Cineri!`,
      url: data.shareUrl,
    };

    if (navigator.share) {
      await navigator.share(shareData);

      setShareMessage(
        "Watchlist shared successfully!"
      );

      window.setTimeout(() => {
        setShareMessage("");
      }, 3000);

      return;
    }

    const copiedSuccessfully =
      await copyTextToClipboard(data.shareUrl);

    if (!copiedSuccessfully) {
      throw new Error(
        "The share menu is unavailable. Copy the generated link manually."
      );
    }

    setCopied(true);
    setShareMessage(
      "Sharing is unavailable in this browser, so the link was copied instead."
    );

    window.setTimeout(() => {
      setCopied(false);
      setShareMessage("");
    }, 3000);
  } catch (shareError) {
    if (
      shareError instanceof DOMException &&
      shareError.name === "AbortError"
    ) {
      return;
    }

    console.error(
      "Social share error:",
      shareError
    );

    setShareError(
      shareError instanceof Error
        ? shareError.message
        : "Unable to share this watchlist."
    );
  }
}

  if (status === 'loading' || loading) {
    return (
      <main className="watchlists-page">
        <div className="watchlists-loading">
          Loading watchlist...
        </div>
      </main>
    );
  }

  if (!user?.user_id) {
    return (
      <main className="watchlists-page">
        
        <section className="watchlists-login-card">
          <Bookmark size={42} />

          <h1>Sign in to view this watchlist</h1>

          <Link
            href="/login"
            className="watchlists-login-button"
          >
            Sign In
          </Link>
        </section>
      </main>
    );
  }

  const allItems = watchlist?.items ?? [];

const availableCategories = Array.from(
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

const filteredItems =
  selectedCategory === "All"
    ? allItems
    : allItems.filter(
        (item) =>
          item.content_type === selectedCategory
      );

      const categoryCounts = allItems.reduce(
  (acc, item) => {
    const type = item.content_type ?? "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

  return (
    <main className="watchlists-page">
        {shareMessage && (
  <div
    className="watchlist-share-toast watchlist-share-toast-success"
    role="status"
  >
    <Check size={18} />
    <span>{shareMessage}</span>
  </div>
)}

{shareError && (
  <div
    className="watchlist-share-toast watchlist-share-toast-error"
    role="alert"
  >
    <span>{shareError}</span>

    <button
      type="button"
      onClick={() => setShareError("")}
      aria-label="Close error message"
    >
      ×
    </button>
  </div>
)}
      <div className="watchlists-layout">
        <aside className="watchlists-account-sidebar">
          <p className="watchlists-sidebar-heading">
            Account
          </p>

          <div className="watchlists-sidebar-links">
            <Link href="/profile">
              <CircleUserRound size={17} />
              <span>Profile</span>
            </Link>

            <Link href="/profile/streaming-services">
              <MonitorPlay size={17} />
              <span>Streaming Services</span>
            </Link>

            <Link
              href="/watchlists"
              className="watchlists-sidebar-active"
            >
              <Bookmark
                size={17}
                fill="currentColor"
              />
              <span>Watchlist</span>
            </Link>
          </div>

          <div className="watchlists-sidebar-divider" />

          <p className="watchlists-sidebar-heading">
            Settings
          </p>

          <div className="watchlists-sidebar-links">
            <Link href="/profile/preferences">
              <Settings size={17} />
              <span>Preferences</span>
            </Link>

            <Link href="/privacy">
              <UserRound size={17} />
              <span>Privacy</span>
            </Link>
          </div>

          <div className="watchlists-sidebar-space" />

          <button
            type="button"
            className="watchlists-logout"
            onClick={() =>
              signOut({
                callbackUrl: '/',
              })
            }
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </aside>

        <section className="watchlists-content">
          <Link
            href="/watchlists"
            className="watchlist-detail-back"
          >
            <ArrowLeft size={17} />
            Back to My Watchlists
          </Link>

          {error ? (
            <div className="watchlists-error">
              {error}
            </div>
          ) : (
            <>
              <div className="watchlist-detail-header">
                <div>
                  {/* <p className="watchlist-detail-eyebrow">
                    My Watchlist
                  </p> */}

                  <h1>
                    {watchlist?.name ??
                      'Watchlist'}
                  </h1>

                  {/* <p>
                    {watchlist?.items.length ?? 0}{' '}
                    {(watchlist?.items.length ??
                      0) === 1
                      ? 'item'
                      : 'items'}
                  </p> */}
                </div>

              </div>

{/* this is the tabs */}
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

    {availableCategories.map((category) => {
      const categoryCount = allItems.filter(
        (item) =>
          item.content_type === category
      ).length;

      return (
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
          <span>{categoryCount}</span>
        </button>
      );
    })}
  </div>
)}

{/* end of the tabs */}



              {!watchlist ||
                    allItems.length === 0 ? (
                <div className="watchlists-empty">
                  <Bookmark size={38} />

                  <h2>This watchlist is empty</h2>

                  <p>
                    Add movies and shows to see
                    them here.
                  </p>

                  <Link href="/discover">
                    Browse Movies and Shows
                  </Link>
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
                              'Movie or Show'}
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
                                {
                                  item.duration_minutes
                                }{' '}
                                min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="watchlists-right-sidebar2">
            <section className="watchlists-info-card">
            <div className="watchlists-info-title">
              <Share2 size={18} />
              <h2>Share Watchlist</h2>
            </div>

            <p>
              Share your watchlist with friends and see what
              they think!
            </p>

            <button
              type="button"
              className="watchlists-share-primary"
              onClick={() =>
                void handleGenerateLink()
              }
            >
              {copied ? (
                <Check size={15} />
              ) : (
                <Link2 size={15} />
              )}

              {copied
                ? 'Link Copied'
                : 'Generate Link'}
            </button>

            {/* {generatedShareUrl && (
  <div className="watchlists-generated-link">
    <input
      type="text"
      value={generatedShareUrl}
      readOnly
      onFocus={(event) =>
        event.currentTarget.select()
      }
    />

    <button
      type="button"
      onClick={() =>
        void copyTextToClipboard(
          generatedShareUrl
        )
      }
    >
      <Copy size={15} />
    </button>
  </div>
)} */}

            <button
              type="button"
              className="watchlists-share-secondary"
              onClick={() =>
                void handleSocialShare()
              }
            >
              <Share size={15} />
              Share to Social Media
            </button>
          </section>

          <section className="watchlists-info-card">
            <h2 className="watchlists-stats-title">
              Watchlist Details
            </h2>

            <div className="watchlists-stat-row">
              <span className="watchlists-stat-icon">
                <Bookmark size={17} />
              </span>

              <span>Total Items</span>

              <strong>
                {watchlist?.items.length ?? 0}
              </strong>
            </div>

           {Object.entries(categoryCounts).map(
  ([category, count]) => (
    <div
      key={category}
      className="watchlists-stat-row"
    >
      <span className="watchlists-stat-icon">
        {category === "Movies" && (
          <Film size={17} />
        )}

        {category === "TV Shows" && (
          <MonitorPlay size={17} />
        )}

        {category ===
          "Limited Series" && (
          <Bookmark size={17} />
        )}

        {category === "Anime" && (
          <Film size={17} />
        )}

        {category ===
          "Documentaries & Reality" && (
          <Film size={17} />
        )}
      </span>

      <span>{category}</span>

      <strong>{count}</strong>
    </div>
  )
)}
          </section>
        </aside>
      </div>
    </main>
  );
}