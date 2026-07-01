import pool from "../../src/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import Link from "next/link";

type Movie = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
  poster_url?: string | null;
  duration_minutes?: number | null;
  duration?: string;
};

type SimilarMovie = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
  poster_url?: string | null;
  duration?: string;
  content_type?: string;
  platforms?: string;
  moods?: string;
  match_score: number;
};

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movieId = Number(id);

  if (!movieId) {
    notFound();
  }

  const [movies] = await pool.query<Movie[]>(
    `
    SELECT 
      movie_id,
      title,
      description,
      release_year,
      poster_url,
      duration_minutes,
      CONCAT(
        FLOOR(duration_minutes / 60),
        'h ',
        MOD(duration_minutes, 60),
        'm'
      ) AS duration
    FROM movies
    WHERE movie_id = ?
    `,
    [movieId]
  );

  const movie = movies[0];

  if (!movie) {
    notFound();
  }

  const [similarMovies] = await pool.query<SimilarMovie[]>(
    `
    SELECT 
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      CONCAT(
        FLOOR(m.duration_minutes / 60),
        'h ',
        MOD(m.duration_minutes, 60),
        'm'
      ) AS duration,
      ct.type_name AS content_type,
      GROUP_CONCAT(DISTINCT sp.platform_name SEPARATOR ', ') AS platforms,
      GROUP_CONCAT(DISTINCT mo.mood_name SEPARATOR ', ') AS moods,
      (
        COUNT(DISTINCT matching_genres.genre_id) * 2 +
        COUNT(DISTINCT matching_moods.mood_id)
      ) AS match_score

    FROM movies m

    LEFT JOIN content_types ct 
      ON m.content_type_id = ct.content_type_id

    LEFT JOIN movie_platforms mp 
      ON m.movie_id = mp.movie_id

    LEFT JOIN streaming_platforms sp 
      ON mp.platform_id = sp.platform_id

    LEFT JOIN movie_moods mm 
      ON m.movie_id = mm.movie_id

    LEFT JOIN moods mo 
      ON mm.mood_id = mo.mood_id

    LEFT JOIN movie_genres matching_genres
      ON m.movie_id = matching_genres.movie_id
      AND matching_genres.genre_id IN (
        SELECT genre_id FROM movie_genres WHERE movie_id = ?
      )

    LEFT JOIN movie_moods matching_moods
      ON m.movie_id = matching_moods.movie_id
      AND matching_moods.mood_id IN (
        SELECT mood_id FROM movie_moods WHERE movie_id = ?
      )

    WHERE m.movie_id != ?

    GROUP BY 
      m.movie_id,
      m.title,
      m.description,
      m.release_year,
      m.poster_url,
      m.duration_minutes,
      ct.type_name

    HAVING match_score > 0

    ORDER BY match_score DESC, m.release_year DESC

    LIMIT 6
    `,
    [movieId, movieId, movieId]
  );

  return (
    <main className="page-container">
      <div className="movie-details-card">
        {movie.poster_url && (
          <img src={movie.poster_url} alt={movie.title} />
        )}

        <h1>{movie.title}</h1>
        <p>
          {movie.release_year} · {movie.duration}
        </p>
        <p>{movie.description}</p>
      </div>

      <section className="more-like-section">
        <p className="section-label">MORE LIKE THIS</p>

        <h2>
          Because you liked <span>{movie.title}</span>
        </h2>

        <div className="similar-grid">
          {similarMovies.map((item) => (
            <div className="movie-card" key={item.movie_id}>
              <div className="movie-card-image">
                <img
                  src={item.poster_url || "/placeholder.jpg"}
                  alt={item.title}
                />

                {item.moods && (
                  <span className="movie-mood-tag">
                    {item.moods.split(", ")[0]}
                  </span>
                )}
              </div>

              <div className="movie-card-body">
                <p className="movie-meta">
                  {item.platforms?.split(", ")[0] || "Available"} ·{" "}
                  {item.content_type || "Movie"} · {item.duration || "N/A"}
                </p>

                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <Link
                  href={`/movie/${item.movie_id}`}
                  className="show-details-btn"
                >
                  ⊕ SHOW DETAILS
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}