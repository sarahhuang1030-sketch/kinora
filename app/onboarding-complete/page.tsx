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
    preferences: [],
  });
 


  useEffect(() => {
    async function loadUser() {
      if (!email) return;

      try {
        const res = await fetch(`/api/profile?email=${email}`);
        const data = await res.json();

        setUser(data.user);

        if (data.answers) {
          setAnswers({
              genres: unique(data.answers.genres || []),
              streamingServices: unique(data.answers.streamingServices || []),
              contentTypes: unique(data.answers.contentTypes || []),
              preferences: unique(data.answers.preferences || []),
            });
        }

        if (data.user?.user_id) {
  const servicesRes = await fetch(
    `/api/connect-service/list?userId=${data.user.user_id}`
  );

  const servicesData = await servicesRes.json();

  const profileServices = unique(data.answers?.streamingServices || []);
  const connectedServices = unique(servicesData.services || []);

  setAnswers((prev) => ({
    ...prev,
    streamingServices:
      profileServices.length > 0 ? profileServices : connectedServices,
  }));
}
      } catch (error) {
        console.error("LOAD ONBOARDING COMPLETE ERROR:", error);
      }
    }

    loadUser();
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

  function editProfile() {
    router.push("/profile");
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
            onEdit={editProfile}
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
  onEdit={editProfile}
/>



          <CompleteRow
            color="account"
            title="Account details"
            text={user?.email || "Loading account..."}
            onEdit={editProfile}
          />

         <CompleteOpenRow
  color="content"
  title="What matters most"
  countText={`${answers.preferences.length} selected`}
  items={answers.preferences}
  onEdit={editProfile}
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