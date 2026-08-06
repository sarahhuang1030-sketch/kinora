import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CircleUserRound,
  Heart,
  Home,
  LockKeyhole,
  Monitor,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import HelpArticleSidebar from "../../components/HelpArticleSidebar";

const navigationCards = [
  {
    title: "Home",
    description:
      "The Home screen is your personalized recommendation space. Instead of endlessly scrolling through content, Cineri Home helps you quickly discover what to watch based on your preferences and current mood.",
    href: "/",
    linkText: "Go to Home",
    cards: [
      {
        title: "Mood selector",
        text: "Cineri offers six mood categories to help tailor your recommendations. Selecting a mood is optional, but it makes recommendation content match how you are feeling.",
      },
      {
        title: "Home filters",
        text: "By default, your recommendations reflect your preferences and linked streaming services. You can refine your results by adjusting the filters.",
      },
      {
        title: "Watchlists",
        text: "Your recent watchlists are available from the Home page for quick access. To view and manage all watchlists, go to Account → My Watchlists.",
      },
    ],
  },
  {
    title: "Discover",
    description:
      "Discover is for browsing across all content without personalization. It surfaces what is new, what is trending, and editorially curated collections built around themes.",
    href: "/discover",
    linkText: "Go to Discover",
    cards: [
      {
        title: "New & Trending Releases",
        text: "New Releases suggests titles added to streaming platforms recently. Trending offers titles gaining attention across all platforms.",
      },
      {
        title: "Curated Collections",
        text: "Hand-picked collections based on movie-related themes. Collections are updated regularly to help you discover new favourites.",
      },
      {
        title: "Browse all content",
        text: "Explore the complete Cineri catalogue in one place. Browse all available content or use filters to narrow your search.",
      },
    ],
  },
];

const accountItems = [
  {
    title: "Profile",
    description:
      "Review and edit your name, avatar, date of birth, email address, and login security settings. This tab also shows social and single sign-on accounts linked to Cineri.",
    href: "#",
    icon: UserRound,
  },
  {
    title: "Streaming Services",
    description:
      "Connect, disconnect, and manage your streaming accounts.",
    href: "#",
    icon: Monitor,
  },
  {
    title: "Preferences",
    description:
      "Your genre selections, content type preferences, and what matters most to you when choosing what to watch. Changes take effect immediately on your next Home load.",
    href: "#",
    icon: Heart,
  },
  {
    title: "Watchlists",
    description:
      "All your saved watchlists can be viewed and managed here. Create lists by mood, platform, genre, or any criteria you choose.",
    href: "#",
    icon: SlidersHorizontal,
  },
  {
    title: "Activity",
    description:
      "A log of everything you have marked watched, mood selections you have made, and reviews you have left.",
    href: "#",
    icon: Activity,
  },
];

const tips = [
  {
    title: "Start with Home",
    text: "When you know what mood you are in, go straight to Home, pick a mood, and let the match scores do the work. Use Discover when you are curious but not looking for a specific kind of experience.",
  },
  {
    title: "Connect your streaming platforms first",
    text: "Personalized recommendations work best when you connect at least one streaming service. This helps ensure every recommendation is something you can watch right away.",
  },
  {
    title: "Review titles after you watch them",
    text: "Leaving a review is one of the most useful actions for improving your recommendations. Even a few reviews from films you have already seen can improve future match scores.",
  },
  {
    title: "Save to watchlist, even speculatively",
    text: "Saving a title, even when you are not sure you will watch it, sends a positive signal to Cineri. Your saved feed helps the system learn your preferences over time.",
  },
  {
    title: "Update Preferences when your tastes shift",
    text: "Cineri cannot infer genre changes as quickly as an explicit update. When your interests change, update your Account Preferences so your next Home load reflects them.",
  },
];

export default function GettingStartedPage() {
  return (
    <div className="help-article-page">
      <div className="help-article-layout">
       
        <HelpArticleSidebar activeTopic="getting-started" />

        <main className="help-article-content">
          <header className="help-article-header">
            <h1>Getting Started</h1>
            <p>
              Learn how to create your account, explore the platform, and make
              the most of your Cineri experience.
            </p>
          </header>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Account setup</p>
            <h2>Creating your Cineri account</h2>
            <p className="help-article-intro">
              Creating a Cineri account takes less than two minutes. Follow
              these steps below to get started.
            </p>

            <div className="help-article-instructions">
              <div className="help-article-text-step">
                <h3>Go to cineri.com and click Join</h3>
                <p>
                  The orange Join button is in the top-right corner of every
                  Cineri page. Click it to open the account creation flow.
                </p>
              </div>

              <div className="help-article-text-step">
                <h3>Follow a simple 3-step onboarding process</h3>
                <p>
                  Cineri will guide you through each step to create your
                  account.
                </p>
              </div>

              <div className="help-article-number-card">
                <span className="help-article-number">1</span>
                <div>
                  <h3>Tell us your watching preferences</h3>
                  <p>
                    Choose your favourite genres, preferred content types, and
                    what makes your ideal viewing experience.
                  </p>
                  <p>
                    We use your preferences to personalize recommendations when
                    your account is activated.
                  </p>
                </div>
              </div>

              <div className="help-article-number-card">
                <span className="help-article-number">2</span>
                <div>
                  <h3>Add your personal details</h3>
                  <p>Add your name, date of birth, country, email and password.</p>

                  <h4>Verify your email</h4>
                  <p>
                    When using email and password, check your inbox for a
                    verification link. Click it to activate your account.
                  </p>

                  <h4 className="orange">Cineri tip</h4>
                  <p>
                    When signing up with Google, you may skip email verification
                    and continue directly into the onboarding flow.
                  </p>
                </div>
              </div>

              <div className="help-article-number-card">
                <span className="help-article-number">3</span>
                <div>
                  <h3>Add your streaming services</h3>
                  <p>
                    Link any active streaming service subscriptions you
                    currently have.
                  </p>

                  <span className="help-article-mini-label">
                    Supported streaming platforms:
                  </span>

                  <div className="help-article-platforms">
                    {[
                      "Netflix",
                      "Amazon Prime",
                      "Crave",
                      "Disney+",
                      "Apple TV",
                      "HBO Max",
                      "Paramount+",
                      "Hulu",
                      "Starz",
                    ].map((platform) => (
                      <span key={platform}>{platform}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="help-article-text-step">
                <h3>Review your choices</h3>
                <p>
                  Return to any section to edit it before launching your
                  personalized Cineri account.
                </p>
              </div>

              <div className="help-article-text-step">
                <h3>Launch your Cineri account</h3>
                <p>
                  Once you are finished, your account will be activated and
                  your personalized recommendations will be ready to explore.
                </p>
              </div>
            </div>
          </section>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Navigation</p>
            <h2>How to use Cineri</h2>
            <p className="help-article-intro">
              Every section of the Cineri platform has its own distinct
              purpose, easily accessible through the navigation bar.
            </p>

            <div className="help-article-navigation-sections">
              {navigationCards.map((section) => (
                <article
                  className="help-article-navigation-group"
                  key={section.title}
                >
                  <div className="help-article-navigation-heading">
                    <div>
                      <h3>{section.title}</h3>
                      <p>{section.description}</p>
                    </div>

                    <Link href={section.href}>
                      {section.linkText}
                      <ArrowRight size={11} />
                    </Link>
                  </div>

                  <div className="help-article-feature-grid">
                    {section.cards.map((card) => (
                      <div className="help-article-feature-card" key={card.title}>
                        <h4>{card.title}</h4>
                        <p>{card.text}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <article className="help-article-navigation-group">
              <div className="help-article-navigation-heading">
                <div>
                  <h3>Account</h3>
                  <p>
                    Account is the control centre for your entire Cineri
                    experience. Your profile, watchlists, activity,
                    preferences, and streaming connections are managed here.
                  </p>
                </div>

                <Link href="#">
                  Go to Account
                  <ArrowRight size={11} />
                </Link>
              </div>

              <div className="help-article-account-list">
                {accountItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="help-article-account-row" key={item.title}>
                      <Link
                        href={item.href}
                        className="help-article-account-button"
                      >
                        <span>
                          <Icon size={13} />
                        </span>
                        {item.title}
                      </Link>

                      <div className="help-article-account-description">
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="help-article-navigation-group">
              <div className="help-article-navigation-heading">
                <div>
                  <h3>About</h3>
                  <p>
                    About is two things at once: a window into how and why
                    Cineri was built, and the gateway to every support resource
                    you may need.
                  </p>
                </div>

                <Link href="/about">
                  Go to About
                  <ArrowRight size={11} />
                </Link>
              </div>

              <div className="help-article-feature-grid">
                <div className="help-article-feature-card">
                  <h4>Our Story and Mission</h4>
                  <p>
                    Learn more about Cineri, meet the team behind the platform,
                    and discover why we created it.
                  </p>
                </div>

                <div className="help-article-feature-card">
                  <h4>Help Center</h4>
                  <p>
                    Our library of guides to learn about Cineri, browse FAQs,
                    and contact our support team.
                  </p>
                </div>

                <div className="help-article-feature-card">
                  <h4>Privacy Policy</h4>
                  <p>
                    Legal information explaining what data Cineri collects, how
                    it is used, and the rules governing the service.
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="help-article-section help-article-tips-section">
            <p className="help-article-eyebrow">Cineri tips</p>
            <h2>Get more from Cineri</h2>
            <p className="help-article-intro">
              Five habits that make a meaningful difference to your experience.
            </p>

            <div className="help-article-tips">
              {tips.map((tip) => (
                <article className="help-article-tip" key={tip.title}>
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>
          </section>

          <footer className="help-article-next">
            <Link href="/help/account-recommendations">
              <span>Next Article:</span>
              Account & Recommendations
              <ArrowRight size={18} />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}