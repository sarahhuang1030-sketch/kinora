import Link from "next/link";

const helpTopics = [
  {
    title: "Account & Login",
    text: "Get help with registration, login, social sign-in, and profile details.",
    icon: "👤",
  },
  {
    title: "Recommendations",
    text: "Learn how CINERI suggests movies and shows based on your preferences.",
    icon: "✨",
  },
  {
    title: "Streaming Services",
    text: "Manage connected platforms like Netflix, Disney+, Prime Video, and Crave.",
    icon: "📺",
  },
  {
    title: "Watchlist",
    text: "Save movies and shows you want to watch later.",
    icon: "🎬",
  },
  {
    title: "Search & Discover",
    text: "Find content by title, mood, genre, year, or content type.",
    icon: "🔎",
  },
  {
    title: "Profile Settings",
    text: "Update your personal details, profile image, and viewing preferences.",
    icon: "⚙️",
  },
];

const popularQuestions = [
  "How do I create an account?",
  "How are my recommendations generated?",
  "How do I update my movie preferences?",
  "Why are my streaming services not showing?",
  "How do I edit my profile information?",
];

export default function HelpPage() {
  return (
    <div className="help-page">
      <section className="help-hero">
        <p className="help-eyebrow">CINERI Help Center</p>
        <h1>How can we help?</h1>

        <div className="help-search-box">
          <span>🔎</span>
          <input type="text" placeholder="Search help topics..." />
        </div>
      </section>

      <section className="help-section">
        <h2>Browse help topics</h2>

        <div className="help-topic-grid">
          {helpTopics.map((topic) => (
            <div className="help-topic-card" key={topic.title}>
              <div className="help-topic-icon">{topic.icon}</div>
              <h3>{topic.title}</h3>
              <p>{topic.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2>Popular questions</h2>

        <div className="help-question-list">
          {popularQuestions.map((question) => (
            <div className="help-question-row" key={question}>
              <span>{question}</span>
              <strong>›</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="help-contact-card">
        <div>
          <p className="help-eyebrow">Need more help?</p>
          <h2>Contact our support team</h2>
          <p>
            Send us a message and we’ll help you with your account,
            recommendations, or streaming service settings.
          </p>
        </div>

        <Link href="/contact" className="help-contact-btn">
          Contact Us
        </Link>
      </section>
    </div>
  );
}