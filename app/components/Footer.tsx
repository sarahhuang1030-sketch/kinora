import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <div className="logo footer-logo">
            <Link href="/" className="logo">
        <Image
          src="/CINERI-favicon.png"
          alt="CINERI"
          width={40}
          height={40}
          priority
        />
        <span>CINERI</span>
      </Link>
          </div>
          <p className="footer-tagline">
            Discover movies and TV shows tailored to your taste.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/help">Help</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="footer-copy">
          © 2026 CINERI. All rights reserved.
        </div>

      </div>
    </footer>
  );
}