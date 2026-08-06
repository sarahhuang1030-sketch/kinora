import HelpArticleSidebar from "../components/HelpArticleSidebar";

const collectedInformation = [
  {
    title: "Account Information",
    text: "Email address, your name, date of birth, country and language, and your previous SSO tokens if you sign in via Google or Apple.",
  },
  {
    title: "Watching Preferences",
    text: "Your favourite genres, content type, and priority factors you specify during onboarding and in Account Preferences.",
  },
  {
    title: "Ratings & Reviews",
    text: "The ratings and reviews you leave on the content available in Cineri.",
  },
  {
    title: "Support Communication",
    text: "The content of support tickets and other enquiries you initiate with support team.",
  },
];

const collects = [
  {
    title: "Usage Data",
    text: "All your activity, moods you select, titles you save, mark watched, and time spent on each section of the platform.",
  },
  {
    title: "Device & Technical Data",
    text: "Browser type you use, operating system, IP address used for region detection only, and session identifiers.",
  },
  {
    title: "Platform Tokens",
    text: "Encrypted read-only OAuth tokens from streaming services you connect, retained encrypted at rest and used solely to confirm account status.",
  },
];

const doesNotCollect = [
  {
    title: "Your Streaming account details",
    text: "Your account passwords, subscription status, payment and billing history on any connected streaming platform.",
  },
  {
    title: "Location & Biometric Data",
    text: "Your precise GPS location or real-time location history. Fingerprints, facial recognition, or other biometric identifiers.",
  },
  {
    title: "Data from other Websites",
    text: "Your browsing behaviour or user-generated web browsing activity outside Cineri. Cineri also does not use cookies to track your activity across other websites.",
  },
];

const useRows = [
  {
    purpose: "Personalized recommendations",
    dataUsed: "Taste profile, usage data, platform tokens",
  },
  {
    purpose: "Operating & improving the service",
    dataUsed: "Usage data, technical data",
  },
  {
    purpose: "Account management & authentication",
    dataUsed: "Account information",
  },
  {
    purpose: "Customer support",
    dataUsed: "Account info, support communications",
  },
  {
    purpose: "Marketing emails (opt in only)",
    dataUsed: "Email address",
  },
  {
    purpose: "Fraud prevention & security",
    dataUsed: "Technical data, usage data",
  },
  {
    purpose: "Legal compliance",
    dataUsed: "As required by applicable law",
  },
];

const sharingItems = [
  {
    title: "Service providers",
    text: "We use trusted third-party processors for cloud infrastructure, email delivery, and analytics. These processors act on our instruction only and are contractually prohibited from using your data for their own purposes.",
  },
  {
    title: "Streaming platforms",
    text: "When you connect a service, Cineri presents your OAuth token to that platform to verify your subscription status. We share no other personal data with streaming platforms and receive no profile data from them in return.",
  },
  {
    title: "Community features",
    text: "All Cineri accounts are public. Your display name and content reviews are visible to other Cineri users. A watchlist becomes visible to others only when you choose to share it. You decide which watchlists to share, and you can stop sharing them at any time. Only the watchlists you explicitly share can be viewed by other users.",
  },
  {
    title: "Legal requirements",
    text: "We may disclose information when required by law, court order, or if we believe in good faith that disclosure is necessary to protect our rights or the safety of others.",
  },
  {
    title: "Business transfers",
    text: "In the event of a merger or acquisition, user data may transfer to the acquiring entity. We will notify affected users before any such transfer.",
  },
];

const retentionRows = [
  {
    category: "Account information",
    period: "Until account deletion",
    notes: "Deleted immediately on request",
  },
  {
    category: "Taste profile & preferences",
    period: "Until deletion or manual reset",
    notes: "Reset in Account → Preferences",
  },
  {
    category: "Watch history & mood logs",
    period: "Until deletion or manual clear",
    notes: "Clear in Account → Privacy",
  },
  {
    category: "Platform OAuth tokens",
    period: "Until disconnect or deletion",
    notes: "Immediately deleted on disconnect",
  },
  {
    category: "Support communications",
    period: "30 months from last interaction",
    notes: "Used for QA and dispute resolution",
  },
  {
    category: "Server logs (technical)",
    period: "90 days",
    notes: "IP addresses anonymized after 30 days",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="help-article-page">
      <div className="help-article-layout">
        <HelpArticleSidebar activeTopic="privacy-policy" />

        <main className="help-article-content">
          <header className="help-article-header help-privacy-header">
            <h1>Privacy Policy</h1>

            <div className="help-privacy-header-row">
              <p>
                Everything you need to know about how Cineri handles your
                personal data.
              </p>

              <span>Last Updated: Aug 4, 2026</span>
            </div>
          </header>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Overview &amp; scope</p>
            <h2>Your privacy is our priority</h2>

            <p className="help-article-intro1">
              This Privacy Policy explains how Cineri collects, uses, and
              protects information about you when you use the Cineri platform.
              This Policy applies to all users of the Service regardless of
              location. Where local laws provide additional rights or impose
              additional obligations, we comply with those requirements in the
              jurisdictions where they apply.
            </p>

            <p className="help-privacy-highlight">
              Cineri uses your data only to power your recommendations. We do
              not sell it, share it with advertisers, or use it for any purpose
              unrelated to the streaming discovery service you signed up for.
            </p>
          </section>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Data collection</p>
            <h2>Information we collect</h2>

            <p className="help-privacy-subheading">
              Information you provide directly:
            </p>

            <div className="help-privacy-card-grid">
              {collectedInformation.map((item) => (
                <article className="help-article-feature-card" key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>

            <div className="help-privacy-collect-grid">
              <div>
                <p className="help-privacy-column-label is-allowed">
                  Information Cineri collects:
                </p>

                {collects.map((item) => (
                  <article
                    className="help-privacy-border-card is-allowed"
                    key={item.title}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>

              <div>
                <p className="help-privacy-column-label is-private">
                  Information Cineri does not collect:
                </p>

                {doesNotCollect.map((item) => (
                  <article
                    className="help-privacy-border-card is-private"
                    key={item.title}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="help-article-section">
            <h2>How do we use your information</h2>

            <p className="help-article-intro1">
              We use the information for the following purposes:
            </p>

            <div className="help-privacy-use-table">
              <div className="help-privacy-table-head">
                <span>Purpose</span>
                <span>Data used</span>
              </div>

              {useRows.map((row) => (
                <div className="help-privacy-table-row" key={row.purpose}>
                  <span>{row.purpose}</span>
                  <span>{row.dataUsed}</span>
                </div>
              ))}
            </div>

            <p className="help-privacy-highlight">
              We never use your data to build advertising profiles, sell it to
              third parties, or infer sensitive characteristics for any
              purpose.
            </p>
          </section>

          <section className="help-article-section">
            <h2>How do we share your information</h2>

            <p className="help-article-intro1">
              We share information only in the following limited circumstances:
            </p>

            <div className="help-privacy-sharing-list">
              {sharingItems.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="help-article-section">
            <h2>Data Retention</h2>

            <p className="help-article-intro1">
              We retain your personal data for as long as your account is active
              or as needed to provide the service:
            </p>

            <div className="help-privacy-retention-table">
              <div className="help-privacy-retention-head">
                <span>Data category</span>
                <span>Retention period</span>
                <span>Notes</span>
              </div>

              {retentionRows.map((row) => (
                <div
                  className="help-privacy-retention-row"
                  key={row.category}
                >
                  <span>{row.category}</span>
                  <span>{row.period}</span>
                  <span>{row.notes}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="help-article-section">
            <h2>Data security</h2>

            <p className="help-article-intro1">
              We implement industry-standard technical and organizational
              measures to protect your personal data:
            </p>

            <div className="help-privacy-security-list">
              <article>
                <h3>Encryption</h3>
                <p>
                  All data in transit uses TLS 1.3 encryption. Data at rest is
                  encrypted using AES-256. OAuth tokens receive an additional
                  application-layer encryption layer before storage.
                </p>
              </article>

              <article>
                <h3>Access to data</h3>
                <p>
                  Access to production user data is restricted to authorized
                  engineers with two-factor authentication required.
                </p>
              </article>

              <article>
                <h3>Security audits</h3>
                <p>
                  Regular third-party security audits and penetration tests are
                  conducted annually.
                </p>
              </article>
            </div>

            <p className="help-privacy-highlight">
              Despite our measures, no transmission or storage system can be
              guaranteed 100% secure. If you believe your account has been
              compromised, change your password immediately and contact support.
            </p>
          </section>

          <section className="help-article-section">
            <h2>Children&apos;s privacy</h2>

            <p className="help-article-intro1">
              Cineri is intended for users aged 18 and over. We do not knowingly
              collect personal data from children under 18.
            </p>

            <p className="help-privacy-highlight">
              If you believe a child under 18 has provided personal data,
              please contact Cineri support and we will take immediate action.
            </p>
          </section>

          <section className="help-article-section help-privacy-last-section">
            <h2>Changes to this policy</h2>

            <p className="help-article-intro1">
              We may update this Privacy Policy from time to time. When we do:
            </p>

            <ul className="help-privacy-change-list">
              <li>
                We update the “Effective date” shown at the top of this page.
              </li>
              <li>
                For material changes, we notify you by email at least 14 days
                before the change takes effect.
              </li>
              <li>
                Material changes require your affirmative acknowledgment before
                you can continue using the platform.
              </li>
              <li>
                Previous versions of this Policy are archived and available on
                request.
              </li>
            </ul>

            <p className="help-privacy-closing">
              Your continued use of the Service after the effective date of a
              non-material change constitutes acceptance of the updated Policy.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}