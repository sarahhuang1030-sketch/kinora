import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <Link href="/" className="logo footer-logo">
          <Image
            src="/CINERI-favicon.png"
            alt="CINERI"
            width={40}
            height={40}
          />
          <span className="logo-wordmark">CINERI</span>
        </Link>

        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/help">Help</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="footer-copy">
          © 2026 Cineri. All rights reserved.
        </div>

      </div>
    </footer>
  );
}