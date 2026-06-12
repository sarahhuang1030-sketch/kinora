"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
};

type Answers = {
  genres: string[];
  streamingServices: string[];
  contentTypes: string[];
  preferences: string[];
};

type GenreOption = { genre_name: string };
type StreamingServiceOption = { platform_name: string };
type ContentTypeOption = { type_name: string };

type Section = "genres" | "streamingServices" | "contentTypes" | "preferences";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const isNewUser = searchParams.get("newUser") === "true";

  const [user, setUser] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    genres: [],
    streamingServices: [],
    contentTypes: [],
    preferences: [],
  });

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<Section | null>(null);
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch(`/api/profile?email=${email}`);
      const data = await res.json();

      setUser(data.user);

      if (data.answers) {
        setAnswers(data.answers);
      }
    }

    if (email) loadUser();
  }, [email]);

 useEffect(() => {
  if (isNewUser && user && !hasStartedOnboarding) {
    const timer = setTimeout(() => {
      setOnboardingStep("genres");
      setHasStartedOnboarding(true);
    }, 0);

    return () => clearTimeout(timer);
  }
}, [isNewUser, user, hasStartedOnboarding]);
  function goToNextOnboardingStep() {
    if (onboardingStep === "genres") {
      setOnboardingStep("streamingServices");
    } else if (onboardingStep === "streamingServices") {
      setOnboardingStep("contentTypes");
    } else if (onboardingStep === "contentTypes") {
      setOnboardingStep("preferences");
    } else {
      setOnboardingStep(null);
    }
  }

  return (
    <>
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <h1>My Profile</h1>

          {user && (
            <>
              <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || "Not added"}</p>

              <hr style={{ margin: "24px 0" }} />

              <h2>My Preferences</h2>

              <p><strong>Genres:</strong> {answers.genres.length ? answers.genres.join(", ") : "Not answered yet"}</p>
              <button onClick={() => setEditingSection("genres")}>Edit Genres</button>

              <p><strong>Streaming Services:</strong> {answers.streamingServices.length ? answers.streamingServices.join(", ") : "Not answered yet"}</p>
              <button onClick={() => setEditingSection("streamingServices")}>Edit Services</button>

              <p><strong>Content Type:</strong> {answers.contentTypes.length ? answers.contentTypes.join(", ") : "Not answered yet"}</p>
              <button onClick={() => setEditingSection("contentTypes")}>Edit Content Type</button>

              <p><strong>What Matters Most:</strong> {answers.preferences.length ? answers.preferences.join(", ") : "Not answered yet"}</p>
              <button onClick={() => setEditingSection("preferences")}>Edit Matters</button>
            </>
          )}
        </div>
      </div>

      {onboardingStep && user && (
        <div className="modal-backdrop open">
          <div className="modal feeling-modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Let’s personalize your profile</h2>
                <p className="modal-subtitle">
                  Answer a few quick questions so we can recommend better movies and shows.
                </p>
              </div>

              <button className="modal-close" onClick={() => setOnboardingStep(null)}>
                ✕
              </button>
            </div>

            <EditPreferenceModal
              userId={user.user_id}
              section={onboardingStep}
              answers={answers}
              onClose={goToNextOnboardingStep}
              onSaved={(savedAnswers) => setAnswers(savedAnswers)}
              buttonText={onboardingStep === "preferences" ? "Finish" : "Continue →"}
            />
          </div>
        </div>
      )}

      {editingSection && user && (
        <div className="modal-backdrop open">
          <div className="modal feeling-modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit Preferences</h2>
                <p className="modal-subtitle">
                  Update this section anytime if your taste changes.
                </p>
              </div>

              <button className="modal-close" onClick={() => setEditingSection(null)}>
                ✕
              </button>
            </div>

            <EditPreferenceModal
              userId={user.user_id}
              section={editingSection}
              answers={answers}
              onClose={() => setEditingSection(null)}
              onSaved={(savedAnswers) => setAnswers(savedAnswers)}
              buttonText="Save"
            />
          </div>
        </div>
      )}
    </>
  );
}

function EditPreferenceModal({
  userId,
  section,
  answers,
  onClose,
  onSaved,
  buttonText = "Save",
}: {
  userId: number;
  section: Section;
  answers: Answers;
  onClose: () => void;
  onSaved: (answers: Answers) => void;
  buttonText?: string;
}) {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(answers[section]);

 useEffect(() => {
  const timer = setTimeout(() => {
    setSelected(answers[section]);
  }, 0);

  return () => clearTimeout(timer);
}, [answers, section]);


  useEffect(() => {
    async function loadOptions() {
      if (section === "preferences") {
        setOptions(["Cast", "Director", "Reviews/Rating", "Year of release", "Duration", "Other"]);
        return;
      }

      const url =
        section === "genres"
          ? "/api/genres"
          : section === "streamingServices"
          ? "/api/streaming-services"
          : "/api/content-types";

      const res = await fetch(url);
      const data = await res.json();

      if (section === "genres") {
        setOptions(data.map((item: GenreOption) => item.genre_name));
      }

      if (section === "streamingServices") {
        setOptions(data.map((item: StreamingServiceOption) => item.platform_name));
      }

      if (section === "contentTypes") {
        setOptions(data.map((item: ContentTypeOption) => item.type_name));
      }
    }

    loadOptions();
  }, [section]);

  const title =
    section === "genres"
      ? "Which genres do you prefer?"
      : section === "streamingServices"
      ? "Which streaming services are you currently using?"
      : section === "contentTypes"
      ? "What is your preferred content type?"
      : "What matters to you the most?";

  function toggleOption(item: string) {
    setSelected((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  async function saveSection() {
    const updatedAnswers = {
      ...answers,
      [section]: selected,
    };

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updatedAnswers }),
    });

    if (!res.ok) {
      alert("Could not save your answers.");
      return;
    }

    onSaved(updatedAnswers);
    onClose();
  }

  return (
    <>
      <h3>{title}</h3>

      <div className="modal-grid" style={{ margin: "20px" }}>
        {options.map((item) => (
          <button
            key={item}
            type="button"
            className={`choice ${selected.includes(item) ? "active" : ""}`}
            onClick={() => toggleOption(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="modal-footer">
        <button className="btn-back" onClick={onClose}>
          {buttonText === "Save" ? "Cancel" : "Skip"}
        </button>

        <button className="btn-next" onClick={saveSection}>
          {buttonText}
        </button>
      </div>
    </>
  );
}