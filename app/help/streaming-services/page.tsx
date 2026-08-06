import Link from "next/link";
import { ArrowRight } from "lucide-react";

import HelpArticleSidebar from "../../components/HelpArticleSidebar";

const streamingPlatforms = [
  "Netflix",
  "Amazon Prime",
  "Crave",
  "Disney+",
  "Apple TV",
  "HBO Max",
  "Paramount+",
  "Hulu",
  "Starz",
];

export default function StreamingServicesPage() {
  return (
    <div className="help-article-page">
      <div className="help-article-layout">
        <HelpArticleSidebar activeTopic="streaming-services" />

        <main className="help-article-content">
          <header className="help-article-header">
            <h1>Streaming Services</h1>

            <p>
              Learn more about how to connect, disconnect, and troubleshoot your
              streaming accounts.
            </p>
          </header>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Connection</p>
            <h2>How to connect a streaming service</h2>

            <p className="help-article-intro">
              Connecting a streaming service takes under 60 seconds and never
              requires you to hand over your password. Cineri uses token-based
              authentication, so your credentials stay entirely with the
              platform you are connecting.
            </p>

            <div className="help-streaming-step-list">
              <article className="help-streaming-step">
                <h3>Open your streaming services panel</h3>
                <p>
                  Click your avatar icon in the top-right of any Cineri page,
                  then navigate to the Streaming Services tab in the left-hand
                  panel.
                </p>
              </article>

              <article className="help-streaming-step">
                <h3>Find the streaming platform you would like to connect</h3>
                <p>
                  Browse all supported streaming platforms and click on the one
                  you would like to connect. Your connected services will appear
                  at the top, and you can link as many platforms as you subscribe
                  to—there is no limit.
                </p>

                <span className="help-article-mini-label">
                  Supported streaming platforms:
                </span>

                <div className="help-article-platforms">
                  {streamingPlatforms.map((platform) => (
                    <span key={platform}>{platform}</span>
                  ))}
                </div>
              </article>

              <article className="help-streaming-step">
                <h3>
                  Click to connect and permission screen opens from the platform
                </h3>
                <p>
                  Each streaming platform will display its own OAuth permission
                  screen. This is hosted by that platform—Cineri never sees or
                  stores the username and password you enter there.
                </p>
              </article>

              <article className="help-streaming-step">
                <h3>Approve the read-only access request</h3>
                <p>
                  The permission screen lists exactly what Cineri is requesting.
                  Approve it, and you will be redirected back to Cineri
                  automatically. The connection activates within seconds and the
                  platform card updates to show “Connected.”
                </p>
              </article>

              <article className="help-streaming-warning">
                <h3>
                  Your password, subscription details and account information is
                  never shared with Cineri
                </h3>

                <p>
                  Cineri uses secure OAuth connection protocols to link your
                  streaming services without accessing or storing your login
                  credentials. When you connect a streaming platform, the
                  service provides Cineri with a temporary encrypted
                  authorization token. Cineri uses this token to confirm your
                  connection and identify which streaming services you use
                  without ever receiving or storing your username or password.
                </p>
              </article>
            </div>
          </section>

          <section className="help-article-section">
            <h2>How to edit or disconnect a streaming service</h2>

            <div className="help-streaming-step-list">
              <article className="help-streaming-step">
                <h3>Open your streaming services panel</h3>
                <p>
                  Click your avatar icon in the top-right of any Cineri page,
                  then navigate to the Streaming Services tab in the left-hand
                  panel.
                </p>
              </article>

              <article className="help-streaming-step">
                <h3>
                  Find the streaming platform you would like to disconnect
                </h3>
                <p>
                  Your connected services appear at the top. Select Disconnect
                  to remove a service or choose Edit to update your connection
                  settings.
                </p>
              </article>

              <article className="help-streaming-step">
                <h3>Approve the disconnect request</h3>
                <p>
                  The permission access will stop as approved, and the streaming
                  account will be disconnected automatically. The connection
                  card updates to show “Disconnected.”
                </p>
              </article>
            </div>
          </section>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Streaming access</p>
            <h2>What access does Cineri get?</h2>

            <p className="help-article-intro1">
              When you connect your streaming services to Cineri, we only know
              that you have an account connected with a specific streaming
              platform. We use limited information from those platforms to
              provide more accurate recommendations and improve your viewing
              experience.
            </p>

            <div className="help-streaming-access-grid">
              <div className="help-streaming-access-column">
                <p className="help-streaming-access-label is-allowed">
                  Information Cineri accesses:
                </p>

                <article className="help-streaming-access-card is-allowed">
                  <h3>Available content information</h3>
                  <p>
                    To identify movies and shows available through your
                    connected services.
                  </p>
                </article>

                <article className="help-streaming-access-card is-allowed">
                  <h3>Watch history</h3>
                  <p>
                    To improve recommendations based on content you previously
                    watched.
                  </p>
                </article>
              </div>

              <div className="help-streaming-access-column">
                <p className="help-streaming-access-label is-private">
                  Information Cineri does not access:
                </p>

                <article className="help-streaming-access-card is-private">
                  <h3>Your Streaming account details</h3>

                  <p>
                    Cineri does not access or store sensitive account
                    information from your streaming services, such as:
                  </p>

                  <ul>
                    <li>your streaming account password</li>
                    <li>payment and billing details</li>
                    <li>personal messages or private information</li>
                  </ul>
                </article>
              </div>
            </div>

            <div className="help-streaming-question-list">
              <article>
                <h3>Why does Cineri need this information?</h3>
                <p>
                  Your connected services help Cineri recommend content that is
                  available for you to watch. Instead of suggesting movies you
                  cannot access, Cineri prioritizes titles available through
                  your current subscriptions.
                </p>
              </article>

              <article>
                <h3>Can I remove access?</h3>
                <p>
                  Yes. You can remove access by disconnecting any streaming
                  service at any time through Account → Streaming Services.
                  Removing a connection will stop Cineri from using that
                  platform when generating recommendations.
                </p>
              </article>
            </div>
          </section>

          <section className="help-article-section">
            <p className="help-article-eyebrow">Streaming integration</p>
            <h2>How we use streaming tokens</h2>

            <p className="help-article-intro1">
              When you connect a streaming service, the platform issues Cineri
              an encrypted OAuth token. Here is exactly how it works:
            </p>

            <div className="help-streaming-token-list">
              <article className="help-streaming-step">
                <h3>OAuth authentication</h3>
                <p>
                  Your credentials are entered directly on the platform&apos;s
                  own login page. Cineri only receives a token—an encrypted
                  string that proves the connection is authorized. We see no
                  password, no credit card, no payment history.
                </p>
              </article>

              <article className="help-streaming-step">
                <h3>Read-only</h3>
                <p>
                  The token is read-only and scoped only to account status
                  confirmation. It cannot be used to make purchases, change your
                  plan, or access your viewing history.
                </p>
              </article>

              <article className="help-streaming-step">
                <h3>Encryption</h3>
                <p>
                  The token is stored encrypted at rest using AES-256 and
                  transmitted over TLS 1.3 only. Tokens are never shared with any
                  third party other than the issuing platform.
                </p>

                <p>
                  When you disconnect a service, the token is immediately and
                  permanently deleted from our servers. You can also revoke the
                  token from the platform&apos;s own connected apps settings at
                  any time.
                </p>
              </article>
            </div>
          </section>

          <footer className="help-article-next">
            <Link href="/privacy">
              <span>Next Article:</span>
              Privacy Policy
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}