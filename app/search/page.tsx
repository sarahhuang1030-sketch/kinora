import pool from "../src/lib/db";
import { RowDataPacket } from "mysql2";

type Movie = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const query = searchParams.query || "";

  const [movies] = await pool.query<Movie[]>(
    `
    SELECT *
    FROM movies
    WHERE title LIKE ?
       OR description LIKE ?
    `,
    [`%${query}%`, `%${query}%`]
  );

  return (
    <main className="page-container">
      <h1>Search Results</h1>

      <p>Showing results for: {query}</p>

      {movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <div key={movie.movie_id} className="movie-card">
              <h3>{movie.title}</h3>
              <p>{movie.description}</p>
              <p>{movie.release_year}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}