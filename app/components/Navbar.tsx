"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Movie = {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
};

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Movie[]>([]);

 useEffect(() => {
  const query = searchText.trim();

  const timer = setTimeout(async () => {
    if (!query) {
      setResults([]);
      return;
    }

    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data: Movie[] = await res.json();

    setResults(data);
  }, 300);

  return () => clearTimeout(timer);
}, [searchText]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchText.trim()) return;

    router.push(`/search?query=${encodeURIComponent(searchText.trim())}`);
    setShowSearch(false);
    setSearchText("");
    setResults([]);
  };

  return (
    <nav>
      <div className="logo">
        <Link href="/" className="logo">
          <Image
            src="/CINERI-favicon.png"
            alt="CINEforge"
            width={40}
            height={40}
            priority
          />
          <span>CINERI</span>
        </Link>
      </div>

      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/for-you">For you</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/trending">Trending</Link>
        <Link href="/my-list">My List</Link>
        <Link href="https://forms.gle/t2sZWzapbnGrMyKq7"
              target="_blank"
              rel="noopener noreferrer"
              onClick={async () => {
                try {
                  await fetch("/api/feedback-click", {
                    method: "POST",
                  });
                } catch (error) {
                  console.error("Feedback tracking failed", error);
                }
              }}
            >
              User Feedback
            </Link>
      </div>

      <div className="nav-right">
        <div className="search-wrapper">
          {showSearch && (
            <form onSubmit={handleSearch} className="nav-search-form">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                autoFocus
              />
            </form>
          )}

          <button
            type="button"
            className="nav-icon-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            ⌕
          </button>

          {results.length > 0 && (
            <div className="search-dropdown">
              {results.map((movie) => (
                <Link
                  key={movie.movie_id}
                  href={`/movie/${movie.movie_id}`}
                  className="search-result-item"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchText("");
                    setResults([]);
                  }}
                >
                  <strong>{movie.title}</strong>
                  <span>{movie.release_year}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <button className="nav-icon-btn">🔔</button>

        {session ? (
          <>
            <Link href="/profile" className="login-btn">
              My Profile
            </Link>

            <button
              className="login-btn"
              onClick={async () => {
                try {
                  await fetch("/api/logout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email: session?.user?.email,
                    }),
                  });
                } catch (error) {
                  console.error("Logout tracking failed", error);
                }

                signOut({ callbackUrl: "/" });
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/register" className="login-btn">
              Register
            </Link>
            <Link href="/login" className="login-btn">
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}