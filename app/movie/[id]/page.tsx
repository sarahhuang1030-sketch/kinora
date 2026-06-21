import pool from "../../src/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";

type Movie = RowDataPacket & {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
};

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [movies] = await pool.query<Movie[]>(
    `
    SELECT movie_id, title, description, release_year
    FROM movies
    WHERE movie_id = ?
    `,
    [Number(id)]
  );

  const movie = movies[0];

  if (!movie) {
    notFound();
  }

  return (
    <main className="page-container">
      <div className="movie-details-card">
        <h1>{movie.title}</h1>
        <p>{movie.release_year}</p>
        <p>{movie.description}</p>
      </div>
    </main>
  );
}