"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FaChevronDown,
  FaChevronUp,
  FaClapperboard,
  FaPlay,
  FaRegUser,
  FaTv,
  FaBolt
} from "react-icons/fa6";
import { LuPopcorn } from "react-icons/lu";

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

  const isSocialNewUser =
    searchParams.get("socialNewUser") === "true";

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

          contentTypes: unique(
            profileAnswers.contentTypes || []
          ),

          excludedContentTypes: unique(
            profileAnswers.excludedContentTypes || []
          ),

          preferences: unique(
            profileAnswers.preferences || []
          ),
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

  const profileServices = unique(
    profileAnswers.streamingServices || []
  );

  const connectedServices = unique(
    servicesData.services || []
  );

  setAnswers((current) => ({
    ...current,

    // Use database connected services when available.
    // Otherwise keep the services returned by /api/profile.
    streamingServices:
      connectedServices.length > 0
        ? connectedServices
        : profileServices,
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

    if (email) {
      query.set("email", email);
    }

    if (isSocialNewUser) {
      query.set("socialNewUser", "true");
    }

    if (user?.user_id) {
      query.set("userId", String(user.user_id));
    }

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
      query.set("userId", String(user.user_id));
    }

    router.push(`/register?${query.toString()}`);
  }

  const streamingServices = unique(
    answers.streamingServices
  );

  const contentPreferenceCount =
    answers.contentTypes.length +
    answers.excludedContentTypes.length;
   
  return (
    <main className="complete-page">
      <div className="complete-page-shell">
        <section className="complete-card">
          <h1 className="complete-title">
            Your profile is{" "}
            <span>ready to go!</span>
          </h1>

          <p className="complete-subtitle">
            Review your choices below.
            <br />
            Tap any section to edit before we launch your
            personalized Cineri account.
          </p>

          <div className="complete-sections">
            <CompleteOpenRow
              icon={<LuPopcorn />}
              title="Favourite genres"
              countText={`${answers.genres.length} selected`}
              items={answers.genres}
              onEdit={() => editRegisterSection(1)}
              defaultOpen
            />

            <ContentPreferenceRow
  icon={<FaClapperboard />}
  countText={`${contentPreferenceCount} selected`}
  contentTypes={answers.contentTypes}
  excludedContentTypes={answers.excludedContentTypes}
  onEdit={() => editRegisterSection(2)}
/>

<CompleteOpenRow
  icon={<FaBolt />}
  title="What matters most"
  countText={`${answers.preferences.length} selected`}
  items={answers.preferences}
  onEdit={() => editRegisterSection(3)}
/>

<CompleteAccountRow
  icon={<FaRegUser />}
  title="Account details"
  text={user?.email || "Loading account..."}
  onEdit={() => editRegisterSection(5)}
/>

            <CompleteOpenRow
              icon={<FaTv />}
              title="Streaming services"
              countText={`${streamingServices.length} connected`}
              items={streamingServices}
              onEdit={editStreamingServices}
            />
          </div>

          <button
            type="button"
            className="complete-launch-btn"
            onClick={() => router.push("/")}
          >
            <FaPlay />
            Launch my Cineri account
          </button>

          <p className="complete-footer-text">
            By continuing you agree to Cineri&apos;s{" "}
            <a href="/terms">Terms of Service</a> and{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

function CompleteOpenRow({
  icon,
  title,
  countText,
  items,
  onEdit,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  countText: string;
  items: string[];
  onEdit: () => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`complete-section ${
        isOpen ? "open" : ""
      }`}
    >
      <button
        type="button"
        className="complete-section-top"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="complete-section-left">
          <div className="complete-section-icon">
            {icon}
          </div>

          <div>
            <strong>{title}</strong>
            <p>
              {items.length
                ? countText
                : "Not answered yet"}
            </p>
          </div>
        </div>

        <span className="complete-chevron">
          {isOpen ? (
            <FaChevronUp />
          ) : (
            <FaChevronDown />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="complete-section-content">
          <button
            type="button"
            className="complete-edit-button"
            onClick={onEdit}
          >
            Edit
          </button>

          <div className="complete-tags">
            {items.length ? (
              items.map((item) => (
                <span key={item}>{item}</span>
              ))
            ) : (
              <p className="complete-empty-text">
                Not answered yet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentPreferenceRow({
  icon,
  countText,
  contentTypes,
  excludedContentTypes,
  onEdit,
}: {
  icon: React.ReactNode;
  countText: string;
  contentTypes: string[];
  excludedContentTypes: string[];
  onEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`complete-section ${
        isOpen ? "open" : ""
      }`}
    >
      <button
        type="button"
        className="complete-section-top"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="complete-section-left">
          <div className="complete-section-icon">
            {icon}
          </div>

          <div>
            <strong>Content preference</strong>
            <p>{countText}</p>
          </div>
        </div>

        <span className="complete-chevron">
          {isOpen ? (
            <FaChevronUp />
          ) : (
            <FaChevronDown />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="complete-section-content">
          <button
            type="button"
            className="complete-edit-button"
            onClick={onEdit}
          >
            Edit
          </button>

          <PreferenceGroup
            title="Want to see"
            items={contentTypes}
          />

          <PreferenceGroup
            title="Don’t want to see"
            items={excludedContentTypes}
            excluded
          />
        </div>
      )}
    </div>
  );
}

function PreferenceGroup({
  title,
  items,
  excluded = false,
}: {
  title: string;
  items: string[];
  excluded?: boolean;
}) {
  return (
    <div className="complete-preference-group">
      <div className="complete-preference-heading">
        <strong>{title}</strong>

        <span>
          {items.length} selected
        </span>
      </div>

      <div
        className={`complete-tags ${
          excluded ? "excluded" : ""
        }`}
      >
        {items.length ? (
          items.map((item) => (
            <span key={item}>{item}</span>
          ))
        ) : (
          <p className="complete-empty-text">
            Not answered yet
          </p>
        )}
      </div>
    </div>
  );
}

function CompleteAccountRow({
  icon,
  title,
  text,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`complete-section ${
        isOpen ? "open" : ""
      }`}
    >
      <button
        type="button"
        className="complete-section-top"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="complete-section-left">
          <div className="complete-section-icon">
            {icon}
          </div>

          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>

        <span className="complete-chevron">
          {isOpen ? (
            <FaChevronUp />
          ) : (
            <FaChevronDown />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="complete-section-content">
          <button
            type="button"
            className="complete-edit-button"
            onClick={onEdit}
          >
            Edit
          </button>

          <div className="complete-account-value">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}