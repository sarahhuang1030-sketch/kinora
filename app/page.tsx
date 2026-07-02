'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type DbMovie = {
  movie_id: number;
  title: string;
  description?: string | null;
  release_year: number;
  poster_url: string | null;
  genre: string | null;
  mood?: string | null;
  content_type?: string | null;
  duration?: string | null;
  platforms: string | null;
};

type DbMood = {
  mood_id: number;
  mood_name: string;
  icon_url: string | null;
};

type SessionUser = {
  user_id?: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type CardMovie = {
  movie_id: number;
  title: string;
  description: string;
  year: number;
  poster: string;
  genre: string;
  mood: string;
  contentType: string;
  duration: string;
  platforms: string[];
  saved?: boolean;
};

type Watchlist = {
  watchlist_id: number;
  name: string;
  total_titles: number;
  watched_count: number;
};

type DbGenre = {
  genre_id: number;
  genre_name: string;
};

type DbPlatform = {
  platform_id: number;
  platform_name: string;
};

// const moodIcons: Record<string, string> = {
//   Relaxed: '🌙',
//   Adventurous: '🧭',
//   Suspenseful: '🔥',
//   'Feel Good': '😊',
//   Dark: '🖤',
//   Heartwarming: '❤️',
//   'Thought Provoking': '💡',
//   Intense: '⚡',
//   Emotional: '🥹',
// };



function mapDbMovie(movie: DbMovie, fallbackPoster: string, index: number): CardMovie {
  const platforms = movie.platforms
    ? movie.platforms
        .split(',')
        .map((item) => item.split('|')[0].trim())
        .filter(Boolean)
    : ['Prime'];

  return {
    movie_id: movie.movie_id,
    title: movie.title,
    description:
      movie.description ||
      'A personalized pick selected from your preferences, watch history, and streaming subscriptions.',
    year: movie.release_year,
    poster: movie.poster_url || fallbackPoster,
    genre: movie.genre || 'Thrilling',
    mood: movie.mood || movie.genre || ['Thrilling', 'Mind-bending', 'Feel Good'][index % 3],
    contentType: movie.content_type || 'Movie',
    duration: movie.duration || (movie.content_type === 'TV Series' ? '2 seasons' : '2h 15m'),
    platforms,
  };
}

function MovieCard({
  movie,
  isLoggedIn,
  onWatchlistClick,
  isSaved,
}: {
  movie: CardMovie;
  isLoggedIn: boolean;
  onWatchlistClick: (movie: CardMovie) => void;
  isSaved:boolean;
}) {
  const platform = movie.platforms[0] || 'Prime';

  return (
    <article className="home-movie-card">
      <div className="home-movie-poster">
        <img src={movie.poster} alt={movie.title} />
        <span className="home-movie-badge">{movie.mood}</span>
      </div>

      <div className="home-movie-body">
        <p className="home-movie-meta">
          <span className="home-dot" /> {platform} · {movie.contentType} · {movie.duration}
        </p>

        <h3>{movie.title}</h3>
        <p className="home-movie-desc">{movie.description}</p>

        <div className="home-movie-actions">
          <Link href={`/movie/${movie.movie_id}`} className="home-show-btn">
            ⊕ Show details
          </Link>

          {isLoggedIn && (
              <button
                className={isSaved ? 'home-save-btn saved' : 'home-save-btn'}
                onClick={() => onWatchlistClick(movie)}
              >
                {isSaved ? '▣ Saved' : '▢ Watchlist'}
              </button>
          )}
        </div>
      </div>
    </article>
  );
}

function WatchlistBox({
  title,
  totalTitles,
  watchedCount,
}: {
  title: string;
  totalTitles: number;
  watchedCount: number;
}) {
  const progress =
    totalTitles > 0
      ? Math.round((watchedCount / totalTitles) * 100)
      : 0;

  return (
    <div className="home-watch-box">
      <h4>{title}</h4>

      <p>{totalTitles} titles</p>

      <div className="home-progress-line">
        <span
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="home-watch-row">
        <span>{watchedCount} watched</span>
        <span>{progress}%</span>
      </div>

      <button>View list</button>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [recommendedMovies, setRecommendedMovies] = useState<CardMovie[]>([]);
  const [moreLikeThis, setMoreLikeThis] = useState<CardMovie[]>([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [appliedMood, setAppliedMood] = useState('');
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<CardMovie | null>(null);
  const [savedMovieIds, setSavedMovieIds] = useState<number[]>([]);
// console.log('WATCHLISTS STATE', watchlists);

const [selectedPlatform, setSelectedPlatform] = useState('');
const [selectedDuration, setSelectedDuration] = useState('');
const [selectedGenre, setSelectedGenre] = useState('');
const [genres, setGenres] = useState<DbGenre[]>([]);
const [platforms, setPlatforms] = useState<DbPlatform[]>([]);

  async function handleSaveToWatchlist(watchlistId: number) {
    
  if (!selectedMovie) return;
  setSavedMovieIds((current) => [...current, selectedMovie.movie_id]);
  const res = await fetch('/api/watchlist-movies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      watchlistId,
      movieId: selectedMovie.movie_id,
    }),
  });

  if (!res.ok) return;

  setSelectedMovie(null);

  const updated = await fetch(`/api/watchlists?userId=${user?.user_id}`);
  const data = await updated.json();
  setWatchlists(data);
}

   function handleMoodClick(moodName: string) {
  setSelectedMood((current) => {
    const nextMood = current === moodName ? '' : moodName;

    if (nextMood === '') {
      setAppliedMood('');
    }

    return nextMood;
  });
}

  const [moods, setMoods] = useState<DbMood[]>([]);

 useEffect(() => {
  async function loadFilters() {
    try {
      const [moodsRes, genresRes, platformsRes] = await Promise.all([
        fetch("/api/moods"),
        fetch("/api/genres"),
        fetch("/api/streaming-services"),
      ]);

      if (moodsRes.ok) {
        setMoods(await moodsRes.json());
      }

      if (genresRes.ok) {
        setGenres(await genresRes.json());
      }

      if (platformsRes.ok) {
        setPlatforms(await platformsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  }

  loadFilters();
}, []);

  useEffect(() => {
    async function loadHomeMovies() {
      try {
        const params = new URLSearchParams();

        if (user?.user_id) params.set('userId', String(user.user_id));
        if (appliedMood) params.set('mood', appliedMood);
        if (selectedPlatform) params.set('platform', selectedPlatform);
        if (selectedDuration) params.set('duration', selectedDuration);
        if (selectedGenre) params.set('genre', selectedGenre);



        const res = await fetch(`/api/home?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();

        const recommended = (data.recommended || []).map((movie: DbMovie, index: number) =>
          mapDbMovie(movie, `/recommended/r${(index % 8) + 1}.webp`, index)
        );

        const trending = (data.trending || []).map((movie: DbMovie, index: number) =>
          mapDbMovie(movie, `/trending/t${(index % 8) + 1}.webp`, index)
        );

        setRecommendedMovies(recommended.slice(0, 6));
        setMoreLikeThis(trending.slice(0, 3));
      } catch {
        // Keep fallback content when the API is not ready.
      }
    }

    loadHomeMovies();
  }, [user?.user_id, appliedMood, selectedPlatform, selectedDuration, selectedGenre]);

  useEffect(() => {
  async function loadWatchlists() {
    if (!user?.user_id) return;
// const userId = user?.user_id || 29;
    try {
      const res = await fetch(
        `/api/watchlists?userId=${user.user_id}`
      );

      // const res = await fetch(`/api/watchlists?userId=${userId}`);

      if (!res.ok) return;

      const data = await res.json();

      setWatchlists(data);
    } catch (error) {
      console.error(error);
    }
  }

  loadWatchlists();
}, [user?.user_id]);

async function handleToggleSaved(movie: CardMovie) {
  const isSaved = savedMovieIds.includes(movie.movie_id);

  if (isSaved) {
    const res = await fetch('/api/watchlist-movies/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieId: movie.movie_id,
      }),
    });

    if (!res.ok) return;

    setSavedMovieIds((current) =>
      current.filter((id) => id !== movie.movie_id)
    );

    const updated = await fetch(`/api/watchlists?userId=${user?.user_id}`);
    const data = await updated.json();
    setWatchlists(data);

    return;
  }

  setSelectedMovie(movie);
}

  function handleRecommendationsClick() {
  setAppliedMood(selectedMood);

  document
    .getElementById('recommended-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

  function handleSurpriseMe() {
    if (!moods.length) return;

    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    setSelectedMood(randomMood.mood_name);

    document
      .getElementById('recommended-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main className="home-page">
      <section className="home-mood-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">Mood-based discovery</p>

          <h1>
            Find what you Love.
            <br />
            <span>Choose how you Feel</span>
          </h1>

          <h2>What kind of mood are you into tonight?</h2>

          <div className="home-mood-grid">
            {moods.map((mood) => (
              <button
                  key={mood.mood_id}
                  className={
                    selectedMood === mood.mood_name
                      ? 'home-mood-pill active'
                      : 'home-mood-pill'
                  }
                  onClick={() => handleMoodClick(mood.mood_name)}
                >
                  <span className="home-mood-icon"> {mood.icon_url && (
                    <img src={mood.icon_url} alt="" />
                  )}</span>

                  <span className="home-mood-name">
                    {mood.mood_name}
                  </span>
                </button>
            ))}

            <button className="home-mood-pill surprise" onClick={handleSurpriseMe}>
              <span>✨</span>
              Surprise Me
            </button>
          </div>

          <p className="home-tiny-note">Select at least one mood to get personalized picks</p>

          <button className="home-recommend-btn" onClick={handleRecommendationsClick}>
            Show my recommendations
          </button>
        </div>

        <button className="home-explore-btn" onClick={handleRecommendationsClick}>
          Explore all ˅
        </button>
      </section>

      <section className="home-content-wrap" id="recommended-section">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">Personalized recommendations</p>
            <h2>Recommended for you</h2>
            <p>Based on your preferences, watch history and streaming subscriptions</p>
          </div>

          <div className="home-filters">
  <select
  value={selectedPlatform}
  onChange={(e) => setSelectedPlatform(e.target.value)}
>
  <option value="">Streaming Service</option>

  {platforms.map((platform) => (
    <option
      key={platform.platform_id}
      value={platform.platform_name}
    >
      {platform.platform_name}
    </option>
  ))}
</select>

  <select value={selectedDuration} onChange={(e) => setSelectedDuration(e.target.value)}>
    <option value="">Duration</option>
    <option value="short">Under 90 min</option>
    <option value="medium">90–120 min</option>
    <option value="long">Over 120 min</option>
  </select>

  {/* <select value={appliedMood} onChange={(e) => setAppliedMood(e.target.value)}>
    <option value="">Mood</option>
    {moods.map((mood) => (
      <option key={mood.mood_id} value={mood.mood_name}>
        {mood.mood_name}
      </option>
    ))}
  </select> */}

          <select
  value={selectedGenre}
  onChange={(e) => setSelectedGenre(e.target.value)}
>
  <option value="">Genre</option>

  {genres.map((genre) => (
    <option
      key={genre.genre_id}
      value={genre.genre_name}
    >
      {genre.genre_name}
    </option>
  ))}
</select>
        </div>
        </div>

        <div className="home-movie-grid">
            {recommendedMovies.length === 0 ? (
              <div className="home-empty-state">
                No recommendations found for this mood.
              </div>
            ) : (
              recommendedMovies.slice(0, 6).map((movie) => (
                <MovieCard
                  key={movie.movie_id}
                  movie={movie}
                  isLoggedIn={!!user?.user_id}
                  isSaved={savedMovieIds.includes(movie.movie_id)}
                  onWatchlistClick={handleToggleSaved}
                />
              ))
            )}
          </div>

        <div className="home-library-head">
          <div>
            <p className="home-eyebrow">Your library</p>
            <h2>My watchlists</h2>
          </div>

          {/* <button>Manage ›</button> */}
        </div>

        <div className="home-watch-grid">
          {!user?.user_id ? (
            <div className="home-watch-empty">
            <div>
              <h3>Sign in to create your watchlists</h3>
              <p>Save movies into lists like Date Night, My Faves, and Weekend Binge.</p>
            </div>

            <Link href="/login" className="home-watch-login-btn">
              Login
            </Link>
          </div>
          ) : (
            <>
              {watchlists.map((list) => (
                <WatchlistBox
                  key={list.watchlist_id}
                  title={list.name}
                  totalTitles={Number(list.total_titles)}
                  watchedCount={Number(list.watched_count)}
                />
              ))}

              <div className="home-create-list">
                <span>＋</span>
                <p>Create new list</p>
              </div>
            </>
          )}
        </div>

        {/* <section className="home-more-section">
          <p className="home-eyebrow">More like this</p>

          <h2>
            Because you liked <span>Oppenheimer</span>
          </h2>

          <div className="home-movie-grid three">
            {moreLikeThis.map((movie) => (
              <MovieCard
                key={movie.movie_id}
                movie={movie}
                isLoggedIn={!!user?.user_id}
                isSaved={savedMovieIds.includes(movie.movie_id)}
                onWatchlistClick={handleToggleSaved}
              />
            ))}
          </div>
        </section> */}

        <section className="home-more-section">
  <p className="home-eyebrow">More to explore</p>

  <h2>
    Trending movies you may like
  </h2>

  <div className="home-movie-grid three">
    {moreLikeThis.map((movie) => (
      <MovieCard
        key={movie.movie_id}
        movie={movie}
        isLoggedIn={!!user?.user_id}
        isSaved={savedMovieIds.includes(movie.movie_id)}
        onWatchlistClick={handleToggleSaved}
      />
    ))}
  </div>
</section>

      </section>
{selectedMovie && (
  <div className="watchlist-modal-backdrop">
    <div className="watchlist-modal">
      <button className="watchlist-modal-close" onClick={() => setSelectedMovie(null)}>
        ×
      </button>

      <h3>Add to watchlist</h3>
      <p>{selectedMovie.title}</p>

      {watchlists.map((list) => (
        <button
          key={list.watchlist_id}
          className="watchlist-choice-btn"
          onClick={() => handleSaveToWatchlist(list.watchlist_id)}
        >
          {list.name}
        </button>
      ))}
    </div>
  </div>
)}


    </main>
  );
}