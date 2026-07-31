'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Clapperboard,
  Clock3,
  CalendarDays,
  ShieldCheck,
  Bookmark,
} from "lucide-react";

type DbMovie = {
  movie_id: number;
  title: string;
  description?: string | null;
  release_year: number;
  poster_url: string | null;
  portrait_url: string | null;
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
  portrait: string;
};

type Watchlist = {
  watchlist_id: number;
  name: string;
  total_titles: number;
  movie_count: number;
  tv_count: number;
  completed_count: number;
  previews: {
    movie_id: number;
    title: string;
    portrait_url: string | null;
  }[];
};

type DbGenre = {
  genre_id: number;
  genre_name: string;
};

type DbPlatform = {
  platform_id: number;
  platform_name: string;
  logo_url: string | null;
};



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
    portrait: movie.portrait_url || movie.poster_url || fallbackPoster,
    genre: movie.genre || 'Thrilling',
    mood:
  movie.mood ||
  movie.genre ||
  [
    "Adventurous / Thrilling",
    "Mind-Bending",
    "Relaxing / Feel Good",
  ][index % 3],
    contentType: movie.content_type || 'Movie',
    duration: movie.duration || (movie.content_type === 'TV Series' ? '2 seasons' : '2h 15m'),
    platforms,
  };
}

function splitValues(value: string | null | undefined) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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
  isSaved: boolean;
}) {
  const platform = movie.platforms[0] || "Platform unavailable";
  const moods = splitValues(movie.mood);
  return (
    <article className="discover-browse-card">
      <Link
        href={`/movie/${movie.movie_id}`}
        className="discover-browse-card-image-link"
        aria-label={`View details for ${movie.title}`}
      >
        <div className="discover-browse-card-image-wrap">
          <img
            src={movie.poster}
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
              <span>{platform}</span>
              <span>•</span>
              <span>{movie.contentType}</span>
              <span>•</span>
              <span>{movie.duration}</span>
            </p>
          </div>

      <div className="discover-browse-card-moods">
  {moods.length > 0 ? (
    moods.map((mood) => (
      <span
        key={mood}
        className={`discover-browse-card-mood mood-${mood
          .toLowerCase()
          .replace(/\s*\/\s*/g, "-")
          .replace(/\s+/g, "-")}`}
      >
        {mood}
      </span>
    ))
  ) : (
    <span className="discover-browse-card-mood mood-default">
      {movie.genre || "Featured"}
    </span>
  )}
</div>
        </div>

        <p className="discover-browse-card-description">
          {movie.description}
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

function WatchlistBox({
  watchlist,
  onViewList,
}: {
  watchlist: Watchlist;
  onViewList: (watchlist: Watchlist) => void;
}) {
  const totalTitles = Number(watchlist.total_titles);
  const completedCount = Number(watchlist.completed_count);

  const progress =
    totalTitles > 0
      ? Math.round((completedCount / totalTitles) * 100)
      : 0;

  return (
    <div className="home-watch-box">
      <h4>{watchlist.name}</h4>

      <p>
        {totalTitles} {totalTitles === 1 ? "title" : "titles"}
      </p>

      <div className="home-progress-line">
        <span
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="home-watch-row">
        <span>{completedCount} watched</span>
        <span>{progress}%</span>
      </div>

      <button
        type="button"
        onClick={() => onViewList(watchlist)}
      >
        View list
      </button>
    </div>
  );
}

const moodBackgrounds: Record<
  string,
  {
    image: string;
    size: string;
    position: string;
  }
> = {
  "Thrilling": {
    image: "/backgrounds/Thrilling.png",
    size: "cover",
    position: "center right",
  },

  "Mind-Bending": {
    image: "/backgrounds/Mind-bending.png",
    size: "cover",
    position: "center right",
  },

  "Feel Good": {
    image: "/backgrounds/Feel.png",
     size: "cover",
    position: "center right",
  },

  Romantic: {
    image: "/backgrounds/Romantic.png",
     size: "cover",
    position: "center right",
  },

  Spooky: {
    image: "/backgrounds/Spooky.png",
    size: "cover",
    position: "center right",
  },
};

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

const [moodCarouselMovies, setMoodCarouselMovies] = useState<CardMovie[]>([]);
const [moodSlideIndex, setMoodSlideIndex] = useState(0);

const activeBackground = moodBackgrounds[selectedMood];

const heroBackground =
  activeBackground?.image || "/backgrounds/default.png";

const heroBackgroundSize =
  activeBackground?.size || "cover";

const heroBackgroundPosition =
  activeBackground?.position || "center right";

const [isMoodPopupOpen, setIsMoodPopupOpen] = useState(false);
const [selectedWatchlist, setSelectedWatchlist] =
  useState<Watchlist | null>(null);

  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);
const [newWatchlistName, setNewWatchlistName] = useState("");
const [creatingWatchlist, setCreatingWatchlist] = useState(false);
const [inlineWatchlistMovie, setInlineWatchlistMovie] =
  useState<CardMovie | null>(null);

async function handleCreateWatchlist() {
  const movieToSave =
    inlineWatchlistMovie || selectedMovie;

  if (
    !user?.user_id ||
    !movieToSave ||
    !newWatchlistName.trim()
  ) {
    return;
  }

  try {
    setCreatingWatchlist(true);

    // 1. Create the watchlist
    const createRes = await fetch("/api/watchlists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.user_id,
        name: newWatchlistName.trim(),
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => null);

      console.error(
        "Failed to create watchlist:",
        errorData?.error || createRes.statusText
      );

      return;
    }

    const createData = await createRes.json();

    const newWatchlistId =
      createData.watchlist_id ||
      createData.watchlistId ||
      createData.watchlist?.watchlist_id;

    if (!newWatchlistId) {
      console.error(
        "Watchlist was created but no watchlist ID was returned."
      );
      return;
    }

    // 2. Immediately add the selected movie
    const addRes = await fetch("/api/watchlist-movies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        watchlistId: newWatchlistId,
        movieId: movieToSave.movie_id,
      }),
    });

    if (!addRes.ok) {
      const errorData = await addRes.json().catch(() => null);

      console.error(
        "Watchlist created, but movie could not be added:",
        errorData?.error || addRes.statusText
      );

      return;
    }

    // 3. Refresh watchlists
    const updatedRes = await fetch(
      `/api/watchlists?userId=${user.user_id}`,
      {
        cache: "no-store",
      }
    );

    if (updatedRes.ok) {
      const updatedData = await updatedRes.json();

      setWatchlists(
        Array.isArray(updatedData.watchlists)
          ? updatedData.watchlists
          : []
      );
    }

    // 4. Mark movie saved
    setSavedMovieIds((current) =>
  current.includes(movieToSave.movie_id)
    ? current
    : [...current, movieToSave.movie_id]
);

    // 5. Reset/close
    setNewWatchlistName("");
    setIsCreatingWatchlist(false);
    setSelectedMovie(null);
    setInlineWatchlistMovie(null);
  } catch (error) {
    console.error("Error creating watchlist:", error);
  } finally {
    setCreatingWatchlist(false);
  }
}

  async function handleSaveToWatchlist(watchlistId: number) {
  if (!selectedMovie || !user?.user_id) return;

  try {
    const movieId = selectedMovie.movie_id;

    const res = await fetch("/api/watchlist-movies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        watchlistId,
        movieId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);

      console.error(
        "Failed to save movie:",
        errorData?.error || res.statusText
      );

      return;
    }

    // Only change the button after the database insert succeeds
    setSavedMovieIds((current) =>
      current.includes(movieId)
        ? current
        : [...current, movieId]
    );

    setSelectedMovie(null);

    // Reload the updated watchlist totals
   const updatedRes = await fetch(
      `/api/watchlists?userId=${user.user_id}`,
      {
        cache: "no-store",
      }
    );

    if (!updatedRes.ok) {
      console.error("Failed to refresh watchlists");
      return;
    }

   const updatedData = await updatedRes.json();

    setWatchlists(
      Array.isArray(updatedData.watchlists)
        ? updatedData.watchlists
        : []
    );
  } catch (error) {
    console.error("Error saving movie to watchlist:", error);
  }
}

async function handleRemoveFromWatchlist(
  watchlistId: number,
  movieId: number
) {
  try {
    const confirmed = window.confirm(
      "Remove this title from the watchlist?"
    );

    if (!confirmed) return;

    const res = await fetch("/api/watchlist-movies/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        watchlistId,
        movieId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);

      console.error(
        "Failed to remove movie:",
        errorData?.error || res.statusText
      );

      return;
    }

    // Update the popup immediately
    setSelectedWatchlist((current) => {
      if (!current) return null;

      const updatedPreviews = current.previews.filter(
        (movie) => movie.movie_id !== movieId
      );

      return {
        ...current,
        previews: updatedPreviews,
        total_titles: Math.max(
          0,
          Number(current.total_titles) - 1
        ),
        completed_count: Math.min(
          Number(current.completed_count),
          Math.max(0, Number(current.total_titles) - 1)
        ),
      };
    });

    // Update the watchlist cards behind the popup
    setWatchlists((current) =>
      current.map((list) => {
        if (list.watchlist_id !== watchlistId) {
          return list;
        }

        return {
          ...list,
          previews: list.previews.filter(
            (movie) => movie.movie_id !== movieId
          ),
          total_titles: Math.max(
            0,
            Number(list.total_titles) - 1
          ),
        };
      })
    );

    // Update Saved button status when the movie
    // is no longer inside any watchlist
    const refreshRes = await fetch(
      `/api/watchlists?userId=${user?.user_id}`,
      {
        cache: "no-store",
      }
    );

    if (refreshRes.ok) {
      const data = await refreshRes.json();

      const refreshedWatchlists = Array.isArray(data.watchlists)
        ? data.watchlists
        : [];

      setWatchlists(refreshedWatchlists);

      const refreshedSelected = refreshedWatchlists.find(
        (list: Watchlist) =>
          list.watchlist_id === watchlistId
      );

      if (refreshedSelected) {
        setSelectedWatchlist(refreshedSelected);
      }

      const stillSaved = refreshedWatchlists.some(
        (list: Watchlist) =>
          list.previews?.some(
            (movie) => movie.movie_id === movieId
          )
      );

      if (!stillSaved) {
        setSavedMovieIds((current) =>
          current.filter((id) => id !== movieId)
        );
      }
    }
  } catch (error) {
    console.error(
      "Error removing movie from watchlist:",
      error
    );
  }
}

function handleMoodClick(moodName: string) {
  if (moodName === "Surprise Me") {
    handleSurpriseMe();
    return;
  }

  const isDeselecting = selectedMood === moodName;
  const nextMood = isDeselecting ? "" : moodName;

  setSelectedMood(nextMood);
  setIsMoodPopupOpen(false);

  // When no mood is selected, restore the original recommendations
  if (isDeselecting) {
    setAppliedMood("");
    setMoodCarouselMovies([]);
    setMoodSlideIndex(0);
  }
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
        setMoodCarouselMovies(recommended.slice(0, 3));
        setMoodSlideIndex(0);
      } catch {
        // Keep fallback content when the API is not ready.
      }
    }

    loadHomeMovies();
  }, [user?.user_id, appliedMood, selectedPlatform, selectedDuration, selectedGenre]);

 useEffect(() => {
  async function loadWatchlists() {
    if (!user?.user_id) {
      setWatchlists([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/watchlists?userId=${user.user_id}`,
        {
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => null);

        console.error(
          'Failed to load watchlists:',
          errorData?.details ||
            errorData?.error ||
            res.statusText
        );

        setWatchlists([]);
        return;
      }

      const data = await res.json();

      setWatchlists(
        Array.isArray(data.watchlists)
          ? data.watchlists
          : []
      );
    } catch (error) {
      console.error(
        'Error loading watchlists:',
        error
      );

      setWatchlists([]);
    }
  }

  void loadWatchlists();
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

    const updated = await fetch(
  `/api/watchlists?userId=${user?.user_id}`,
  {
    cache: 'no-store',
  }
);

if (!updated.ok) {
  console.error(
    'Failed to refresh watchlists'
  );
  return;
}

const data = await updated.json();

setWatchlists(
  Array.isArray(data.watchlists)
    ? data.watchlists
    : []
);

    return;
  }

  if (watchlists.length === 0) {
  setInlineWatchlistMovie(movie);
  setNewWatchlistName("");
  return;
}

setSelectedMovie(movie);
}

  function handleRecommendationsClick() {
  if (!selectedMood) return;

  // Surprise Me movies have already been generated
  if (selectedMood === "Surprise Me") {
    setIsMoodPopupOpen(true);
    return;
  }

  setAppliedMood(selectedMood);
  setIsMoodPopupOpen(true);
}

async function handleSurpriseMe() {
  const availableMoods = moods.filter(
    (mood) => mood.mood_name !== "Surprise Me"
  );

  if (availableMoods.length < 3 || genres.length < 3) {
    return;
  }

  // Shuffle moods
  const shuffledMoods = [...availableMoods].sort(
    () => Math.random() - 0.5
  );

  // Shuffle genres
  const shuffledGenres = [...genres].sort(
    () => Math.random() - 0.5
  );

  // Create 3 different mood + genre combinations
  const surpriseChoices = [0, 1, 2].map((index) => ({
    mood: shuffledMoods[index].mood_name,
    genre: shuffledGenres[index].genre_name,
  }));

  try {
    const surpriseMovies: CardMovie[] = [];

    for (let index = 0; index < surpriseChoices.length; index++) {
      const { mood, genre } = surpriseChoices[index];

      const params = new URLSearchParams();

      if (user?.user_id) {
        params.set("userId", String(user.user_id));
      }

      params.set("mood", mood);
      params.set("genre", genre);

      const res = await fetch(
        `/api/home?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        continue;
      }

      const data = await res.json();

      const movies = (data.recommended || []).map(
        (movie: DbMovie, movieIndex: number) =>
          mapDbMovie(
            movie,
            `/recommended/r${((index + movieIndex) % 8) + 1}.webp`,
            movieIndex
          )
      );

      // Find a movie that has NOT already been selected
      const uniqueMovie = movies.find(
        (movie: CardMovie) =>
          !surpriseMovies.some(
            (selected) =>
              selected.movie_id === movie.movie_id
          )
      );

      if (uniqueMovie) {
        surpriseMovies.push(uniqueMovie);
      }
    }

    if (surpriseMovies.length === 0) {
      return;
    }

    setSelectedMood("Surprise Me");
    setAppliedMood("");
    setMoodCarouselMovies(surpriseMovies);
    setMoodSlideIndex(0);

    // Don't open until user clicks Show my recommendations
    setIsMoodPopupOpen(false);
  } catch (error) {
    console.error(
      "Failed to load surprise recommendations:",
      error
    );
  }
}

const currentMood = moods.find(
  (mood) => mood.mood_name === appliedMood
);

const displayedMovie = moodCarouselMovies[moodSlideIndex];

const displayedMood = moods.find(
  (mood) =>
    splitValues(displayedMovie?.mood).includes(
      mood.mood_name
    )
);


  return (
    <main className="home-page">
     <section
  className="home-mood-hero"
  style={{
    backgroundImage: `
      linear-gradient(
        90deg,
        rgba(4, 15, 30, 0.98) 0%,
        rgba(4, 15, 30, 0.9) 34%,
        rgba(4, 15, 30, 0.42) 62%,
        rgba(4, 15, 30, 0.08) 100%
      ),
      url("${heroBackground}")
    `,
    backgroundSize: heroBackgroundSize,
    backgroundPosition: heroBackgroundPosition,
    backgroundRepeat: "no-repeat",
  }}
>
     {/* carousel for mood-based recommendations */}
    {isMoodPopupOpen && moodCarouselMovies.length > 0 && (
  <div className="home-mood-overlay">
    {/* <button
  className="home-mood-overlay-close"
  onClick={() => setIsMoodPopupOpen(false)}
>
  ×
</button> */}

    <p className="home-overlay-title">
      Based on your <span>Mood</span>
    </p>

    <div className="home-overlay-carousel">

       <button
  className="home-mood-overlay-close"
  onClick={() => setIsMoodPopupOpen(false)}
>
  ×
</button>
      <button
        className="home-carousel-arrow left"
        onClick={() =>
          setMoodSlideIndex((current) =>
            current === 0 ? moodCarouselMovies.length - 1 : current - 1
          )
        }
      >
        ‹
      </button>

      <div className="home-overlay-card">
  {/* LEFT: portrait poster */}
  <div className="home-overlay-poster">
    <img
      src={moodCarouselMovies[moodSlideIndex].portrait}
      alt={moodCarouselMovies[moodSlideIndex].title}
    />
  </div>

  {/* RIGHT: movie information */}
  <div className="home-overlay-info">
    <span
  className={`home-overlay-mood-pill mood-${(
    displayedMood?.mood_name || ""
  )
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-")}`}
>
      {displayedMood?.icon_url && (
  <span
    className="home-overlay-pill-icon"
    style={{
      WebkitMaskImage: `url("${displayedMood.icon_url}")`,
      maskImage: `url("${displayedMood.icon_url}")`,
    }}
  />
)}

      <span>
        {displayedMood?.mood_name ||
          moodCarouselMovies[moodSlideIndex].mood}
      </span>
    </span>

    <h2>
      {moodCarouselMovies[moodSlideIndex].title}
    </h2>

    <div className="home-overlay-meta">
      <span>
        <Clapperboard size={16} />
        {moodCarouselMovies[moodSlideIndex].genre}
      </span>

      <span>
        <Clock3 size={16} />
        {moodCarouselMovies[moodSlideIndex].duration}
      </span>

      <span>
        <CalendarDays size={16} />
        {moodCarouselMovies[moodSlideIndex].year}
      </span>

      <span>
        <ShieldCheck size={16} />
        PG-rated
      </span>
    </div>

    <div className="home-overlay-section">
      <p className="home-overlay-label">ABOUT</p>

      <p className="home-overlay-desc">
        {moodCarouselMovies[moodSlideIndex].description}
      </p>
    </div>

    <div className="home-overlay-section">
      <p className="home-overlay-label">AVAILABLE ON</p>

      <div className="home-overlay-platforms">
  {moodCarouselMovies[moodSlideIndex].platforms.map(
    (platformName) => {
      const normalizedMoviePlatform = platformName
        .toLowerCase()
        .replace("prime video", "prime")
        .replace("disney plus", "disney+")
        .trim();

      const platformInfo = platforms.find((platform) => {
        const normalizedDbPlatform = platform.platform_name
          .toLowerCase()
          .replace("prime video", "prime")
          .replace("disney plus", "disney+")
          .trim();

        return normalizedDbPlatform === normalizedMoviePlatform;
      });

      return (
        <span
          key={platformName}
          className="home-overlay-platform"
        >
          {platformInfo?.logo_url && (
            <img
              src={platformInfo.logo_url}
              alt=""
              className="home-overlay-platform-logo"
            />
          )}

          <span className="home-overlay-platform-name">
            {platformName}
          </span>
        </span>
      );
    }
  )}
</div>
    </div>

    <div className="home-overlay-actions">
      {user?.user_id && (
  inlineWatchlistMovie?.movie_id ===
    moodCarouselMovies[moodSlideIndex].movie_id ? (
    
    <div className="home-inline-watchlist-create">
      <input
        type="text"
        placeholder="Watchlist name..."
        value={newWatchlistName}
        onChange={(e) =>
          setNewWatchlistName(e.target.value)
        }
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            newWatchlistName.trim() &&
            !creatingWatchlist
          ) {
            handleCreateWatchlist();
          }

          if (e.key === "Escape") {
            setInlineWatchlistMovie(null);
            setNewWatchlistName("");
          }
        }}
        autoFocus
      />

      <button
        type="button"
        className="home-inline-watchlist-add"
        disabled={
          !newWatchlistName.trim() ||
          creatingWatchlist
        }
        onClick={handleCreateWatchlist}
      >
        {creatingWatchlist ? "..." : "+"}
      </button>
    </div>

  ) : (
    <button
      type="button"
      className={
        savedMovieIds.includes(
          moodCarouselMovies[moodSlideIndex].movie_id
        )
          ? "home-save-btn saved"
          : "home-save-btn"
      }
      onClick={() =>
        handleToggleSaved(
          moodCarouselMovies[moodSlideIndex]
        )
      }
    >
      <Bookmark size={17} />

      {savedMovieIds.includes(
        moodCarouselMovies[moodSlideIndex].movie_id
      )
        ? "SAVED"
        : "ADD TO WATCHLIST"}
    </button>
  )
)}

      <Link
        href={`/movie/${
          moodCarouselMovies[moodSlideIndex].movie_id
        }`}
        className="home-show-btn"
      >
        SHOW DETAILS
      </Link>
    </div>
  </div>
</div>

      <button
        className="home-carousel-arrow right"
        onClick={() =>
          setMoodSlideIndex((current) =>
            current === moodCarouselMovies.length - 1 ? 0 : current + 1
          )
        }
      >
        ›
      </button>
    </div>

    <div className="home-carousel-dots">
      {moodCarouselMovies.map((movie, index) => (
        <button
          key={movie.movie_id}
          className={index === moodSlideIndex ? "active" : ""}
          onClick={() => setMoodSlideIndex(index)}
        />
      ))}
    </div>
  </div>
)}

     {/* background */}
        <div className="home-hero-content">
          <p className="home-eyebrow">Mood-based discovery</p>

          <h1>
            Find what you Love.
            <br />
            <span>Choose how you Feel</span>
          </h1>

          <h2>What kind of mood are you into tonight?</h2>
            <p className="home-tiny-note">
              Select at least one mood to get personalized picks
            </p>

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

            {/* <button className="home-mood-pill surprise" onClick={handleSurpriseMe}>
              <span>✨</span>
              Surprise Me
            </button> */}
          </div>

          

          <button className="home-recommend-btn" onClick={handleRecommendationsClick}>
            Show my recommendations
          </button>
        </div>

        {/* <button className="home-explore-btn" onClick={handleRecommendationsClick}>
          Explore all ˅
        </button> */}
      </section>



      <section className="home-content-wrap" id="recommended-section">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">Personalized recommendations</p>
            <h2 className="dongle-font" style={{ fontSize: "54px", marginBottom: "-18px" }}>
              Recommended for you
            </h2>
            <p>Based on your preferences, watch history and streaming subscriptions</p>
          </div>

          <div className="home-filters">
  {/* <select
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

        <select
  value={appliedMood}
  onChange={(e) => setAppliedMood(e.target.value)}
>
  <option value="">Mood</option>

  {moods
    .filter((mood) => mood.mood_name !== "Surprise Me")
    .map((mood) => (
      <option
        key={mood.mood_id}
        value={mood.mood_name}
      >
        {mood.mood_name}
      </option>
    ))}
</select> */}


<label className="home-filter-select">
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
</label>

<label className="home-filter-select">
  <select
    value={selectedDuration}
    onChange={(e) => setSelectedDuration(e.target.value)}
  >
        <option value="">Duration</option>
    <option value="short">Under 90 min</option>
    <option value="medium">90–120 min</option>
    <option value="long">Over 120 min</option>
  </select>
</label>

<label className="home-filter-select">
  <select
    value={appliedMood}
    onChange={(e) => setAppliedMood(e.target.value)}
  >
        <option value="">Mood</option>
     {moods
    .filter((mood) => mood.mood_name !== "Surprise Me")
    .map((mood) => (
      <option
        key={mood.mood_id}
        value={mood.mood_name}
      >
        {mood.mood_name}
      </option>
    ))}
  </select>
</label>

        </div>
        </div>

        <div className="discover-browse-grid">
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
            <h2 className="dongle-font" style={{ fontSize: "54px", marginBottom: "-18px" }}>My Watchlists</h2>
          </div>

          {/* <button>Manage ›</button> */}
        </div>

        <div className="home-watch-grid">
  {!user?.user_id ? (
    // NOT LOGGED IN
    <div className="home-watch-empty">
      <div>
        <h3>Sign in to create your watchlists</h3>
        <p>
          Save movies into lists like Date Night, My Faves, and Weekend Binge.
        </p>
      </div>

      <Link href="/login" className="home-watch-login-btn">
        Login
      </Link>
    </div>
  ) : watchlists.length === 0 ? (
    // LOGGED IN, BUT NO WATCHLISTS
    <div className="home-watch-empty">
      <div>
        <h3>Create your first watchlist</h3>
        <p>
          Save movies into lists like Date Night, My Faves, and Weekend Binge.
        </p>
      </div>

      <Link href="/watchlists" className="home-watch-login-btn">
        Create watchlist
      </Link>
    </div>
  ) : (
    // LOGGED IN AND HAS WATCHLISTS
    <>
      {watchlists.map((list) => (
        <WatchlistBox
          key={list.watchlist_id}
          watchlist={list}
          onViewList={setSelectedWatchlist}
        />
      ))}

      <Link href="/watchlists" className="home-create-list">
        <span>＋</span>
        <p>Create new list</p>
      </Link>
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

        {/* <section className="home-more-section">
  <p className="home-eyebrow">More to explore</p>

   <h2 className="dongle-font" style={{ fontSize: "54px", marginBottom: "-18px" }}>
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
</section> */}

      </section>
{selectedMovie && (
  <div className="watchlist-modal-backdrop">
    <div className="watchlist-modal">
      <button
        className="watchlist-modal-close"
        onClick={() => {
          setSelectedMovie(null);
          setIsCreatingWatchlist(false);
          setNewWatchlistName("");
        }}
      >
        ×
      </button>

     <h3>
  {watchlists.length === 0
    ? "Create your first watchlist"
    : "Add to watchlist"}
</h3>

<p>
  {watchlists.length === 0
    ? `Create a list and we'll add ${selectedMovie.title} to it.`
    : selectedMovie.title}
</p>

      {watchlists.length === 0 ? (
  // USER HAS NO WATCHLISTS YET
  <div className="watchlist-create-inline">
    <input
      type="text"
      placeholder="Enter your first watchlist name..."
      value={newWatchlistName}
      onChange={(e) =>
        setNewWatchlistName(e.target.value)
      }
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          newWatchlistName.trim() &&
          !creatingWatchlist
        ) {
          handleCreateWatchlist();
        }
      }}
      autoFocus
    />

    <button
      type="button"
      className="watchlist-create-confirm full"
      disabled={
        !newWatchlistName.trim() ||
        creatingWatchlist
      }
      onClick={handleCreateWatchlist}
    >
      {creatingWatchlist
        ? "Creating..."
        : "Create & Add"}
    </button>
  </div>
) : (
  // USER ALREADY HAS WATCHLISTS
  <>
    <div className="watchlist-modal-options">
      {watchlists.map((list) => (
        <button
          key={list.watchlist_id}
          className="watchlist-choice-btn"
          onClick={() =>
            handleSaveToWatchlist(list.watchlist_id)
          }
        >
          {list.name}
        </button>
      ))}
    </div>

    {!isCreatingWatchlist ? (
      <button
        type="button"
        className="watchlist-create-inline-btn"
        onClick={() =>
          setIsCreatingWatchlist(true)
        }
      >
        <span>＋</span>
        Create new watchlist
      </button>
    ) : (
      <div className="watchlist-create-inline">
        <input
          type="text"
          placeholder="Watchlist name"
          value={newWatchlistName}
          onChange={(e) =>
            setNewWatchlistName(e.target.value)
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              newWatchlistName.trim() &&
              !creatingWatchlist
            ) {
              handleCreateWatchlist();
            }
          }}
          autoFocus
        />

        <div className="watchlist-create-inline-actions">
          <button
            type="button"
            className="watchlist-create-cancel"
            onClick={() => {
              setIsCreatingWatchlist(false);
              setNewWatchlistName("");
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="watchlist-create-confirm"
            disabled={
              !newWatchlistName.trim() ||
              creatingWatchlist
            }
            onClick={handleCreateWatchlist}
          >
            {creatingWatchlist
              ? "Creating..."
              : "Create & Add"}
          </button>
        </div>
      </div>
    )}
  </>
)}
    </div>
  </div>
)}

{selectedWatchlist && (
  <div
    className="watchlist-view-backdrop"
    onClick={() => setSelectedWatchlist(null)}
  >
    <div
      className="watchlist-view-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watchlist-view-title"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="watchlist-view-close"
        aria-label="Close watchlist"
        onClick={() => setSelectedWatchlist(null)}
      >
        ×
      </button>

      <div className="watchlist-view-heading">
        <div>
          <p className="home-eyebrow">Your watchlist</p>

          <h2 id="watchlist-view-title">
            {selectedWatchlist.name}
          </h2>

          <p>
            {Number(selectedWatchlist.total_titles)}{" "}
            {Number(selectedWatchlist.total_titles) === 1
              ? "title"
              : "titles"}
          </p>
        </div>

        {/* <Link
          href={`/watchlists/${selectedWatchlist.watchlist_id}`}
          className="watchlist-view-full-link"
        >
          Open full list
        </Link> */}
      </div>

      {selectedWatchlist.previews?.length > 0 ? (
        <div className="watchlist-view-movies">
  {selectedWatchlist.previews.map((movie) => (
    <article
      key={movie.movie_id}
      className="watchlist-view-movie"
    >
      <Link
        href={`/movie/${movie.movie_id}`}
        className="watchlist-view-movie-main"
        onClick={() => setSelectedWatchlist(null)}
      >
        <div className="watchlist-view-poster">
          <img
            src={
              movie.portrait_url ||
              "/placeholder.jpg"
            }
            alt={`${movie.title} poster`}
          />
        </div>

        <div className="watchlist-view-movie-info">
          <h3>{movie.title}</h3>
          <span>View movie details ›</span>
        </div>
      </Link>

      <button
        type="button"
        className="watchlist-view-remove"
        aria-label={`Remove ${movie.title} from ${selectedWatchlist.name}`}
        onClick={() =>
          handleRemoveFromWatchlist(
            selectedWatchlist.watchlist_id,
            movie.movie_id
          )
        }
      >
        Remove
      </button>
    </article>
  ))}
</div>
      ) : (
        <div className="watchlist-view-empty">
          <span>＋</span>
          <h3>This list is empty</h3>
          <p>
            Add movies or shows to start building this
            watchlist.
          </p>

          <Link
            href="/discover"
            onClick={() => setSelectedWatchlist(null)}
          >
            Browse movies
          </Link>
        </div>
      )}
    </div>
  </div>
)}

    </main>
  );
}