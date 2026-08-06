import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircleUserRound,
  Heart,
  Monitor,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import HelpArticleSidebar from "../../components/HelpArticleSidebar";

const accountSettings = [
  {
    title: "Profile",
    href: "#",
    icon: CircleUserRound,
    content: (
      <>
        <div className="help-account-detail-block">
          <h4>Update your display name & avatar</h4>
          <p>
            Under the Profile tab, click the avatar circle to upload a photo.
            Your display name appears on public reviews. It does not need to
            match your real name.
          </p>
        </div>

        <div className="help-account-detail-block">
          <h4>Change email or password</h4>
          <p>
            Change your email sends a verification link to the new address
            before it is saved. Password changes apply immediately with a
            confirmation email sent to your current address.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Streaming Services",
    href: "#",
    icon: Monitor,
    content: (
      <div className="help-account-detail-block">
        <h4>Review & edit your Streaming Services</h4>
        <p>
          Go to Account → Streaming Services to manage your connected
          platforms. Select Edit to remove or update your current services, or
          browse the available options below to add a new streaming service.
        </p>
      </div>
    ),
  },
  {
    title: "Preferences",
    href: "#",
    icon: Heart,
    content: (
      <div className="help-account-detail-block">
        <h4>Adjust genre & content type preferences</h4>
        <p>
          Go to Account → Preferences to update your genres, content types, and
          what matters most to you when choosing a title. Changes take effect
          on your next Browse load.
        </p>
      </div>
    ),
  },
  {
    title: "Watchlists",
    href: "#",
    icon: SlidersHorizontal,
    content: (
      <>
        <div className="help-account-detail-block">
          <h4>Create, track progress & organize your watchlists</h4>
          <p>
            Keep your watchlists organized from Account → Watchlists. Create
            new lists, track what you are watching, rearrange content, and
            easily add or remove titles.
          </p>
        </div>

        <div className="help-account-detail-block">
          <h4>Share your watchlists</h4>
          <p>
            Have a watchlist you want to share with friends or family? Simply
            select the Share button and choose your preferred sharing method.
          </p>
        </div>

        <div className="help-account-detail-block help-account-tip">
          <h4>Cineri tip</h4>
          <p>
            Anyone with the link can view your shared watchlists, but only
            active Cineri members can save them to their account.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Activity",
    href: "#",
    icon: Activity,
    content: (
      <div className="help-account-detail-block">
        <h4>Review everything you&apos;ve watched and rated</h4>
        <p>
          Go to Account → Activity to view everything you have marked as
          watched, review your recent mood tags, and revisit the reviews you
          have written. You can also edit your watched history and update or
          delete your review anytime.
        </p>
      </div>
    ),
  },
  {
    title: "Settings",
    href: "#",
    icon: Settings,
    content: (
      <div className="help-account-detail-block">
        <h4>Edit display, language and privacy</h4>
        <p>
          Customize your Cineri experience by adjusting your display,
          language, and privacy settings from Account → Settings.
        </p>
      </div>
    ),
  },
];

const recommendationFactors = [
  {
    title: "Preferences",
    text: "Your preferences determine genres, content types, and what matters most to you. This foundation of Cineri recommendations grows alongside suggestions tailored to your taste.",
  },
  {
    title: "Streaming Services",
    text: "Cineri only recommends movies and shows available on the streaming platforms you have connected. Connect your service right away so titles can be prioritized.",
  },
  {
    title: "Ratings",
    text: "Every time you mark content watched, you will be invited to rate and review it. Your feedback helps improve recommendations and refine the system&apos;s understanding of your taste.",
  },
  {
    title: "Mood Selection",
    text: "Mood selection lets you guide your current recommendations. Your mood selection only affects your recommended experience for the moment and can be updated whenever you like.",
  },
];

const improvementTips = [
  {
    title: "Make your mood selection daily",
    text: "Your mood selection helps Cineri understand what you want to watch in the moment. By regularly choosing your mood, Cineri can learn patterns in your watching preferences based on factors like time of day or day of the week. Over time, Cineri may recognize your habits and automatically adjust recommendations to better match your typical viewing experience.",
  },
  {
    title: "Mark watched content and leave ratings",
    text: "If Cineri recommends a movie or show you have already watched, mark it as Watched. This helps remove content you have already seen from future recommendations and improves the accuracy of your suggestions. Marking content as watched also allows you to rate and review it. Your feedback helps Cineri understand what you enjoyed or disliked, improving your future recommendations. Your reviews also help other Cineri users discover content they may love.",
  },
  {
    title: "Build and update your watchlists",
    text: "Adding movies and shows you are interested in to your watchlists helps Cineri understand the types of content you enjoy. Tracking your progress and organizing your watchlists provides more insight into your viewing preferences, allowing Cineri to recommend similar content. You can also share your watchlists with other Cineri users. When they save your shared lists, those selections can help personalize their recommendations as well.",
  },
  {
    title: "Keep your preferences updated",
    text: "Your account preferences are the foundation of your recommendation experience. If your interests change over time, update your preferences to reflect your current taste. Adjust your favourite genres, content types, and viewing preferences to make sure Cineri continues showing you the content that matters most to you.",
  },
  {
    title: "Keep your streaming services updated",
    text: "Cineri prioritizes recommendations based on content you can actually watch. Since Cineri does not track whether your connected streaming subscriptions are still active, it is important to keep your linked services updated. If you stop using a streaming platform or add a new subscription, update your connected services right away. Your homepage recommendations are based on the streaming platforms you have provided, so keeping them current ensures you always see relevant and accessible content.",
  },
];

export default function AccountRecommendationsPage() {
  return (
    <div className="help-article-page">
      <div className="help-article-layout">
        <HelpArticleSidebar activeTopic="account-recommendations" />

        <main className="help-article-content">
          <header className="help-article-header">
            <h1>Account &amp; Recommendations</h1>
            <p>
              Learn how to manage your account, understand how Cineri&apos;s
              recommendations work, and discover how to get the most out of your
              personalized recommendations.
            </p>
          </header>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Account settings</p>
            <h2>Making changes to your account</h2>

            <p className="help-article-intro">
              Your Cineri profile controls everything from how you log in to
              which genres your recommendations are drawn from. This guide
              walks through every section of the Account panel and explains
              what each setting does.
            </p>

            <div className="help-account-settings-list">
              {accountSettings.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="help-account-settings-row" key={item.title}>
                    <Link
                      href={item.href}
                      className="help-article-account-button"
                    >
                      <span>
                        <Icon size={13} aria-hidden="true" />
                      </span>
                      {item.title}
                    </Link>

                    <div className="help-account-settings-copy">
                      {item.content}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Personalization</p>
            <h2>How recommendations work</h2>

            <p className="help-article-intro">
              We use your preferences, ratings, streaming services, and moods
              to help you discover movies and shows you&apos;ll love. The more
              you share with Cineri, the better your personalized
              recommendations become.
            </p>

            <div className="help-account-factor-grid">
              {recommendationFactors.map((factor) => (
                <article
                  className="help-article-feature-card help-account-factor-card"
                  key={factor.title}
                >
                  <h4>{factor.title}</h4>
                  <p>{factor.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="help-article-section help-account-improve-section">
            <p className="help-article-eyebrow">Cineri tips</p>
            <h2>How to improve your recommendations</h2>

            <p className="help-article-intro">
              Cineri learns from your choices to create recommendations that
              better match your taste, mood, and viewing habits. The more
              accurate and up-to-date your information is, the better Cineri
              can help you discover your next favourite movie or show. Here are
              a few ways to improve your recommendations:
            </p>

            <div className="help-account-improvement-list">
              {improvementTips.map((tip) => (
                <article
                  className="help-account-improvement-item"
                  key={tip.title}
                >
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>
          </section>

          <footer className="help-article-next">
            <Link href="/help/streaming-services">
              <span>Next Article:</span>
              Streaming Services
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}