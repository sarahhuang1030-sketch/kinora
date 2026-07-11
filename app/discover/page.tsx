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

function BrowseMovieCard({
  movie,
}: {
  movie: DiscoverMovie;
}) {
  const genres = splitValues(movie.genres);
  const platforms = splitValues(movie.platforms);
  const moods = splitValues(movie.moods);

  return (
    <article className="discover-browse-card">
      <Link
        href={`/movie/${movie.movie_id}`}
        className="discover-browse-card-image-link"
        aria-label={`View details for ${movie.title}`}
      >
        <div className="discover-browse-card-image-wrap">
          <img
            src={movie.poster_url || movie.portrait_url || "/placeholder.jpg"}
            alt={movie.title}
            className="discover-browse-card-image"
            />
        </div>
      </Link>

      <div className="discover-browse-card-body">
        <div className="discover-browse-card-top">
          <div className="discover-browse-card-copy">
            <h3>{movie.title}</h3>

            <p className="discover-browse-card-meta">
              <span>{platforms[0] || 'Platform unavailable'}</span>
              <span>•</span>
              <span>{movie.content_type || 'Movie'}</span>
              <span>•</span>
              <span>{formatDuration(movie.duration_minutes)}</span>
            </p>
          </div>

          <span className="discover-browse-card-mood">
            {moods[0] || genres[0] || 'Featured'}
          </span>
        </div>

        <p className="discover-browse-card-description">
          {movie.description ||
            'Open this title to learn more about the story and where it is available.'}
        </p>

        <Link
          href={`/movie/${movie.movie_id}`}
          className="discover-browse-card-details"
        >
          Show more details
        </Link>
      </div>
    </article>
  );
}

function CompactCollectionRow({
  collection,
}: {
  collection: DiscoverCollection;
}) {
  const visibleMovies = collection.movies.slice(0, 9);

  const totalMinutes = collection.movies.reduce(
    (total, movie) => total + (movie.duration_minutes || 0),
    0
  );

  const totalHours =
    totalMinutes > 0 ? Math.max(1, Math.round(totalMinutes / 60)) : null;

  return (
    <article className="discover-compact-collection">
      <div className="discover-compact-collection-label">
        <div>
          <h3>{collection.mood_name}</h3>

          <p>
            {collection.movies.length}{' '}
            {collection.movies.length === 1 ? 'Movie' : 'Movies'}

            {totalHours && (
              <>
                <span>•</span>
                {totalHours}hrs
              </>
            )}
          </p>
        </div>

        <Link
          href={`/discover/collections/${collection.mood_id}`}
          className="discover-compact-view-all"
        >
          View all
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="discover-compact-movies">
        {visibleMovies.map((movie) => (
          <Link
            href={`/movie/${movie.movie_id}`}
            key={`${collection.mood_id}-${movie.movie_id}`}
            className="discover-compact-poster"
            aria-label={`View details for ${movie.title}`}
          >
            <img
              src={getMovieImage(movie, 'portrait')}
              alt={movie.title}
            />

            <span className="discover-compact-poster-overlay">
              View
            </span>
          </Link>
        ))}
      </div>
    </article>
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
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<DiscoverMovie | null>(null);
  const [savedMovieIds, setSavedMovieIds] = useState<number[]>([]);
  const [watchlistError, setWatchlistError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [collectionTab, setCollectionTab] = useState<'cineri' | 'mood'>(
    'cineri'
  );

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

  const moods = useMemo(() => {
    return Array.from(
      new Set(data.movies.flatMap((movie) => splitValues(movie.moods)))
    ).sort((a, b) => a.localeCompare(b));
  }, [data.movies]);

  const releaseYears = useMemo(() => {
    return Array.from(
      new Set(
        data.movies
          .map((movie) => movie.release_year)
          .filter((year): year is number => year !== null)
      )
    ).sort((a, b) => b - a);
  }, [data.movies]);

  const filteredMovies = useMemo(() => {
    return data.movies.filter((movie) => {
      const movieGenres = splitValues(movie.genres);
      const moviePlatforms = splitValues(movie.platforms);
      const movieMoods = splitValues(movie.moods);
      const duration = movie.duration_minutes || 0;
      const contentType = (movie.content_type || '').toLowerCase();

      const matchesDuration =
        !selectedDuration ||
        (selectedDuration === 'short' && duration > 0 && duration < 90) ||
        (selectedDuration === 'medium' && duration >= 90 && duration <= 120) ||
        (selectedDuration === 'long' && duration > 120);

      const matchesContentType =
        !selectedContentType ||
        (selectedContentType === 'movie' && contentType.includes('movie')) ||
        (selectedContentType === 'series' &&
          (contentType.includes('series') ||
            contentType.includes('show') ||
            contentType.includes('tv')));

      return (
        (!selectedGenre || movieGenres.includes(selectedGenre)) &&
        (!selectedPlatform || moviePlatforms.includes(selectedPlatform)) &&
        (!selectedMood || movieMoods.includes(selectedMood)) &&
        (!selectedYear ||
          movie.release_year === Number(selectedYear)) &&
        matchesDuration &&
        matchesContentType
      );
    });
  }, [
    data.movies,
    selectedGenre,
    selectedPlatform,
    selectedMood,
    selectedDuration,
    selectedYear,
    selectedContentType,
  ]);

  const displayedCollections = useMemo(() => {
    if (collectionTab === 'cineri') {
      return data.collections.slice(0, 3);
    }

    return data.collections;
  }, [collectionTab, data.collections]);

  function clearFilters() {
    setSelectedGenre('');
    setSelectedPlatform('');
    setSelectedMood('');
    setSelectedDuration('');
    setSelectedYear('');
    setSelectedContentType('');
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
              <div className="discover-curated-header">
                <div className="discover-curated-title">
                  <p className="discover-eyebrow">Hand picked by Cineri</p>
                  <h2>Curated Collections</h2>
                </div>

                <div
                  className="discover-collection-tabs"
                  role="tablist"
                  aria-label="Collection categories"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={collectionTab === 'cineri'}
                    className={collectionTab === 'cineri' ? 'active' : ''}
                    onClick={() => setCollectionTab('cineri')}
                  >
                    Cineri Collections
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={collectionTab === 'mood'}
                    className={collectionTab === 'mood' ? 'active' : ''}
                    onClick={() => setCollectionTab('mood')}
                  >
                    Mood Collections
                  </button>
                </div>
              </div>

              {displayedCollections.length > 0 ? (
                <div className="discover-compact-collection-list">
                  {displayedCollections.map((collection) => (
                    <CompactCollectionRow
                      key={collection.mood_id}
                      collection={collection}
                    />
                  ))}
                </div>
              ) : (
                <div className="discover-empty-card">
                  Add movie-to-mood relationships to show curated collections.
                </div>
              )}
            </section>

            <section className="discover-browse-section">
              <div className="discover-browse-header">
                <div>
                  <p className="discover-eyebrow">Discovery</p>
                  <h2>Browse All Content</h2>
                  <p className="discover-browse-subtitle">
                    Newly released and trending titles across every platform
                  </p>
                </div>

                <button
                  type="button"
                  className="discover-browse-clear"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>

              <div className="discover-browse-toolbar">
                <div className="discover-browse-filter-group">
                  <span className="discover-browse-filter-label">
                    Filter by:
                  </span>

                  <label className="discover-browse-select">
                    <span aria-hidden="true">▣</span>
                    <select
                      value={selectedPlatform}
                      onChange={(event) =>
                        setSelectedPlatform(event.target.value)
                      }
                    >
                      <option value="">Streaming Service</option>
                      {platforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="discover-browse-select">
                    <span aria-hidden="true">◷</span>
                    <select
                      value={selectedDuration}
                      onChange={(event) =>
                        setSelectedDuration(event.target.value)
                      }
                    >
                      <option value="">Duration</option>
                      <option value="short">Under 90 minutes</option>
                      <option value="medium">90–120 minutes</option>
                      <option value="long">Over 120 minutes</option>
                    </select>
                  </label>

                  <label className="discover-browse-select">
                    <span aria-hidden="true">♡</span>
                    <select
                      value={selectedMood}
                      onChange={(event) => setSelectedMood(event.target.value)}
                    >
                      <option value="">Mood</option>
                      {moods.map((mood) => (
                        <option key={mood} value={mood}>
                          {mood}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="discover-browse-select">
                    <span aria-hidden="true">▱</span>
                    <select
                      value={selectedGenre}
                      onChange={(event) => setSelectedGenre(event.target.value)}
                    >
                      <option value="">Genre</option>
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="discover-browse-select">
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                    >
                      <option value="">Year of Release</option>
                      {releaseYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div
                  className="discover-content-type-tabs"
                  role="tablist"
                  aria-label="Content type"
                >
                  <button
                    type="button"
                    className={selectedContentType === '' ? 'active' : ''}
                    onClick={() => setSelectedContentType('')}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    className={
                      selectedContentType === 'movie' ? 'active' : ''
                    }
                    onClick={() => setSelectedContentType('movie')}
                  >
                    Movies
                  </button>

                  <button
                    type="button"
                    className={
                      selectedContentType === 'series' ? 'active' : ''
                    }
                    onClick={() => setSelectedContentType('series')}
                  >
                    Series
                  </button>
                </div>
              </div>

              {filteredMovies.length > 0 ? (
                <div className="discover-browse-grid">
                  {filteredMovies.map((movie) => (
                    <BrowseMovieCard
                      key={movie.movie_id}
                      movie={movie}
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