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
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [navUser, setNavUser] = useState<NavUser | null>(null); 
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  const menuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setProfileMenuOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);


  if (status === "loading") {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchText.trim()) return;

    router.push(`/search?query=${encodeURIComponent(searchText.trim())}`);
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
        <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfXTcE0RAA0-kBj5PJXY1uzrWun-QP0wIWXPsTKQH6fj6b39g/viewform"
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
        <div className="search-wrapper">
  <form onSubmit={handleSearch} className="nav-search-form">
    <FiSearch className="search-input-icon" />

    <input
      type="text"
      placeholder="Search any title..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
  </form>

  {results.length > 0 && (
    <div className="search-dropdown">
      {results.map((movie) => (
        <Link
          key={movie.movie_id}
          href={`/movie/${movie.movie_id}`}
          className="search-result-item"
          onClick={() => {
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
           <div
  className="nav-profile-menu"
  ref={menuRef}
>
  <a
    type="button"
    className="nav-profile"
    onClick={() => setProfileMenuOpen((open) => !open)}
  >
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
  </a>

  {profileMenuOpen && (
    <div className="nav-profile-dropdown">
      <Link
        href="/profile"
        onClick={() => setProfileMenuOpen(false)}
      >
        My Profile
      </Link>

      <Link
        href="/watchlists"
        onClick={() => setProfileMenuOpen(false)}
      >
        My Watchlists
      </Link>

      <Link
        href="/profile/preferences"
        onClick={() => setProfileMenuOpen(false)}
      >
        Preferences
      </Link>

      <button
        type="button"
        onClick={async () => {
          setProfileMenuOpen(false);

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
    </div>
  )}
</div>

           
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