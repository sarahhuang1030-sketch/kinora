"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  LockKeyhole,
  Monitor,
  Paperclip,
  Search,
  Send,
  Smile,
  Upload,
  CircleUser,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";

const helpTopics = [
  {
    title: "Getting Started",
    text: "New to Cineri? Learn how to create your account, set up your taste profile, and connect your streaming services.",
    icon: "/icons/arrowRight.png",
  },
  {
    title: "Account & Recommendation",
    text: "Manage your personal information, update preferences, or understand how mood matching and personalized recommendations work.",
    icon: CircleUser,
  },
  {
    title: "Streaming Services",
    text: "Connect, disconnect, and troubleshoot your Netflix, Prime, Disney+, Crave, Apple TV+, and other accounts.",
    icon: Monitor,
  },
  {
    title: "Privacy & Terms of Use",
    text: "Understand your privacy settings, resolve login problems, display issues, and other technical difficulties.",
    icon: LockKeyhole,
  },
];

const faqs = [
  {
    question:
      "What is Cineri and how is it different from the streaming platforms I already use?",
    answer:
      "Cineri is a discovery companion that helps you decide what to watch across your streaming services. It does not replace Netflix, Disney+, Prime Video, or other providers; it brings your preferences, moods, and available services together in one place.",
  },
  {
    question: "Do I need a paid subscription to use Cineri?",
    answer:
      "For now, you can create an account and use Cineri's core discovery features without a paid Cineri subscription. You may still need an active subscription with a streaming provider to watch content on that provider.",
  },
  {
    question: "How do I set up my taste profile during onboarding?",
    answer:
      "During onboarding, choose the genres, moods, content types, and streaming services that fit you best. You can change these choices later from your profile preferences.",
  },
  {
    question: "Can I use Cineri without connecting any streaming services?",
    answer:
      "Yes. You can browse and receive recommendations without connecting a service. Connecting services simply helps Cineri prioritize titles that are easier for you to watch.",
  },
  {
    question: "How do I change my email address or password?",
    answer:
      "Open your profile settings to update supported account information. Password changes are available for credential-based accounts; social-login accounts are managed through their login provider.",
  },
  {
    question: "How do I delete my account and all my data?",
    answer:
      "Open Settings, choose Delete Account, and confirm the request. This action should permanently remove your profile and related account data, so it cannot be undone.",
  },
  {
    question: "Does Cineri store my streaming service login credentials?",
    answer:
      "Cineri should not store the password you use for a streaming provider. The connected-services feature records your selected providers and, when an official connection is available, should use secure authorization tokens instead of your password.",
  },
  {
    question: "Which streaming platforms does Cineri support?",
    answer:
      "The current experience includes major services such as Netflix, Disney+, Prime Video, Crave, and Apple TV+. The exact list can grow as additional platform data is added.",
  },
  {
    question: "How does Cineri's mood matching actually work?",
    answer:
      "Cineri compares your selected mood with mood tags assigned to movies and shows, then combines that match with your genres, content preferences, and available streaming services.",
  },
  {
    question: "My recommendations feel off. How do I reset or retrain my profile?",
    answer:
      "Update your genres, moods, content types, and streaming services in Preferences. Rating titles and marking what you watched can also give the recommendation system better signals over time.",
  },
  {
    question: "Why does the same title keep appearing in my recommendations?",
    answer:
      "This can happen when a title strongly matches several of your preferences or when the available catalogue is limited. Removing it from consideration, rating it, or adjusting your preferences should reduce repeated suggestions.",
  },
];

const topicOptions = [
  "Getting started",
  "Account & recommendation",
  "Streaming services",
  "Privacy & terms of use",
  "Technical issue",
  "Other",
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFaqs = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return faqs;

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(normalized) ||
        faq.answer.toLowerCase().includes(normalized),
    );
  }, [searchTerm]);

  const addFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const allowed = Array.from(incomingFiles).filter((file) => {
      const validType = [
        "image/png",
        "image/jpeg",
        "application/pdf",
        "text/plain",
      ].includes(file.type);

      return validType && file.size <= 10 * 1024 * 1024;
    });

    setFiles((current) => [...current, ...allowed].slice(0, 5));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const form = event.currentTarget;

  setIsSubmitting(true);
  setSubmitMessage("");

  const formData = new FormData(form);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        message: `Topic: ${topic}\nSubject: ${subject}\n\n${message}`,
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Unable to send your ticket.",
      );
    }

    form.reset();
    setFiles([]);
    setSubmitMessage("Your support ticket was sent successfully.");
  } catch (error) {
    setSubmitMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.",
    );
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="help-page">
      <section className="help-hero">
        <p className="help-kicker">HELP CENTER</p>
        <h1>
          Need help?
          <span>We&apos;re here for you!</span>
        </h1>
        <p className="help-hero-copy">
          Search our help articles, browse by topic, or reach our support team
          directly.
        </p>

        <label className="help-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search for articles, topics, or questions..."
          />
          <span className="help-search-button">SEARCH</span>
        </label>
      </section>

      <main className="help-main">
        <section className="help-topic-section">
          <div className="help-section-heading">
            <p>BROWSE BY TOPIC</p>
            <h2>What do you need help with?</h2>
          </div>

          <div className="help-topic-grid">
  {helpTopics.map((topic) => {
    const Icon = topic.icon;

    return (
      <article className="help-topic-card" key={topic.title}>
        <div className="help-topic-title-row">
          {typeof Icon === "string" ? (
            <Image
              src={Icon}
              alt=""
              width={25}
              height={25}
              className="help-topic-image-icon"
              aria-hidden="true"
            />
          ) : (
            <Icon size={25} aria-hidden="true" />
          )}

          <h3>{topic.title}</h3>
        </div>

        <p>{topic.text}</p>
        <a href="#help-faq">READ THIS TOPIC</a>
      </article>
    );
  })}
</div>
        </section>

        <section className="help-faq-section" id="help-faq">
          <div className="help-section-heading help-faq-heading">
            <p>FAQ</p>
            <h2>
              Frequently asked questions
              <span>and answers.</span>
            </h2>
          </div>

          <div className="help-question-list">
            {filteredFaqs.length ? (
              filteredFaqs.map((faq) => {
                const isOpen = openQuestion === faq.question;
                return (
                  <article
                    className={`help-question-item${isOpen ? " is-open" : ""}`}
                    key={faq.question}
                  >
                    <button
                      type="button"
                      className="help-question-row"
                      onClick={() =>
                        setOpenQuestion(isOpen ? null : faq.question)
                      }
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <span className="help-question-chevron">
                        <ChevronDown size={14} aria-hidden="true" />
                      </span>
                    </button>
                    {isOpen && <p className="help-question-answer">{faq.answer}</p>}
                  </article>
                );
              })
            ) : (
              <p className="help-no-results">
                No matching help articles were found. Try another search.
              </p>
            )}
          </div>
        </section>

        <section className="help-support-section">
          <div className="help-section-heading help-support-heading">
            <p>SUPPORT TEAM</p>
            <h2>
              Still need help?
              <span>Send us a message</span>
            </h2>
            <p className="help-support-copy">
              Fill out the form below and we&apos;ll get back to you within 2
              business days.
            </p>
          </div>

          <form className="help-ticket-card" onSubmit={handleSubmit}>
            <header className="help-ticket-header">
              <h3>New support ticket</h3>
              <p>
                All fields marked with <span>*</span> are required. Ticket
                reference will be emailed to you on submission.
              </p>
            </header>

            <div className="help-ticket-body">
              <div className="help-form-grid">
                <label>
                  <span>FULL NAME *</span>
                  <div className="help-input-wrap">
                    <CircleUserRound size={14} />
                    <input name="name" type="text" placeholder="Alex Kim" required />
                  </div>
                </label>

                <label>
                  <span>EMAIL ADDRESS *</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="alex@email.com"
                    required
                  />
                </label>

                <label>
                  <span>TOPIC *</span>
                  <select name="topic" defaultValue="" required>
                    <option value="" disabled>
                      Select a topic...
                    </option>
                    {topicOptions.map((topic) => (
                      <option value={topic} key={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>SUBJECT *</span>
                  <input
                    name="subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    required
                  />
                </label>
              </div>

              <label className="help-description-field">
                <span>DESCRIPTION *</span>
                <textarea
                  name="message"
                  maxLength={1000}
                  placeholder="Tell us everything — the more detail, the faster we can help. Include any error messages, steps to reproduce, and what you expected to happen."
                  required
                />
                <small>Be as specific as possible</small>
              </label>

              <div className="help-attachment-block">
                <div className="help-attachment-label">
                  <span>ATTACHMENTS</span>
                  <small>OPTIONAL</small>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".png,.jpg,.jpeg,.pdf,.txt"
                  onChange={(event) => addFiles(event.target.files)}
                />
                <button
                  type="button"
                  className="help-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    addFiles(event.dataTransfer.files);
                  }}
                >
                  <span className="help-upload-icon">
                    <Upload size={17} />
                  </span>
                  <strong>Drop files here or click to upload</strong>
                  <small>
                    Screenshots, screen recordings, or log files help us
                    diagnose faster
                  </small>
                  <small>PNG, JPG, GIF, PDF, TXT · Max 10MB each · up to 5 files</small>
                </button>

                {files.length > 0 && (
                  <div className="help-selected-files">
                    {files.map((file) => (
                      <span key={`${file.name}-${file.lastModified}`}>
                        <Paperclip size={12} /> {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <footer className="help-ticket-footer">
              <p>
                <LockKeyhole size={12} /> Your information is handled under our
                <a href="/privacy">Privacy Policy</a>. We never share support
                tickets with third parties.
              </p>
              <button type="submit" disabled={isSubmitting}>
                <Send size={13} />
                {isSubmitting ? "SENDING..." : "SEND TICKET"}
              </button>
            </footer>

            {submitMessage && (
              <p className="help-submit-message" role="status">
                {submitMessage}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}