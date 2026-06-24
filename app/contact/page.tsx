import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="terms-page">
      <section className="terms-hero">
        <p className="terms-eyebrow">Support</p>
        <h1>Contact Us</h1>
        <p>We’d love to hear from you.</p>
      </section>

      <section className="terms-layout">
        <aside className="terms-sidebar">
          <h3>Support Info</h3>
          <a href="#email">Email Support</a>
          <a href="#response-time">Response Time</a>
          <a href="#message">Send a Message</a>
        </aside>

        <article className="terms-content">
          <section id="email">
            <h2>Email Support</h2>
            <p>
              For account questions, recommendation issues, or general support,
              you can contact us at support@cineri.com.
            </p>
          </section>

          <section id="response-time">
            <h2>Response Time</h2>
            <p>
              Our team usually responds within 1–2 business days.
            </p>
          </section>

          <section id="message">
            <h2>Send a Message</h2>

            <form className="contact-form">
              <input type="text" placeholder="Your Name" className="form-input" />
              <input type="email" placeholder="Your Email" className="form-input" />
              <textarea
                placeholder="How can we help?"
                rows={6}
                className="form-input"
              />

              <button className="primary-btn" type="button">
                Send Message
              </button>
            </form>
          </section>

          <section>
            <h2>Need quick help?</h2>
            <p style={{marginBottom:'30px'}}>
              You can also visit the Help Center for common questions about
              accounts, recommendations, profiles, and streaming services.
            </p>

            <Link href="/help" className="help-contact-btn">
              Visit Help Center
            </Link>
          </section>
        </article>
      </section>
    </div>
  );
}