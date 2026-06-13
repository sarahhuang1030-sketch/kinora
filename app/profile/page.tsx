"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState,Suspense } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";

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
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email");
  const email = emailFromUrl || session?.user?.email;
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

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch(`/api/profile?email=${email}`);
      const data = await res.json();
      setUser(data.user);
      setEditUser(data.user);
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

  function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) return digits;

  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

  return (
    <>
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <h1>My Profile</h1>

          {user && (
            <>
              {user && !isEditingProfile && (
  <>
    <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
    <p><strong>Username:</strong> {user.username}</p>
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Phone:</strong> {user.phone || "Not added"}</p>

    <button onClick={() => setIsEditingProfile(true)}>
      Edit Profile
    </button>
  </>
)}

{user && isEditingProfile && editUser && (
  <>
    <input
      value={editUser.first_name}
      onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
      placeholder="First Name"
    />

    <input
      value={editUser.last_name}
      onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
      placeholder="Last Name"
    />

    <input
      value={editUser.username}
      onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
      placeholder="Username"
    />

    <input
  value={editUser.phone || ""}
  onChange={(e) =>
    setEditUser({
      ...editUser,
      phone: formatPhoneNumber(e.target.value),
    })
  }
  placeholder="Phone"
/>

    <button
      onClick={async () => {
  const nameRegex = /^[A-Za-z]{2,}$/;
  const usernameRegex = /^[A-Za-z0-9_]{3,}$/;
  const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;

  if (!nameRegex.test(editUser.first_name.trim())) {
    alert("First name must be at least 2 letters.");
    return;
  }

  if (!nameRegex.test(editUser.last_name.trim())) {
    alert("Last name must be at least 2 letters.");
    return;
  }

  if (!usernameRegex.test(editUser.username.trim())) {
    alert("Username must be at least 3 characters and can only use letters, numbers, or underscore.");
    return;
  }

  if (editUser.phone && !phoneRegex.test(editUser.phone)) {
    alert("Phone number must be in this format: (403) 123-4567");
    return;
  }

  const cleanedUser = {
    ...editUser,
    first_name: editUser.first_name.trim(),
    last_name: editUser.last_name.trim(),
    username: editUser.username.trim(),
    phone: editUser.phone.trim(),
  };

  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanedUser),
  });

  if (!res.ok) {
    alert("Could not update profile.");
    return;
  }

  setUser(cleanedUser);
  setIsEditingProfile(false);
}}
    >
      Save Profile
    </button>

    <button
      onClick={() => {
        setEditUser(user);
        setIsEditingProfile(false);
      }}
    >
      Cancel
    </button>
  </>
)}

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