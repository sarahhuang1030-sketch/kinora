const sections = [
  "Acceptance of Terms",
  "User Accounts",
  "Permitted Use",
  "Prohibited Activities",
  "Content Availability",
  "Limitation of Liability",
  "Changes to Terms",
];

export default function TermsPage() {
  return (
    <div className="terms-page">
      <section className="terms-hero">
        <p className="terms-eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p>Last Updated: June 2026</p>
      </section>

      <section className="terms-layout">
        <aside className="terms-sidebar">
          <h3>Contents</h3>
          {sections.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>
              {item}
            </a>
          ))}
        </aside>

        <article className="terms-content">
          <section id="acceptance-of-terms">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using CINERI, you agree to comply with these
              Terms of Service.
            </p>
          </section>

          <section id="user-accounts">
            <h2>User Accounts</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their
              account credentials and for all activity under their account.
            </p>
          </section>

          <section id="permitted-use">
            <h2>Permitted Use</h2>
            <ul>
              <li>Use the platform for personal, non-commercial purposes.</li>
              <li>Provide accurate account information.</li>
              <li>Respect applicable laws and regulations.</li>
            </ul>
          </section>

          <section id="prohibited-activities">
            <h2>Prohibited Activities</h2>
            <ul>
              <li>Attempting to gain unauthorized access.</li>
              <li>Disrupting platform operations.</li>
              <li>Submitting false or misleading information.</li>
            </ul>
          </section>

          <section id="content-availability">
            <h2>Content Availability</h2>
            <p>
              Movie and TV show availability on streaming services may change
              without notice. CINERI cannot guarantee the accuracy of third-party
              content listings.
            </p>
          </section>

          <section id="limitation-of-liability">
            <h2>Limitation of Liability</h2>
            <p>
              The platform is provided “as is” without warranties of any kind.
            </p>
          </section>

          <section id="changes-to-terms">
            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Continued
              use of CINERI means you accept the updated terms.
            </p>
          </section>
        </article>
      </section>
    </div>
  );
}