import Link from "next/link";

export default function Navbar() {
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
        <Link href="/register">Register</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}