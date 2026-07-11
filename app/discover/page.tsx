/* app/discover/page.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

type SessionUser = {
  user_id?: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type DiscoverMovie = {
  movie_id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  portrait_url: string | null;
  trailer_url: string | null;
  content_type: string | null;
  genres: string | null;
  moods: string | null;
  platforms: string | null;
};

type DiscoverCollection = {
  mood_id: number;
  mood_name: string;
  icon_url: string | null;
  movies: DiscoverMovie[];
};

type DiscoverResponse = {
  featured: DiscoverMovie | null;
  collections: DiscoverCollection[];
  movies: DiscoverMovie[];
};

type Watchlist = {
  watchlist_id: number;
  name: string;
  total_titles?: number;
  watched_count?: number;
};

function splitValues(value: string | null | undefined) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDuration(minutes: number | null) {
  if (!minutes) return 'Duration unavailable';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

function getMovieImage(
  movie: DiscoverMovie,
  orientation: 'landscape' | 'portrait'
) {
  if (orientation === 'landscape') {
    return movie.poster_url || movie.portrait_url || '/placeholder.jpg';
  }

  return movie.portrait_url || movie.poster_url || '/placeholder.jpg';
}

function DiscoverPosterCard({
  movie,
  isLoggedIn,
  isSaved,
  onWatchlistClick,
}: {
  movie: DiscoverMovie;
  isLoggedIn: boolean;
  isSaved: boolean;
  onWatchlistClick: (movie: DiscoverMovie) => void;
}) {
  const genres = splitValues(movie.genres);
  const platforms = splitValues(movie.platforms);

  return (
    <article className="discover-poster-card">
      <Link
        href={`/movie/${movie.movie_id}`}
        className="discover-poster-link"
        aria-label={`View details for ${movie.title}`}
      >
        <div className="discover-poster-image-wrap">
          <img
            src={getMovieImage(movie, 'portrait')}
            alt={movie.title}
            className="discover-poster-image"
          />

          <div className="discover-poster-overlay">
            <span className="discover-poster-view">View details</span>
          </div>

          {genres[0] && (
            <span className="discover-card-badge">{genres[0]}</span>
          )}
        </div>
      </Link>

      <div className="discover-poster-copy">
        <h3 title={movie.title}>{movie.title}</h3>

        <p>
          {movie.release_year || 'Year unavailable'}
          <span>•</span>
          {movie.content_type || 'Movie'}
          <span>•</span>
          {formatDuration(movie.duration_minutes)}
        </p>

        {platforms.length > 0 && (
          <p className="discover-platform-line">
            Available on {platforms.slice(0, 2).join(', ')}
          </p>
        )}

        <div className="discover-card-actions">
          <Link
            href={`/movie/${movie.movie_id}`}
            className="discover-details-button"
          >
            Show details
          </Link>

          {isLoggedIn && (
            <button
              type="button"
              className={
                isSaved
                  ? 'discover-watchlist-button saved'
                  : 'discover-watchlist-button'
              }
              onClick={() => onWatchlistClick(movie)}
            >
              {isSaved ? 'Saved' : '+ Watchlist'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CollectionRow({
  collection,
  isLoggedIn,
  savedMovieIds,
  onWatchlistClick,
}: {
  collection: DiscoverCollection;
  isLoggedIn: boolean;
  savedMovieIds: number[];
  onWatchlistClick: (movie: DiscoverMovie) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 'left' | 'right') {
    rowRef.current?.scrollBy({
      left: direction === 'left' ? -650 : 650,
      behavior: 'smooth',
    });
  }

  return (
    <section className="discover-collection-section">
      <div className="discover-section-heading">
        <div>
          <p className="discover-eyebrow">Curated collection</p>

          <h2>
            {collection.icon_url && (
              <img
                src={collection.icon_url}
                alt=""
                className="discover-heading-icon"
              />
            )}

            {collection.mood_name}
          </h2>
        </div>

        <div className="discover-row-controls">
          <button
            type="button"
            aria-label={`Scroll ${collection.mood_name} left`}
            onClick={() => scroll('left')}
          >
            ‹
          </button>

          <button
            type="button"
            aria-label={`Scroll ${collection.mood_name} right`}
            onClick={() => scroll('right')}
          >
            ›
          </button>
        </div>
      </div>

      <div className="discover-collection-row" ref={rowRef}>
        {collection.movies.map((movie) => (
          <DiscoverPosterCard
            key={`${collection.mood_id}-${movie.movie_id}`}
            movie={movie}
            isLoggedIn={isLoggedIn}
            isSaved={savedMovieIds.includes(movie.movie_id)}
            onWatchlistClick={onWatchlistClick}
          />
        ))}
      </div>
    </section>
  );
}

export default function DiscoverPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [data, setData] = useState<DiscoverResponse>({
    featured: null,
    collections: [],
    movies: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [sortBy, setSortBy] = useState('title');

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<DiscoverMovie | null>(null);
  const [savedMovieIds, setSavedMovieIds] = useState<number[]>([]);
  const [watchlistError, setWatchlistError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

    const [trendingMovies, setTrendingMovies] = useState<DiscoverMovie[]>([]);
    const [currentTrending, setCurrentTrending] = useState(0);
    const featured = trendingMovies[currentTrending] || null;

  useEffect(() => {
    async function loadDiscoverPage() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/discover', {
          cache: 'no-store',
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || 'Unable to load Discover.');
        }

        const result: DiscoverResponse = await response.json();

        setData(result);

        const shuffledMovies = [...result.movies];

        for (let i = shuffledMovies.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [shuffledMovies[i], shuffledMovies[randomIndex]] = [
            shuffledMovies[randomIndex],
            shuffledMovies[i],
        ];
        }

        setTrendingMovies(shuffledMovies.slice(0, 3));
        setCurrentTrending(0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading Discover.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDiscoverPage();
  }, []);

  useEffect(() => {
    async function loadWatchlists() {
      if (!user?.user_id) {
        setWatchlists([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/watchlists?userId=${user.user_id}`,
          { cache: 'no-store' }
        );

        if (!response.ok) return;

        const result: Watchlist[] = await response.json();
        setWatchlists(result);
      } catch (err) {
        console.error('Unable to load watchlists:', err);
      }
    }

    loadWatchlists();
  }, [user?.user_id]);

  const genres = useMemo(() => {
    return Array.from(
      new Set(data.movies.flatMap((movie) => splitValues(movie.genres)))
    ).sort((a, b) => a.localeCompare(b));
  }, [data.movies]);

  const platforms = useMemo(() => {
    return Array.from(
      new Set(data.movies.flatMap((movie) => splitValues(movie.platforms)))
    ).sort((a, b) => a.localeCompare(b));
  }, [data.movies]);

  const contentTypes = useMemo(() => {
    return Array.from(
      new Set(
        data.movies
          .map((movie) => movie.content_type)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [data.movies]);

  const filteredMovies = useMemo(() => {
    const result = data.movies.filter((movie) => {
      const movieGenres = splitValues(movie.genres);
      const moviePlatforms = splitValues(movie.platforms);

      return (
        (!selectedGenre || movieGenres.includes(selectedGenre)) &&
        (!selectedPlatform || moviePlatforms.includes(selectedPlatform)) &&
        (!selectedContentType || movie.content_type === selectedContentType)
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.release_year || 0) - (a.release_year || 0);
      }

      if (sortBy === 'oldest') {
        return (a.release_year || 0) - (b.release_year || 0);
      }

      return a.title.localeCompare(b.title);
    });
  }, [
    data.movies,
    selectedGenre,
    selectedPlatform,
    selectedContentType,
    sortBy,
  ]);

  function clearFilters() {
    setSelectedGenre('');
    setSelectedPlatform('');
    setSelectedContentType('');
    setSortBy('title');
  }

useEffect(() => {
  if (trendingMovies.length <= 1) return;

  const timer = setInterval(() => {
    setCurrentTrending((prev) =>
      (prev + 1) % trendingMovies.length
    );
  }, 5000);

  return () => clearInterval(timer);
}, [trendingMovies.length]);

  async function handleWatchlistClick(movie: DiscoverMovie) {
    if (!user?.user_id) return;

    if (savedMovieIds.includes(movie.movie_id)) {
      try {
        const response = await fetch('/api/watchlist-movies/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movieId: movie.movie_id,
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || 'Unable to remove movie.');
        }

        setSavedMovieIds((current) =>
          current.filter((movieId) => movieId !== movie.movie_id)
        );
      } catch (err) {
        setWatchlistError(
          err instanceof Error ? err.message : 'Unable to remove movie.'
        );
      }

      return;
    }

    setWatchlistError('');
    setSelectedMovie(movie);
  }

  async function handleSaveToWatchlist(watchlistId: number) {
    if (!selectedMovie || !user?.user_id || isSaving) return;

    try {
      setIsSaving(true);
      setWatchlistError('');

      const response = await fetch('/api/watchlist-movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchlistId,
          movieId: selectedMovie.movie_id,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Unable to save this movie.');
      }

      setSavedMovieIds((current) =>
        current.includes(selectedMovie.movie_id)
          ? current
          : [...current, selectedMovie.movie_id]
      );

      setSelectedMovie(null);
    } catch (err) {
      setWatchlistError(
        err instanceof Error ? err.message : 'Unable to save this movie.'
      );
    } finally {
      setIsSaving(false);
    }
  }

    const featuredGenres = splitValues(featured?.genres);
    const featuredPlatforms = splitValues(featured?.platforms);
  return (
    <main className="discover-page">
      {loading && (
        <div className="discover-page-inner discover-loading-area">
          <div className="discover-status-card">
            <div className="discover-loading-spinner" />
            <p>Loading your movie library...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="discover-page-inner discover-loading-area">
          <div className="discover-status-card error">
            <h2>Discover could not be loaded</h2>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && featured && (
        <>
          <section
  className="discover-showcase-hero"
  style={{
    backgroundImage: `
      linear-gradient(
        90deg,
        rgba(3,10,22,.96) 0%,
        rgba(3,10,22,.82) 35%,
        rgba(3,10,22,.35) 70%,
        rgba(3,10,22,.15) 100%
      ),
      linear-gradient(
        0deg,
        rgba(3,12,24,.95) 0%,
        rgba(3,12,24,.15) 45%,
        rgba(3,12,24,.05) 100%
      ),
      url('/backgrounds/default.png')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
            <div className="discover-showcase-shell">
              <h1 className="discover-showcase-heading">
                Trending <span>Today</span>
              </h1>

              <button
                    type="button"
                    className="discover-showcase-arrow left"
                    onClick={() =>
                        setCurrentTrending((prev) =>
                        prev === 0
                            ? trendingMovies.length - 1
                            : prev - 1
                        )
                    }
                    >
                    ‹
                    </button>

              <article className="discover-showcase-card">
                <div className="discover-showcase-portrait">
                  <img
                    src={getMovieImage(featured, 'portrait')}
                    alt={featured.title}
                  />
                </div>

                <div className="discover-showcase-info">
                  <div className="discover-showcase-tags">
                    {featuredGenres[0] && (
                      <span className="discover-showcase-genre">
                        {featuredGenres[0]}
                      </span>
                    )}
                  </div>

                  <h2>{featured.title}</h2>

                  <p className="discover-showcase-meta">
                    <span>{featured.content_type || 'Movie'}</span>
                    <span>•</span>
                    <span>{formatDuration(featured.duration_minutes)}</span>
                    <span>•</span>
                    <span>{featured.release_year || 'Year unavailable'}</span>
                  </p>

                  <p className="discover-showcase-label">About</p>

                  <p className="discover-showcase-description">
                    {featured.description ||
                      'Open this title to learn more about the story, cast, and where it is available.'}
                  </p>

                  <p className="discover-showcase-label">Available on</p>

                  <div className="discover-showcase-platforms">
                    {featuredPlatforms.length > 0 ? (
                      featuredPlatforms.slice(0, 3).map((platform) => (
                        <span key={platform}>{platform}</span>
                      ))
                    ) : (
                      <span>Platform unavailable</span>
                    )}
                  </div>

                  <div className="discover-showcase-actions">
                    {user?.user_id && (
                      <button
                        type="button"
                        className={
                          savedMovieIds.includes(featured.movie_id)
                            ? 'discover-showcase-watchlist saved'
                            : 'discover-showcase-watchlist'
                        }
                        onClick={() => handleWatchlistClick(featured)}
                      >
                        {savedMovieIds.includes(featured.movie_id)
                          ? 'Saved'
                          : 'Add to watchlist'}
                      </button>
                    )}

                    <Link
                      href={`/movie/${featured.movie_id}`}
                      className="discover-showcase-details"
                    >
                      Show details
                    </Link>
                  </div>
                </div>
              </article>

              <button
                    type="button"
                    className="discover-showcase-arrow right"
                    onClick={() =>
                        setCurrentTrending((prev) =>
                        (prev + 1) % trendingMovies.length
                        )
                    }
                    >
                    ›
                    </button>

              <div className="discover-showcase-dots">
                    {trendingMovies.map((_, index) => (
                        <button
                        key={index}
                        className={
                            index === currentTrending
                            ? "active"
                            : ""
                        }
                        onClick={() => setCurrentTrending(index)}
                        />
                    ))}
                    </div>
            </div>
          </section>

          <div className="discover-page-inner discover-page-content">
            <section
              id="discover-collections"
              className="discover-curated-block"
            >
              <div className="discover-curated-title">
                <p className="discover-eyebrow">Made for every mood</p>
                <h2>Curated Collections</h2>
              </div>

              {data.collections.length > 0 ? (
                data.collections.map((collection) => (
                  <CollectionRow
                    key={collection.mood_id}
                    collection={collection}
                    isLoggedIn={Boolean(user?.user_id)}
                    savedMovieIds={savedMovieIds}
                    onWatchlistClick={handleWatchlistClick}
                  />
                ))
              ) : (
                <div className="discover-empty-card">
                  Add movie-to-mood relationships to show curated collections.
                </div>
              )}
            </section>

            <section className="discover-browse-section">
              <div className="discover-section-heading discover-browse-heading">
                <div>
                  <p className="discover-eyebrow">Your complete library</p>
                  <h2>Browse All Content</h2>
                </div>

                <p className="discover-result-count">
                  {filteredMovies.length}{' '}
                  {filteredMovies.length === 1 ? 'title' : 'titles'}
                </p>
              </div>

              <div className="discover-filter-bar">
                <label>
                  <span>Genre</span>
                  <select
                    value={selectedGenre}
                    onChange={(event) => setSelectedGenre(event.target.value)}
                  >
                    <option value="">All genres</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Streaming service</span>
                  <select
                    value={selectedPlatform}
                    onChange={(event) =>
                      setSelectedPlatform(event.target.value)
                    }
                  >
                    <option value="">All services</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Content type</span>
                  <select
                    value={selectedContentType}
                    onChange={(event) =>
                      setSelectedContentType(event.target.value)
                    }
                  >
                    <option value="">All content</option>
                    {contentTypes.map((contentType) => (
                      <option key={contentType} value={contentType}>
                        {contentType}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Sort by</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="title">Title A–Z</option>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="discover-clear-button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>

              {filteredMovies.length > 0 ? (
                <div className="discover-movie-grid">
                  {filteredMovies.map((movie) => (
                    <DiscoverPosterCard
                      key={movie.movie_id}
                      movie={movie}
                      isLoggedIn={Boolean(user?.user_id)}
                      isSaved={savedMovieIds.includes(movie.movie_id)}
                      onWatchlistClick={handleWatchlistClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="discover-empty-card">
                  No titles match these filters. Try clearing one or more
                  selections.
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {selectedMovie && user?.user_id && (
        <div
          className="discover-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedMovie(null);
              setWatchlistError('');
            }
          }}
        >
          <div
            className="discover-watchlist-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discover-watchlist-title"
          >
            <button
              type="button"
              className="discover-modal-close"
              aria-label="Close"
              onClick={() => {
                setSelectedMovie(null);
                setWatchlistError('');
              }}
            >
              ×
            </button>

            <p className="discover-eyebrow">Save for later</p>

            <h2 id="discover-watchlist-title">
              Add “{selectedMovie.title}”
            </h2>

            <p>Select the watchlist where you would like to save this title.</p>

            {watchlistError && (
              <div className="discover-modal-error">{watchlistError}</div>
            )}

            <div className="discover-watchlist-options">
              {watchlists.length > 0 ? (
                watchlists.map((watchlist) => (
                  <button
                    key={watchlist.watchlist_id}
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveToWatchlist(watchlist.watchlist_id)
                    }
                  >
                    <span>{watchlist.name}</span>
                    <span>
                      {watchlist.total_titles ?? 0}{' '}
                      {(watchlist.total_titles ?? 0) === 1
                        ? 'title'
                        : 'titles'}
                    </span>
                  </button>
                ))
              ) : (
                <p className="discover-no-watchlists">
                  You do not have a watchlist yet. Create one from your profile
                  or watchlist page first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
