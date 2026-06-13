"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav>
      <div className="logo">
        CINE<span>forge</span>
      </div>

      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/for-you">For you</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/trending">Trending</Link>
        <Link href="/my-list">My List</Link>
      </div>

      <div className="nav-right">
        <button className="nav-icon-btn">⌕</button>
        <button className="nav-icon-btn">🔔</button>

        {session ? (
          <>
            <Link href="/profile" className="login-btn">My Profile</Link>

            <a
              className="login-btn"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </a>
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