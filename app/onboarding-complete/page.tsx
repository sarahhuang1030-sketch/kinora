"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FaBolt,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaPlay,
} from "react-icons/fa";

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  country?: string;
  date_of_birth?: string;
};

type Answers = {
  genres: string[];
  streamingServices: string[];
  contentTypes: string[];
  preferences: string[];
};

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const isSocialNewUser = searchParams.get("socialNewUser") === "true";
  const emailFromUrl = searchParams.get("email");
  const email = emailFromUrl || session?.user?.email;

  const [user, setUser] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    genres: [],
    streamingServices: [],
    contentTypes: [],
    preferences: [],
  });

  useEffect(() => {
    async function loadUser() {
      if (!email) return;

      const res = await fetch(`/api/profile?email=${email}`);
      const data = await res.json();

      setUser(data.user);

      if (data.answers) {
        setAnswers(data.answers);
      }
    }

    loadUser();
  }, [email]);

  return (
    <main className="complete-page">
      <section className="complete-card">
        <div className="complete-badge">✓ Setup Complete</div>

        <h1 className="complete-title">
          Your profile,
          <span>ready to go.</span>
        </h1>

        <p className="complete-subtitle">
          Everything looks great! Review your choices below — tap any section to
          edit before we launch your personalised Cineri.
        </p>

        <div className="complete-sections">
          <CompleteOpenRow
            color="genre"
            title="Favourite genres"
            countText={`${answers.genres.length} selected`}
            items={answers.genres}
          />

          <CompleteRow
            color="streaming"
            title="Streaming services"
            text={
              answers.streamingServices.length
                ? `${answers.streamingServices.length} selected`
                : "Not answered yet"
            }
          />

          <CompleteRow
            color="content"
            title="Content preference"
            text={
              answers.contentTypes.length
                ? answers.contentTypes.join(", ")
                : "Not answered yet"
            }
          />

          <CompleteRow
            color="account"
            title="Account details"
            text={user?.email || "Loading account..."}
          />

          <CompleteRow
            color="content"
            title="What matters most"
            text={
              answers.preferences.length
                ? answers.preferences.join(", ")
                : "Not answered yet"
            }
          />
        </div>

        <div className="complete-ready-bar">
          <div>
            <FaBolt />
            <span>Your personalized picks are ready!</span>
          </div>
          <strong>247 matches found</strong>
        </div>

        <button
          type="button"
          className="complete-launch-btn"
          onClick={() =>
            router.push(
              isSocialNewUser ? "/profile?socialNewUser=true" : "/profile"
            )
          }
        >
          <FaPlay />
          Launch Cineri
        </button>

        <p className="complete-footer-text">
          <FaLock /> Your data is encrypted ·{" "}
          <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms</a>
        </p>
      </section>
    </main>
  );
}

function CompleteOpenRow({
  color,
  title,
  countText,
  items,
}: {
  color: string;
  title: string;
  countText: string;
  items: string[];
}) {
  return (
    <div className="complete-section open">
      <div className="complete-section-top">
        <div className="complete-section-left">
          <div className={`complete-square ${color}`}></div>
          <div>
            <strong>{title}</strong>
            <p>{items.length ? countText : "Not answered yet"}</p>
          </div>
        </div>

        <div className="complete-section-action">
          <button type="button">Edit</button>
          <FaChevronDown />
        </div>
      </div>

      <div className="complete-tags">
        {items.length ? (
          items.map((item) => <span key={item}>{item}</span>)
        ) : (
          <span>Not answered yet</span>
        )}
      </div>
    </div>
  );
}

function CompleteRow({
  color,
  title,
  text,
}: {
  color: string;
  title: string;
  text: string;
}) {
  return (
    <div className="complete-section">
      <div className="complete-section-top">
        <div className="complete-section-left">
          <div className={`complete-square ${color}`}></div>
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>

        <div className="complete-section-action">
          <button type="button">Edit</button>
          <FaChevronUp />
        </div>
      </div>
    </div>
  );
}