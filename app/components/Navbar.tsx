"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FiSearch } from "react-icons/fi";

type Movie = {
  movie_id: number;
  title: string;
  description: string;
  release_year: number;
};

type NavUser = {
  first_name: string;
  last_name: string;
  profile_image?: string;
};



export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [navUser, setNavUser] = useState<NavUser | null>(null);

  const searchRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (
          searchRef.current &&
          !searchRef.current.contains(e.target as Node)
        ) {
          setShowSearch(false);
          setSearchText("");
          setResults([]);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

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

  useEffect(() => {
    async function loadNavUser() {
      if (!session?.user?.email) return;

      const res = await fetch(`/api/profile?email=${session.user.email}`);
      const data = await res.json();

      setNavUser(data.user);
    }

    loadNavUser();
  }, [session?.user?.email]);

  if (status === "loading") {
    return null;
  }

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
      <Link href="/" className="logo">
  <Image
  src="/CINERI-favicon.png"
  alt="CINERI"
  width={44}
  height={44}
  priority
  className="logo-icon"
/>
<span className="logo-wordmark">CINERI</span>
</Link>

      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/about">About</Link>
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

      <div className="nav-links">
        <div className="search-wrapper" ref={searchRef}>
          {showSearch && (
           <form onSubmit={handleSearch} className="nav-search-form">
            <FiSearch className="search-input-icon" />

            <input
              type="text"
              placeholder="Search any title, genre, or mood..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoFocus
            />
          </form>
          )}

          <button
            type="button"
            className="nav-icon-btn"
            onClick={() => {
              if (showSearch) {
                setShowSearch(false);
                setSearchText("");
                setResults([]);
              } else {
                setShowSearch(true);
              }
            }}
          >
            <FiSearch />
          </button>

          {showSearch && results.length > 0 && (
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

        {/* <button className="nav-icon-btn">🔔</button> */}

        {session ? (
          <>
            <Link href="/profile" className="nav-profile">
                {navUser?.profile_image || session?.user?.image ? (
                  <Image
                    src={navUser?.profile_image || session?.user?.image || ""}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="nav-profile-img"
                  />
                ) : (
                  <span className="nav-profile-initials">
                    {navUser?.first_name?.charAt(0)}
                    {navUser?.last_name?.charAt(0)}
                  </span>
                )}
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
            <Link href="/register" className="register-btn">
              Join
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