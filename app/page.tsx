'use client';

import { useEffect, useMemo, useState } from 'react';
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

const moodChoices = [
  { label: 'Relaxing', text: 'Feel Good', icon: '☼', tone: 'blue' },
  { label: 'Romantic', text: '', icon: '♡', tone: 'red' },
  { label: 'Mind-Bending', text: '', icon: '⌁', tone: 'purple' },
  { label: 'Adventurous', text: 'Thrilling', icon: '♨', tone: 'yellow' },
  { label: 'Spooky', text: '', icon: '☠', tone: 'green' },
  { label: 'Surprise me', text: '', icon: '✧', tone: 'gray' },
];

const fallbackMovies: CardMovie[] = [
  {
    movie_id: 1,
    title: 'Oppenheimer',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    year: 2023,
    poster: '/recommended/r1.webp',
    genre: 'Thrilling',
    mood: 'Thrilling',
    contentType: 'Movie',
    duration: '3h',
    platforms: ['Prime'],
  },
  {
    movie_id: 2,
    title: 'Severance',
    description:
      'A thriller series where employees undergo a procedure to separate their work and personal memories.',
    year: 2022,
    poster: '/recommended/r2.webp',
    genre: 'Sci-Fi',
    mood: 'Mind-bending',
    contentType: 'TV Series',
    duration: '2 seasons',
    platforms: ['Apple TV+'],
    saved: true,
  },
  {
    movie_id: 3,
    title: 'Dune',
    description:
      "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset.",
    year: 2021,
    poster: '/recommended/r3.webp',
    genre: 'Thrilling',
    mood: 'Thrilling',
    contentType: 'Movie',
    duration: '3h',
    platforms: ['Disney+'],
  },
  {
    movie_id: 4,
    title: 'The Power of the Dog',
    description:
      "A domineering rancher torments his brother's new wife until unexpected connections shift everything.",
    year: 2021,
    poster: '/recommended/r4.webp',
    genre: 'Drama',
    mood: 'Feel Good',
    contentType: 'Movie',
    duration: '2h 12m',
    platforms: ['Netflix'],
  },
  {
    movie_id: 5,
    title: 'The Bear',
    description:
      'A young chef from fine dining returns home to run his family sandwich shop.',
    year: 2022,
    poster: '/recommended/r5.webp',
    genre: 'Drama',
    mood: 'Feel Good',
    contentType: 'TV Series',
    duration: '3 seasons',
    platforms: ['Crave'],
  },
  {
    movie_id: 6,
    title: 'Everything Everywhere All At Once',
    description:
      'An aging immigrant is swept into an adventure where she alone can save existence.',
    year: 2022,
    poster: '/recommended/r6.webp',
    genre: 'Adventure',
    mood: 'Mind-bending',
    contentType: 'Movie',
    duration: '2h 25m',
    platforms: ['Prime'],
    saved: true,
  },
];

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
    saved: index === 1 || index === 5,
  };
}

function MovieCard({ movie }: { movie: CardMovie }) {
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

          <button className={movie.saved ? 'home-save-btn saved' : 'home-save-btn'}>
            {movie.saved ? '▣ Saved' : '▢ Watchlist'}
          </button>
        </div>
      </div>
    </article>
  );
}

function WatchlistBox({
  title,
  count,
  progressClass,
}: {
  title: string;
  count: string;
  progressClass: string;
}) {
  return (
    <div className="home-watch-box">
      <h4>{title}</h4>
      <p>{count}</p>

      <div className="home-progress-line">
        <span className={progressClass} />
      </div>

      <div className="home-watch-row">
        <span>7 watched</span>
        <span>{progressClass.replace('progress-', '')}%</span>
      </div>

      <button>Show watchlist</button>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [recommendedMovies, setRecommendedMovies] = useState<CardMovie[]>(fallbackMovies);
  const [moreLikeThis, setMoreLikeThis] = useState<CardMovie[]>(fallbackMovies.slice(0, 3));
  const [selectedMood, setSelectedMood] = useState('');

  useEffect(() => {
    async function loadHomeMovies() {
      try {
        const params = new URLSearchParams();

        if (user?.user_id) params.set('userId', String(user.user_id));
        if (selectedMood) params.set('mood', selectedMood);

        const res = await fetch(`/api/home?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();

        const recommended = (data.recommended || []).map((movie: DbMovie, index: number) =>
          mapDbMovie(movie, `/recommended/r${(index % 8) + 1}.webp`, index)
        );

        const trending = (data.trending || []).map((movie: DbMovie, index: number) =>
          mapDbMovie(movie, `/trending/t${(index % 8) + 1}.webp`, index)
        );

        if (recommended.length) setRecommendedMovies(recommended.slice(0, 6));
        if (trending.length) setMoreLikeThis(trending.slice(0, 3));
      } catch {
        // Keep fallback content when the API is not ready.
      }
    }

    loadHomeMovies();
  }, [user?.user_id, selectedMood]);

  const filteredMovies = useMemo(() => {
    if (!selectedMood || selectedMood === 'Surprise me') return recommendedMovies;

    return recommendedMovies.filter(
      (movie) =>
        movie.mood.toLowerCase().includes(selectedMood.toLowerCase()) ||
        movie.genre.toLowerCase().includes(selectedMood.toLowerCase())
    );
  }, [recommendedMovies, selectedMood]);

  function handleRecommendationsClick() {
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
            {moodChoices.map((mood) => (
              <button
                key={mood.label}
                className={
                  selectedMood === mood.label
                    ? `home-mood-pill ${mood.tone} active`
                    : `home-mood-pill ${mood.tone}`
                }
                onClick={() => setSelectedMood(mood.label)}
              >
                <span>{mood.icon}</span>
                {mood.label} {mood.text && <b>{mood.text}</b>}
              </button>
            ))}
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
            <button>Streaming Service ˅</button>
            <button>Duration ˅</button>
            <button>Mood ˅</button>
            <button>Genre ˅</button>
          </div>
        </div>

        <div className="home-movie-grid">
          {filteredMovies.slice(0, 6).map((movie) => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>

        <div className="home-library-head">
          <div>
            <p className="home-eyebrow">Your library</p>
            <h2>My watchlists</h2>
          </div>

          <button>Manage ›</button>
        </div>

        <div className="home-watch-grid">
          <WatchlistBox title="Date Night" count="16 titles" progressClass="progress-42" />
          <WatchlistBox title="My Faves" count="16 titles" progressClass="progress-42" />
          <WatchlistBox title="Weekend Binge" count="24 titles" progressClass="progress-20" />

          <div className="home-create-list">
            <span>＋</span>
            <p>Create new list</p>
          </div>
        </div>

        <section className="home-more-section">
          <p className="home-eyebrow">More like this</p>

          <h2>
            Because you liked <span>Oppenheimer</span>
          </h2>

          <div className="home-movie-grid three">
            {moreLikeThis.map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
