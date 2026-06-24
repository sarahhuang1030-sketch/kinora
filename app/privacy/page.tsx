const sections = [
  "Information We Collect",
  "How We Use Your Information",
  "Third-Party Authentication",
  "Data Security",
  "Data Sharing",
  "Your Choices",
  "Contact Us",
];

export default function PrivacyPage() {
  return (
    <div className="terms-page">
      <section className="terms-hero">
        <p className="terms-eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
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
          <section id="information-we-collect">
            <h2>Information We Collect</h2>
            <p>
              CINERI may collect information you provide when creating an
              account, including your name, email address, phone number, date of
              birth, country, profile image, and content preferences.
            </p>
          </section>

          <section id="how-we-use-your-information">
            <h2>How We Use Your Information</h2>
            <ul>
              <li>Create and manage your account.</li>
              <li>Personalize movie and TV recommendations.</li>
              <li>Save your watchlist and viewing preferences.</li>
              <li>Improve the CINERI user experience.</li>
              <li>Respond to help or contact requests.</li>
            </ul>
          </section>

          <section id="third-party-authentication">
            <h2>Third-Party Authentication</h2>
            <p>
              If you sign in using Google or another social provider, CINERI may
              receive basic profile information such as your name, email
              address, and profile image.
            </p>
          </section>

          <section id="data-security">
            <h2>Data Security</h2>
            <p>
              We use reasonable measures to help protect your information from
              unauthorized access, disclosure, or misuse.
            </p>
          </section>

          <section id="data-sharing">
            <h2>Data Sharing</h2>
            <p>
              CINERI does not sell your personal information. Information may be
              used only to support account functionality, recommendations, and
              platform improvement.
            </p>
          </section>

          <section id="your-choices">
            <h2>Your Choices</h2>
            <p>
              You can update your profile details, change your preferences, or
              remove your profile image from your Profile page.
            </p>
          </section>

          <section id="contact-us">
            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              through the Contact page.
            </p>
          </section>
        </article>
      </section>
    </div>
  );
}