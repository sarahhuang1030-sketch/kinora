import Link from "next/link";
import {
  Check,
  Clock3,
  Compass,
  Heart,
  MonitorPlay,
  Search,
  Sparkles,
  Target,
  ThumbsDown,
  EyeOff,
  Frown,
  Users,
  Star,
} from "lucide-react";

const team = [
  { name: "Victoria Khokhlova", role: "Graphic & UX/UI Designer" },
  { name: "Yu Jou Huang (Sarah)", role: "Web Designer & Developer" },
  { name: "Dylan Ellis", role: "Graphic & UX/UI Designer" },
  { name: "Alexander Armstrong", role: "Graphic & UX/UI Designer" },
  { name: "Sehrish Khan", role: "Graphic Designer" },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-shell">
        <section className="about-hero">
          <p className="about-kicker">Welcome to Cineri</p>
          <h1>
            The end of
            <br />
            endless <span>scrolling.</span>
          </h1>
          <p className="about-hero-copy">
            Cineri is a mood-first content discovery platform. We care about how
            you want to feel and use that to find the right film or series to
            match that feeling, on whichever platform you already pay for.
          </p>
        </section>

        <section className="about-problem about-section-grid">
          <div className="about-section-copy">
            <p className="about-kicker">Our problem</p>
            <h2>
              What you want to watch
              <br />
              <span>matters the most.</span>
            </h2>
            <p>
              The average person spends 18 minutes choosing something to watch, and
              still settles on a rerun. We built Cineri because your evening deserves better
              than that. Great stories exist for every mood. We make them findable.
            </p>
            <blockquote>
              “The right film at the right moment can shift how 
                    you feel about the entire day. We exist to make that 
                    moment more likely.”
            </blockquote>
          </div>

          <div className="about-stat-grid">
            <article>
              <strong>18 minutes</strong>
              <p>Average Decision time</p>
              <span>Before choosing what to watch</span>
            </article>
            <article>
              <strong>61%</strong>
              <p>Settle on a rerun</p>
              <span>giving up on finding something new</span>
            </article>
            <article>
              <strong>4.2</strong>
              <p>Streaming services owned</p>
              <span>by an average Canadian, yet most content still goes unseen</span>
            </article>
            <article>
              <strong>84%</strong>
              <p>Pick Based on mood</p>
              <span>users seek content that matches how they feel or want to feel in the moment</span>
            </article>
          </div>
        </section>

        <section className="about-steps">
          <p className="about-kicker">How it works</p>
          <h2>
            Three steps to the <span>perfect watch.</span>
          </h2>

          <div className="about-step-grid">
            <article className="about-step-card">
              <div className="about-step-heading">
                <span className="about-step-number">1</span>
                <h3>Tell us how you’re feeling tonight</h3>
              </div>
              <p>
                Choose from 6 mood categories - Intense, Relaxing, Mind-Bending, Feel Good,
                Spooky and more. No stars. no genres, no complicated filters. Just how you actucally feel right now.
              </p>
            </article>

            <article className="about-step-card">
              <div className="about-step-heading">
                <span className="about-step-number">2</span>
                <h3>We find your perfect match based on your mood</h3>
              </div>
              <p>
                Cineri cross-references your mood, genre, preferences, streaming plaftforms, and the watch history of thousands of people 
                with similar taste. Then provide you with watch options that fits you.
              </p>
            </article>

            <article className="about-step-card">
              <div className="about-step-heading">
                <span className="about-step-number">3</span>
                <h3>Stream on the platforms you already have</h3>
              </div>
              <p>
                Matches are ranked by both emotional fit and actual availability. 
                Every mood-based result shows only the content you can watch based on the streaming services you
                 already have. 
              </p>
            </article>
          </div>
        </section>

        <section className="about-streaming about-section-grid">
          <div className="about-streaming-left">
            <p className="about-kicker">The streaming problem</p>
            <h2>
              Streaming services have
              <br />
              <span>a discovery problem</span>
            </h2>
            <p className="about-section-lead">
              The platforms are competing for your attention — not your time.  
              Their recommendation engines are built to keep you inside their own catalogue, 
              not to find you the best thing to watch.
            </p>

            <div className="about-issue-list">
              <article>
                <EyeOff aria-hidden="true" />
                <div>
                  <h3>Walled-garden recommendations</h3>
                  <p>Netflix recommends Netflix originals. Prime recommends Prime. 
                      You never see the best option across all your platforms at once.</p>
                </div>
              </article>
              <article>
                <Frown aria-hidden="true" />
                <div>
                  <h3>Your mood is ignored entirely</h3>
                  <p>No platform asks what do you feel like watching. They ask what 
                    you&apos;ve watched before, and loop you in the same genres forever.</p>
                </div>
              </article>
              <article>
                <ThumbsDown aria-hidden="true" />
                <div>
                  <h3>The paradox of choice</h3>
                  <p>More content than ever exists, yet finding something to watch is harder than ever. 
                    Endless rows of thumbnails aren&apos;t discovery, but just a bigger haystack.</p>
                </div>
              </article>
            </div>
          </div>

          <article className="about-solution-card">
            <p className="about-mini-label">
              <Star size={10} fill="currentColor" strokeWidth={0} />
              The Cineri Solution
            </p>
            <h3>
              A single platform that knows all your streaming services, and how
              you feel.
            </h3>
            <p>
              We sit above the platforms — neutral, cross-service, and mood-first. 
              We don&apos;t care which platform carries the best match tonight, as long as
               you have a subscription to it.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" /> <b>Cross-platform</b>—  searches all your services simultaneously
              </li>
              <li>
                <Check aria-hidden="true" /> <b>Mood-first</b>— starts with how you feel, not what you&apos;ve watched
              </li>
              <li>
                <Check aria-hidden="true" /> <b>Watchlists curated by you</b>— build themed lists and track progress 
              </li>
              <li>
                <Check aria-hidden="true" /> <b>Cineri curation too</b> — our team maintains unique weekly Collections no algorithm
                 could build
              </li>
            </ul>
          </article>
        </section>

        <section className="about-team">
          <p className="about-kicker">Our team</p>
          <h2>
            Built for viewers, <span>by viewers.</span>
          </h2>
          <p className="about-team-copy">
            A small team of students, designers, and developers who enjoy great
            movies, but get tired of endlessly searching across platforms what to watch on a Friday night.
          </p>

          <div className="about-team-grid">
            {team.map((member) => (
              <article key={member.name} className="about-team-card">
                <div className="about-team-avatar" aria-hidden="true">
                  <Users />
                </div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-cta">
          {/* <Sparkles className="about-cta-icon" aria-hidden="true" /> */}
          <h2>
            Join Cineri <span>today</span>
          </h2>
          <p>And start spending that time watching something they actually love.</p>
          <Link href="/register" className="about-primary-button">
            Get started
          </Link>
          <span className="about-cta-divider">Already have an account?</span>
          <Link href="/login" className="about-secondary-button">
            Log in
          </Link>
        </section>
      </div>

      <section className="about-help-banner">
        <div className="about-help-content">
          <p className="about-kicker">Help Center</p>
          <h2>
            Need help?<br />
          <span> We&apos;re here for you!</span></h2>
          <p>Visit our Help Centre for FAQs or contact with Support Team.</p>
          <Link href="/help" className="about-help-button">
            Go to Help Centre
          </Link>
        </div>
        <div className="about-help-art about-help-art-image" />
      </section>
    </div>
  );
}