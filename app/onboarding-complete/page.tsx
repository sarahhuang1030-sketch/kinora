"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  excludedContentTypes: string[];
  contentTypes: string[];
  preferences: string[];
};

function unique(items: string[] = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

export default function OnboardingCompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingCompleteContent />
    </Suspense>
  );
}

function OnboardingCompleteContent() {
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
    excludedContentTypes: [],
    preferences: [],
  });
 


 useEffect(() => {
  async function loadUser() {
    if (!email) return;

    try {
      const profileResponse = await fetch(
        `/api/profile?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.error || "Unable to load profile."
        );
      }

      setUser(profileData.user);

      const profileAnswers = profileData.answers || {};

      setAnswers({
        genres: unique(profileAnswers.genres || []),
        streamingServices: unique(
          profileAnswers.streamingServices || []
        ),
        contentTypes: unique(profileAnswers.contentTypes || []),
        excludedContentTypes: unique(
          profileAnswers.excludedContentTypes || []
        ),
        preferences: unique(profileAnswers.preferences || []),
      });

      if (profileData.user?.user_id) {
        const servicesResponse = await fetch(
          `/api/connect-service?userId=${encodeURIComponent(
            String(profileData.user.user_id)
          )}`,
          {
            cache: "no-store",
          }
        );

        const servicesData = await servicesResponse.json();

        if (!servicesResponse.ok) {
          throw new Error(
            servicesData.error ||
              "Unable to load connected services."
          );
        }

        setAnswers((current) => ({
          ...current,
          streamingServices: unique(
            servicesData.services || []
          ),
        }));
      }
    } catch (error) {
      console.error(
        "LOAD ONBOARDING COMPLETE ERROR:",
        error
      );
    }
  }

  void loadUser();
}, [email]);

  function editStreamingServices() {
    const query = new URLSearchParams();

    if (email) query.set("email", email);
    if (isSocialNewUser) query.set("socialNewUser", "true");
    if (user?.user_id) query.set("userId", String(user.user_id));

      const queryString = query.toString();

      router.push(
        queryString
          ? `/connect-streaming?${queryString}`
          : "/connect-streaming"
      );
        }

  function editRegisterSection(step: number) {
  const query = new URLSearchParams();

  query.set("editStep", String(step));

  if (email) {
    query.set("email", email);
  }

  if (isSocialNewUser) {
    query.set("socialNewUser", "true");
  }

  if (user?.user_id) {
    query.set(
      "userId",
      String(user.user_id)
    );
  }

  router.push(`/register?${query.toString()}`);
}

 return (
  <main className="complete-page">
    <div className="complete-page-shell">
      <OnboardingProgress
        preferenceProgress={100}
        detailsProgress={100}
        streamingProgress={100}
      />

      <section className="complete-card">
        {/* <div className="complete-badge">✓ Setup Complete</div> */}

        <h1 className="complete-title">
          Your profile is ready to go.
        </h1>

        <p className="complete-subtitle">
          Review your choices below. Tap any section to edit before we launch your personalized Cineri account.
        </p>

        <div className="complete-sections">
          <CompleteOpenRow
            color="genre"
            title="Favourite genres"
            countText={`${answers.genres.length} selected`}
            items={answers.genres}
            onEdit={() => editRegisterSection(1)}
          />

          <CompleteOpenRow
              color="streaming"
              title="Streaming services"
              countText={`${unique(answers.streamingServices).length} selected`}
              items={unique(answers.streamingServices)}
              onEdit={editStreamingServices}
            />

          <CompleteOpenRow
              color="content"
              title="Content preference"
              countText={`${answers.contentTypes.length} selected`}
              items={answers.contentTypes}
              onEdit={() => editRegisterSection(2)}
            />

          <CompleteOpenRow
              color="content"
              title="Don't want to see"
              countText={`${answers.excludedContentTypes.length} selected`}
              items={answers.excludedContentTypes}
              onEdit={() => editRegisterSection(2)}
            />

          <CompleteRow
            color="account"
            title="Account details"
            text={user?.email || "Loading account..."}
            onEdit={() => editRegisterSection(5)}
          />

         <CompleteOpenRow
  color="content"
  title="What matters most"
  countText={`${answers.preferences.length} selected`}
  items={answers.preferences}
  onEdit={() => editRegisterSection(3)}
/>
        </div>

        {/* <div className="complete-ready-bar">
          <div>
            <FaBolt />
            <span>Your personalized picks are ready!</span>
          </div>

          <strong>247 matches found</strong>
        </div> */}

        <button
          type="button"
          className="complete-launch-btn"
          onClick={() => router.push("/")}
        >
          <FaPlay />
          Launch Cineri
        </button>

        <p className="complete-footer-text">
          By continuing you agree to Cineri&apos;s
          <a href="/privacy"> Privacy Policy</a> and <a href="/terms">Terms</a>
        </p>
      </section>
      </div>
    </main>
  );
}

function CompleteOpenRow({
  color,
  title,
  countText,
  items,
  onEdit,
}: {
  color: string;
  title: string;
  countText: string;
  items: string[];
  onEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

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
  <button type="button" onClick={onEdit}>
    Edit
  </button>

  <button
    type="button"
    className="toggle-btn"
    onClick={() => setIsOpen(!isOpen)}
  >
    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
  </button>
</div>
      </div>

      {isOpen && (
        <div className="complete-tags">
          {items.length ? (
            items.map((item) => (
              <span key={item}>{item}</span>
            ))
          ) : (
            <span>Not answered yet</span>
          )}
        </div>
      )}
    </div>
  );
}

function CompleteRow({
  color,
  title,
  text,
  onEdit,
}: {
  color: string;
  title: string;
  text: string;
  onEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="complete-section">
      <div className="complete-section-top">
        <div className="complete-section-left">
          <div className={`complete-square ${color}`}></div>

          <div>
            <strong>{title}</strong>
            <p>{isOpen ? text : "Click arrow to view"}</p>
          </div>
        </div>

        <div className="complete-section-action">
          <button type="button" onClick={onEdit}>
            Edit
          </button>

          <button
            type="button"
            className="toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="complete-tags">
          <span>{text}</span>
        </div>
      )}
    </div>
  );
}

function OnboardingProgress({
  preferenceProgress,
  detailsProgress,
  streamingProgress,
}: {
  preferenceProgress: number;
  detailsProgress: number;
  streamingProgress: number;
}) {
  return (
    <div className="register-progress-wrapper">
      <div className="register-progress-lines">
        <ProgressSection progress={preferenceProgress} />
        <ProgressSection progress={detailsProgress} />
        <ProgressSection progress={streamingProgress} />
      </div>

      <div className="register-progress-labels">
        <span className={preferenceProgress > 0 ? "active" : ""}>
          
        </span>

        <span className={detailsProgress > 0 ? "active" : ""}>
       
        </span>

        <span className={streamingProgress > 0 ? "active" : ""}>
          
        </span>
      </div>
    </div>
  );
}

function ProgressSection({ progress }: { progress: number }) {
  return (
    <div className="progress-line-block">
      <div
        className="progress-line-fill"
        style={{
          width: `${Math.min(Math.max(progress, 0), 100)}%`,
        }}
      />
    </div>
  );
}