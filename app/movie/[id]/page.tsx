import pool from "../../src/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import Link from "next/link";
import MovieInteractionPanel from "./MovieInteractionPanel";

type Movie = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
  poster_url?: string | null;
  trailer_url?: string | null;
  duration?: string | null;
  content_type?: string | null;
  genres?: string | null;
  moods?: string | null;
  platforms?: string | null;
  source?: string | null;
  author?: string | null;
  performers?: string | null;
  broadcaster?: string | null;
};

type SimilarMovie = RowDataPacket & {
  movie_id: number;
  title: string;
  poster_url?: string | null;
  duration?: string | null;
  platforms?: string | null;
  match_score: number;
};

function getTrailerEmbedUrl(url?: string | null) {
  if (!url) return null;

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  }

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  return url;
}

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movieId = Number(id);

  if (!movieId || Number.isNaN(movieId)) {
    notFound();
  }

  const [movies] = await pool.query<Movie[]>(
    `
      SELECT
        m.movie_id,
        m.title,
        m.description,
        m.release_year,
        m.poster_url,
        m.trailer_url,
        m.source,
        m.author,
        m.performers,
        m.broadcaster,
        ct.type_name AS content_type,

        CASE
          WHEN m.duration_minutes IS NULL THEN NULL
          ELSE CONCAT(
            FLOOR(m.duration_minutes / 60),
            'h ',
            MOD(m.duration_minutes, 60),
            'm'
          )
        END AS duration,

        GROUP_CONCAT(
          DISTINCT g.genre_name
          ORDER BY g.genre_name
          SEPARATOR ', '
        ) AS genres,

        GROUP_CONCAT(
          DISTINCT mo.mood_name
          ORDER BY mo.mood_name
          SEPARATOR ', '
        ) AS moods,

        GROUP_CONCAT(
          DISTINCT sp.platform_name
          ORDER BY sp.platform_name
          SEPARATOR ', '
        ) AS platforms

      FROM movies m

      LEFT JOIN content_types ct
        ON m.content_type_id = ct.content_type_id

      LEFT JOIN movie_genres mg
        ON m.movie_id = mg.movie_id

      LEFT JOIN genres g
        ON mg.genre_id = g.genre_id

      LEFT JOIN movie_moods mm
        ON m.movie_id = mm.movie_id

      LEFT JOIN moods mo
        ON mm.mood_id = mo.mood_id

      LEFT JOIN movie_platforms mp
        ON m.movie_id = mp.movie_id

      LEFT JOIN streaming_platforms sp
        ON mp.platform_id = sp.platform_id

      WHERE m.movie_id = ?

      GROUP BY
        m.movie_id,
        m.title,
        m.description,
        m.release_year,
        m.poster_url,
        m.trailer_url,
        m.source,
        m.author,
        m.performers,
        m.broadcaster,
        m.duration_minutes,
        ct.type_name
    `,
    [movieId]
  );

  const movie = movies[0];

  if (!movie) {
    notFound();
  }

  const trailerEmbedUrl = getTrailerEmbedUrl(movie.trailer_url);

  const [similarMovies] = await pool.query<SimilarMovie[]>(
    `
      SELECT
        m.movie_id,
        m.title,
        m.poster_url,

        CASE
          WHEN m.duration_minutes IS NULL THEN NULL
          ELSE CONCAT(
            FLOOR(m.duration_minutes / 60),
            'h ',
            MOD(m.duration_minutes, 60),
            'm'
          )
        END AS duration,

        GROUP_CONCAT(
          DISTINCT sp.platform_name
          ORDER BY sp.platform_name
          SEPARATOR ', '
        ) AS platforms,

        (
          COUNT(DISTINCT matching_genres.genre_id) * 2 +
          COUNT(DISTINCT matching_moods.mood_id)
        ) AS match_score

      FROM movies m

      LEFT JOIN movie_platforms mp
        ON m.movie_id = mp.movie_id

      LEFT JOIN streaming_platforms sp
        ON mp.platform_id = sp.platform_id

      LEFT JOIN movie_genres matching_genres
        ON m.movie_id = matching_genres.movie_id
        AND matching_genres.genre_id IN (
          SELECT genre_id
          FROM movie_genres
          WHERE movie_id = ?
        )

      LEFT JOIN movie_moods matching_moods
        ON m.movie_id = matching_moods.movie_id
        AND matching_moods.mood_id IN (
          SELECT mood_id
          FROM movie_moods
          WHERE movie_id = ?
        )

      WHERE m.movie_id != ?

      GROUP BY
        m.movie_id,
        m.title,
        m.poster_url,
        m.duration_minutes

      HAVING match_score > 0

      ORDER BY
        match_score DESC,
        m.title ASC

      LIMIT 6
    `,
    [movieId, movieId, movieId]
  );

  const trailerVideoId = trailerEmbedUrl
    ?.split("/")
    .pop()
    ?.split("?")[0];

  return (
    <main className="movie-detail-page">
      <section className="streaming-hero-detail">
        {trailerEmbedUrl ? (
          <div className="hero-trailer-bg">
            <iframe
              src={`${trailerEmbedUrl}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerVideoId}`}
              title={`${movie.title} background trailer`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            className="hero-poster-bg"
            style={{
              backgroundImage: movie.poster_url
                ? `url("${movie.poster_url}")`
                : `url("/placeholder.jpg")`,
            }}
          />
        )}

        <div className="hero-detail-overlay" />

        <div className="streaming-hero-content">
          <h1>{movie.title}</h1>

          <div className="streaming-hero-bottom">
            <div className="streaming-main-info">
              <p className="movie-detail-description">
                {movie.description}
              </p>

              <p className="streaming-meta">
                <span>{movie.genres || "Genre unavailable"}</span>
                <span>•</span>
                <span>{movie.moods || "Mood unavailable"}</span>
                <span>•</span>
                <span>{movie.release_year}</span>
                <span>•</span>
                <span>{movie.duration || "N/A"}</span>
              </p>
            </div>

            <div className="streaming-side-info">
              <p>
                <span>Cast:</span>{" "}
                {movie.performers || "Not available"}
              </p>

              <p>
                <span>Director:</span>{" "}
                {movie.author || "Not available"}
              </p>

              <p>
                <span>Available On:</span>{" "}
                {movie.platforms ||
                  movie.broadcaster ||
                  "Not available"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MovieInteractionPanel
        movieId={movie.movie_id}
        movieTitle={movie.title}
        director={movie.author}
        production={movie.source}
        performers={movie.performers}
        platforms={movie.platforms}
        broadcaster={movie.broadcaster}
        genres={movie.genres}
        moods={movie.moods}
      />

      <section className="more-like-section">
        <p className="section-label">MORE LIKE THIS</p>

        <h2>
          Because you choose <span>{movie.title}</span>
        </h2>

        {similarMovies.length > 0 ? (
          <div className="similar-grid-disney">
            {similarMovies.map((item) => (
              <Link
                href={`/movie/${item.movie_id}`}
                key={item.movie_id}
                className="similar-card-disney"
              >
                <img
                  src={item.poster_url || "/placeholder.jpg"}
                  alt={item.title}
                />

                <div className="similar-card-overlay">
                  <h3>{item.title}</h3>

                  <p>
                    {item.platforms?.split(", ")[0] || "Available"}{" "}
                    • {item.duration || "N/A"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="movie-empty-state">
            No similar movies were found.
          </p>
        )}
      </section>
    </main>
  );
}