"use client";

import Link from "next/link";
import { useState } from "react";


export default function ContactPage() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        name,
        email,
        message,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
    }

    setSuccess("Message sent successfully.");
    setName("");
    setEmail("");
    setMessage("");
    };


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

            <form className="contact-form" onSubmit={handleSubmit}>
              <input
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    />

                    <input
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email"
                    />

                    <textarea
                    className="form-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    />

                {error && (
                <p style={{ color: "#ff6b6b" }}>{error}</p>
                )}

                {success && (
                <p style={{ color: "#4caf50" }}>{success}</p>
                )}

              <button className="primary-btn" type="submit">
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