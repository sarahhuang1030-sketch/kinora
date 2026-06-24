export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <p className="about-eyebrow">About CINERI</p>
        <h1>
          We help you find what to watch next,
          <span> one mood at a time.</span>
        </h1>
      </section>

      <section className="about-intro">
        <h2>Entertainment made personal.</h2>
        <p>
          CINERI is a personalized movie and TV discovery platform designed to
          help users find content based on their moods, favorite genres,
          streaming services, and viewing preferences.
        </p>
      </section>

      <section className="about-feature-grid">
        <div className="about-feature-card">
          <div className="about-card-icon">🎬</div>
          <h3>Discover</h3>
          <p>
            Browse movies and shows by genre, mood, year, and content type.
          </p>
        </div>

        <div className="about-feature-card">
          <div className="about-card-icon">✨</div>
          <h3>Recommendations</h3>
          <p>
            Get personalized suggestions based on what you enjoy watching.
          </p>
        </div>

        <div className="about-feature-card">
          <div className="about-card-icon">📺</div>
          <h3>Streaming Services</h3>
          <p>
            Filter content by platforms like Netflix, Disney+, Prime Video,
            and Crave.
          </p>
        </div>
      </section>

      <section className="about-statement">
        <h2>Our goal is simple.</h2>
        <p>
          We want to make movie discovery easier, faster, and more enjoyable —
          so users can spend less time searching and more time watching.
        </p>
      </section>
    </div>
  );
}