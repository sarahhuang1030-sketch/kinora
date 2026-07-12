'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {signOut, useSession } from 'next-auth/react';
import {
  Bookmark,
  Check,
  ChevronRight,
  CircleUserRound,
  Copy,
  Ellipsis,
  Film,
  Link2,
  ListVideo,
  LogOut,
  MonitorPlay,
  Plus,
  Settings,
  Share2,
  Trash2,
  Tv,
  UserRound,
  X,
} from 'lucide-react';

type WatchlistMovie = {
  movie_id: number;
  title: string;
  portrait_url: string | null;
};

type Watchlist = {
  watchlist_id: number;
  name: string;
  total_titles: number;
  movie_count: number;
  tv_count: number;
  completed_count: number;
  previews: WatchlistMovie[];
};

type WatchlistStats = {
  total_watchlists: number;
  total_items: number;
  movies: number;
  tv_shows: number;
  completed: number;
};

type WatchlistApiResponse = {
  watchlists: Watchlist[];
  stats: WatchlistStats;
};

type FilterType = 'all' | 'movies' | 'tv';

 type SessionUser = {
  user_id?: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

const emptyStats: WatchlistStats = {
  total_watchlists: 0,
  total_items: 0,
  movies: 0,
  tv_shows: 0,
  completed: 0,
};

export default function WatchlistsPage() {
  const { data: session, status } = useSession();

const user = session?.user as SessionUser | undefined;
const userId = user?.user_id;

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [stats, setStats] = useState<WatchlistStats>(emptyStats);
  const [activeFilter, setActiveFilter] =
    useState<FilterType>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  const [openMenuId, setOpenMenuId] =
    useState<number | null>(null);

  const [copied, setCopied] = useState(false);

  const loadWatchlists = useCallback(async () => {
   if (!user?.user_id) {
  setLoading(false);
  return;
}

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/watchlists?userId=${userId}`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok) {
  throw new Error(
    data.details ||
    data.error ||
    'Unable to load your watchlists.'
  );
}

      const result = data as WatchlistApiResponse;

      setWatchlists(result.watchlists ?? []);
      setStats(result.stats ?? emptyStats);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your watchlists.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

 useEffect(() => {
  if (status === 'loading') {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    void loadWatchlists();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadWatchlists, status]);

  const visibleWatchlists = useMemo(() => {
    if (activeFilter === 'movies') {
      return watchlists.filter(
        (watchlist) => watchlist.movie_count > 0
      );
    }

    if (activeFilter === 'tv') {
      return watchlists.filter(
        (watchlist) => watchlist.tv_count > 0
      );
    }

    return watchlists;
  }, [activeFilter, watchlists]);

  async function handleCreateWatchlist(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = newListName.trim();

    if (!name || !userId) {
      return;
    }

    try {
      setCreating(true);
      setError('');

      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to create watchlist.'
        );
      }

      setNewListName('');
      setShowCreateModal(false);

      await loadWatchlists();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create watchlist.'
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteWatchlist(
    watchlistId: number
  ) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this watchlist?'
    );

    if (!confirmed || !userId) {
      return;
    }

    try {
      setError('');

      const response = await fetch(
        `/api/watchlists?watchlistId=${watchlistId}&userId=${userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to delete watchlist.'
        );
      }

      setOpenMenuId(null);

      await loadWatchlists();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete watchlist.'
      );
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError('Unable to copy the share link.');
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="watchlists-page">
        <div className="watchlists-loading">
          Loading your watchlists...
        </div>
      </main>
    );
  }

  if (!user?.user_id) {
    return (
      <main className="watchlists-page">
        <section className="watchlists-login-card">
          <Bookmark size={42} />

          <h1>Sign in to view your watchlists</h1>

          <p>
            Save movies and shows, create custom collections,
            and keep track of what you want to watch.
          </p>

          <Link href="/login" className="watchlists-login-button">
            Sign In
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="watchlists-page">
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
            onClick={async () => {
              try {
                await fetch('/api/logout', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: session?.user?.email,
                  }),
                });
              } catch (error) {
                console.error(
                  'Logout tracking failed',
                  error
                );
              }

              await signOut({
                callbackUrl: '/',
              });
            }}
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </aside>

        <section className="watchlists-content">
          <div className="watchlists-title-row">
            <div>
              <h1>
                My <span>Watchlists</span>
              </h1>

              <p>
                All movies and shows you want to watch.
              </p>
            </div>

            <button
              type="button"
              className="watchlists-create-button"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              Create Watchlist
            </button>
          </div>

          <div className="watchlists-filter-tabs">
            <button
              type="button"
              className={
                activeFilter === 'all' ? 'active' : ''
              }
              onClick={() => setActiveFilter('all')}
            >
              All Watchlists
            </button>

            <button
              type="button"
              className={
                activeFilter === 'movies' ? 'active' : ''
              }
              onClick={() => setActiveFilter('movies')}
            >
              Movies
            </button>

            <button
              type="button"
              className={
                activeFilter === 'tv' ? 'active' : ''
              }
              onClick={() => setActiveFilter('tv')}
            >
              TV Shows
            </button>
          </div>

          {error && (
            <div className="watchlists-error">
              {error}
            </div>
          )}

          <div className="watchlists-list">
            {visibleWatchlists.length === 0 ? (
              <div className="watchlists-empty">
                <Bookmark size={38} />

                <h2>No watchlists yet</h2>

                <p>
                  Create your first watchlist and begin saving
                  movies and TV shows.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(true)
                  }
                >
                  <Plus size={17} />
                  Create Watchlist
                </button>
              </div>
            ) : (
              visibleWatchlists.map((watchlist) => (
                <article
                  key={watchlist.watchlist_id}
                  className="watchlists-list-card"
                >
                  <Link
                    href={`/watchlists/${watchlist.watchlist_id}`}
                    className="watchlists-list-card-content"
                  >
                    <div className="watchlists-poster-preview">
                      {[0, 1, 2].map((index) => {
                        const movie =
                          watchlist.previews[index];

                        if (movie?.portrait_url) {
                          return (
                            <img
                              key={`${watchlist.watchlist_id}-${movie.movie_id}`}
                              src={movie.portrait_url}
                              alt={movie.title}
                            />
                          );
                        }

                        return (
                          <div
                            key={`${watchlist.watchlist_id}-${index}`}
                            className="watchlists-poster-placeholder"
                          >
                            <Film size={20} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="watchlists-list-details">
                      <h2>{watchlist.name}</h2>

                      <p>
                        {watchlist.total_titles}{' '}
                        {watchlist.total_titles === 1
                          ? 'item'
                          : 'items'}
                      </p>
                    </div>
                  </Link>

                  <div className="watchlists-list-actions">
                    <div className="watchlists-menu-wrapper">
                      <button
                        type="button"
                        className="watchlists-more-button"
                        aria-label={`Options for ${watchlist.name}`}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current ===
                            watchlist.watchlist_id
                              ? null
                              : watchlist.watchlist_id
                          )
                        }
                      >
                        <Ellipsis size={20} />
                      </button>

                      {openMenuId ===
                        watchlist.watchlist_id && (
                        <div className="watchlists-dropdown">
                          <Link
                            href={`/watchlists/${watchlist.watchlist_id}`}
                          >
                            <ListVideo size={15} />
                            View List
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteWatchlist(
                                watchlist.watchlist_id
                              )
                            }
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/watchlists/${watchlist.watchlist_id}`}
                      className="watchlists-open-button"
                      aria-label={`Open ${watchlist.name}`}
                    >
                      <ChevronRight size={21} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="watchlists-right-sidebar">
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
                void handleCopyShareLink()
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

            <button
              type="button"
              className="watchlists-share-secondary"
              onClick={() =>
                void handleCopyShareLink()
              }
            >
              <Copy size={15} />
              Share to Social Media
            </button>
          </section>

          <section className="watchlists-info-card">
            <h2 className="watchlists-stats-title">
              Watchlist Stats
            </h2>

            <WatchlistStat
              icon={<Bookmark size={17} />}
              label="Total Watchlists"
              value={stats.total_watchlists}
            />

            <WatchlistStat
              icon={<ListVideo size={17} />}
              label="Total Items"
              value={stats.total_items}
            />

            <WatchlistStat
              icon={<Film size={17} />}
              label="Movies"
              value={stats.movies}
            />

            <WatchlistStat
              icon={<Tv size={17} />}
              label="TV Shows"
              value={stats.tv_shows}
            />

            <WatchlistStat
              icon={<Check size={17} />}
              label="Completed"
              value={stats.completed}
            />
          </section>
        </aside>
      </div>

      {showCreateModal && (
        <div
          className="watchlists-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowCreateModal(false);
            }
          }}
        >
          <form
            className="watchlists-create-modal"
            onSubmit={handleCreateWatchlist}
          >
            <button
              type="button"
              className="watchlists-modal-close"
              aria-label="Close"
              onClick={() =>
                setShowCreateModal(false)
              }
            >
              <X size={20} />
            </button>

            <div className="watchlists-modal-icon">
              <Bookmark size={25} />
            </div>

            <h2>Create New Watchlist</h2>

            <p>
              Give your new collection a name.
            </p>

            <label htmlFor="watchlist-name">
              Watchlist name
            </label>

            <input
              id="watchlist-name"
              type="text"
              value={newListName}
              onChange={(event) =>
                setNewListName(event.target.value)
              }
              placeholder="For example: Date Night"
              maxLength={100}
              autoFocus
            />

            <div className="watchlists-modal-actions">
              <button
                type="button"
                className="watchlists-modal-cancel"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="watchlists-modal-create"
                disabled={
                  creating || !newListName.trim()
                }
              >
                {creating
                  ? 'Creating...'
                  : 'Create Watchlist'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function WatchlistStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="watchlists-stat-row">
      <span className="watchlists-stat-icon">
        {icon}
      </span>

      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}