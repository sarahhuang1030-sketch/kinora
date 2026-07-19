"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

type AnswerCategory =
  | "genres"
  | "contentTypes"
  | "excludedContentTypes"
  | "preferences";

type GenreOption = {
  genre_name: string;
  genre_icon: string;
  genre_color: string;
};
type ContentTypeOption = {
  type_name: string;
  content_icon: string;
  description: string;
};
type PreferenceOption = {
  factor_name: string;
  factor_icon: string;
  factor_description: string;
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageLoading />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageLoading() {
  return (
    <main className="register-page">
      <div className="register-shell">
        <section className="register-card">
          <p className="register-subtitle">
            Loading registration page...
          </p>
        </section>
      </div>
    </main>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
const editStepFromUrl = Number(
  searchParams.get("editStep")
);

const editUserId = searchParams.get("userId");
const editEmail = searchParams.get("email");

const isEditMode =
  [1, 2, 3, 5].includes(editStepFromUrl) &&
  Boolean(editUserId);

 const [step, setStep] = useState(() => {
  const allowedSteps = [1, 2, 3, 5];

  return allowedSteps.includes(editStepFromUrl)
    ? editStepFromUrl
    : 0;
});

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [answers, setAnswers] = useState({
    genres: [] as string[],
    contentTypes: [] as string[],
    excludedContentTypes: [] as string[],
    preferences: [] as string[],
  });

  const [genreOptions, setGenreOptions] = useState<GenreOption[]>([]);
  const [contentTypeOptions, setContentTypeOptions] = useState<ContentTypeOption[]>([]);
 const [preferenceOptions, setPreferenceOptions] =
  useState<PreferenceOption[]>([]);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");

  
 const personalDetailFields = isEditMode
  ? [
      firstName,
      lastName,
      email,
      username,
      phone,
      dateOfBirth,
      country,
    ]
  : [
      firstName,
      lastName,
      email,
      username,
      phone,
      dateOfBirth,
      country,
      password,
      confirmPassword,
    ];


const completedPersonalDetailFields = personalDetailFields.filter(
  (field) => field.trim() !== ""
).length;

const personalDetailsProgress =
  (completedPersonalDetailFields / personalDetailFields.length) * 100;

  useEffect(() => {
    async function loadOptions() {
      const genreRes = await fetch("/api/genres");
      const genreData = await genreRes.json();
      setGenreOptions(
        genreData.map(
          (item: {
            genre_name: string;
            genre_icon: string;
            genre_color: string;
          }) => ({
            genre_name: item.genre_name,
            genre_icon: item.genre_icon,
            genre_color: item.genre_color,
          })
        )
      );

      const contentRes = await fetch("/api/content-types");
      const contentData = await contentRes.json();
      setContentTypeOptions(
        contentData.map((item: { type_name: string; content_icon: string; description: string }) => ({
          type_name: item.type_name,
          content_icon: item.content_icon,
          description: item.description,
        }))
      );

      const preferenceRes = await fetch("/api/recommendation-factors");
      const preferenceData = await preferenceRes.json();

      setPreferenceOptions(
        preferenceData.map(
          (item: { factor_name: string; factor_icon: string; factor_description: string; }) => ({
            factor_name: item.factor_name,
            factor_icon: item.factor_icon,
            factor_description: item.factor_description,
          })
        )
      );
    }

    loadOptions();
  }, []);

  useEffect(() => {
  async function loadExistingProfile() {
    if (!isEditMode || !editEmail) {
      return;
    }

    try {
      const response = await fetch(
        `/api/profile?email=${encodeURIComponent(
          editEmail
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load existing profile."
        );
      }

      const existingAnswers =
        data.answers || {};

      setAnswers({
        genres: Array.isArray(
          existingAnswers.genres
        )
          ? existingAnswers.genres
          : [],

        contentTypes: Array.isArray(
          existingAnswers.contentTypes
        )
          ? existingAnswers.contentTypes
          : [],

        excludedContentTypes:
          Array.isArray(
            existingAnswers.excludedContentTypes
          )
            ? existingAnswers.excludedContentTypes
            : [],

        preferences: Array.isArray(
          existingAnswers.preferences
        )
          ? existingAnswers.preferences
          : [],
      });

      const existingUser = data.user;

      if (existingUser) {
        setFirstName(
          existingUser.first_name || ""
        );

        setLastName(
          existingUser.last_name || ""
        );

        setUsername(
          existingUser.username || ""
        );

        setEmail(
          existingUser.email || editEmail
        );

        setPhone(
          existingUser.phone || ""
        );

        setCountry(
          existingUser.country || ""
        );

        setDateOfBirth(
          existingUser.date_of_birth
            ? String(
                existingUser.date_of_birth
              ).slice(0, 10)
            : ""
        );
      }
    } catch (error) {
      console.error(
        "LOAD EXISTING PROFILE ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your existing selections."
      );
    }
  }

  void loadExistingProfile();
}, [isEditMode, editEmail]);

  const toggleAnswer = (category: AnswerCategory, value: string) => {
    setAnswers((prev) => {
      let current = [...prev[category]];

      if (category === "contentTypes") {
        if (value === "No Preference") {
          current = ["No Preference"];
        } else {
          current = current.filter((v) => v !== "No Preference");
          current = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        }
      } else {
        current = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
      }

      return {
        ...prev,
        [category]: current,
      };
    });
  };

function savePendingAnswers() {
  localStorage.setItem(
    "pendingOnboardingAnswers",
    JSON.stringify({
      genres: answers.genres,
      streamingServices: [],
      contentTypes: answers.contentTypes,
      excludedContentTypes: answers.excludedContentTypes,
      preferences: answers.preferences,
    })
  );
}

  function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length < 4) return digits;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }


async function saveEditedPreferences() {
  if (!editUserId) {
    setError("Missing user information.");
    return;
  }

  setError("");

  try {
    const response = await fetch(
      "/api/onboarding",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: Number(editUserId),
          genres: answers.genres,
          contentTypes: answers.contentTypes,
          excludedContentTypes: answers.excludedContentTypes,
          preferences: answers.preferences,
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Unable to save your changes."
      );
    }

    const query = new URLSearchParams();

    if (editEmail) {
      query.set("email", editEmail);
    }

    query.set(
      "userId",
      String(editUserId)
    );

    router.push(
      `/onboarding-complete?${query.toString()}`
    );
  } catch (error) {
    console.error(
      "SAVE EDITED PREFERENCES ERROR:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to save your changes."
    );
  }
}

async function handleAccountUpdate(
  e: React.FormEvent
) {
  e.preventDefault();
  setError("");

  if (!editUserId) {
    setError("Missing user information.");
    return;
  }

  try {
    const response = await fetch(
      "/api/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
       body: JSON.stringify({
  userId: Number(editUserId),
  user_id: Number(editUserId),

  firstName,
  first_name: firstName,

  lastName,
  last_name: lastName,

  username,
  email,
  phone,
  country,

  dateOfBirth,
  date_of_birth: dateOfBirth,
}),
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Unable to update account details."
      );
    }

    const query =
      new URLSearchParams();

    if (email) {
      query.set("email", email);
    }

    query.set(
      "userId",
      String(editUserId)
    );

    router.push(
      `/onboarding-complete?${query.toString()}`
    );
  } catch (error) {
    console.error(
      "UPDATE ACCOUNT ERROR:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to update account details."
    );
  }
}

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
  setError("Passwords do not match.");
  return;
}



if (
  !firstName ||
  !lastName ||
  !username ||
  !email ||
  !phone ||
  !country ||
  !dateOfBirth ||
  !password ||
  !confirmPassword
) {
  setError("Please fill in all fields.");
  return;
}

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        phone,
        firstName,
        lastName,
        country,
        dateOfBirth,
      }),
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      alert("Server error. Check VS Code terminal.");
      return;
    }

    if (!res.ok) {
      setError(data.message || "Registration failed");
      return;
    }

    const newUserId = data.userId || data.user_id;

    const onboardingRes = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
          userId: newUserId,
          genres: answers.genres,
          streamingServices: [],
          contentTypes: answers.contentTypes,
          excludedContentTypes: answers.excludedContentTypes,
          preferences: answers.preferences,
        }),
    });

    if (!onboardingRes.ok) {
      alert("Account created, but preferences could not be saved.");
      router.push(`/profile?email=${encodeURIComponent(email)}`);
      return;
    }

    const loginResult = await signIn("credentials", {
      redirect: false,
      login: email,
      password,
    });

    if (loginResult?.ok) {
  const nextUrl = `/connect-streaming?userId=${newUserId}&email=${encodeURIComponent(email)}`;
  console.log("GOING TO:", nextUrl);
  window.location.href = nextUrl;
} else {
  alert("Registration successful! Happy Exploring.");
  router.push("/");
}
  }

  return (
    <main className="register-page">
      <div className="register-shell">
        {step > 0 && (
        <ProgressBar
          step={step}
          personalDetailsProgress={personalDetailsProgress}
        />
      )}

        <section className="register-card">
          {step === 0 && (
            <>
              <div className="step-eyebrow">New Account</div>

              <h1>Create an account</h1>
              <p className="register-subtitle">Here&apos;s how it works:</p>

              <div className="onboarding-list">
                <InfoRow
                  number="1"
                  title="Tell us your watch preferences"
                  subtitle="3 questions"
                />
                <InfoRow
                  number="2"
                  title="Add your personal details"
                  subtitle="Name, date of birth, country, email and password"
                />
                <InfoRow
                  number="3"
                  title="Add your streaming services"
                  subtitle="Link streaming services"
                />
               
              </div>

              <button className="primary-btn" onClick={() => setStep(1)}>
                Let&apos;s get started
              </button>

              <p className="register-login-link">Already have an account?</p>

              <button className="login-btn2" type="button">
                <a href="/login">Log in</a>
              </button>
            </>
          )}

          {step === 1 && (
            <QuestionStep
              stepNumber="1"
              eyebrow="QUESTION 1 of 3"
              title="Pick your favourite genres"
              subtitle="Choose as many as you like."
              label="Genres"
              options={genreOptions}
              selected={answers.genres}
              onToggle={(item) => toggleAnswer("genres", item)}
              onBack={() => {
                  if (isEditMode) {
                    router.back();
                  } else {
                    setStep(0);
                  }
                }}
                onNext={() => {
                  if (isEditMode) {
                    void saveEditedPreferences();
                  } else {
                    setStep(2);
                  }
                }}
                nextText={
                  isEditMode
                    ? "Save Changes"
                    : "Continue"
                }
              onSkip={() => setStep(2)}
              nextDisabled={answers.genres.length === 0}
              gridClassName="genre-choice-grid"
              
            />
          )}

         {step === 2 && (
  <QuestionStep
    stepNumber="2"
    eyebrow="QUESTION 2 OF 3"
    title="What would you like to watch?"
    subtitle="Tell us what to show and what to leave out."

    label="Want to See"
    options={contentTypeOptions}
    selected={answers.contentTypes}
    onToggle={(item) => toggleAnswer("contentTypes", item)}

    secondaryLabel="Don't want to see"
    secondarySelected={answers.excludedContentTypes}
    onSecondaryToggle={(item) =>
      toggleAnswer("excludedContentTypes", item)
    }

    gridClassName="content-choice-grid"

    onBack={() => {
  if (isEditMode) {
    router.back();
  } else {
    setStep(1);
  }
}}
onNext={() => {
  if (isEditMode) {
    void saveEditedPreferences();
  } else {
    setStep(3);
  }
}}
nextText={
  isEditMode
    ? "Save Changes"
    : "Continue"
}
    onSkip={() => setStep(3)}
    nextDisabled={answers.contentTypes.length === 0}
  />
)}

          {step === 3 && (
            <QuestionStep
              stepNumber="3"
              eyebrow="QUESTION 3 of 3"
              title="What matters most to you?"
              subtitle="Tell us what shapes your ideal watching experience. Select all that apply."
              label="Preferences"
              options={preferenceOptions}
              selected={answers.preferences}
              onToggle={(item) => toggleAnswer("preferences", item)}
              onBack={() => {
  if (isEditMode) {
    router.back();
  } else {
    setStep(2);
  }
}}
onNext={() => {
  if (isEditMode) {
    void saveEditedPreferences();
  } else {
    setStep(4);
  }
}}
nextText={
  isEditMode
    ? "Save Changes"
    : "Continue"
}
              onSkip={() => setStep(4)}
              nextDisabled={answers.preferences.length === 0}
              
            />
          )}

          {step === 4 && (
            <>
              {/* <div className="thank-icon">
                <FiUser />
              </div> */}

              <h1 className="thank-title">Thank you!</h1>
              <p className="thank-orange">You&apos;re preferences are set.</p>

              <p className="thank-text">
                Your personalized suggestions are ready. Complete registration
                to start watching exactly what fits your mood, across every
                platform you love.
              </p>

              <h3 className="next-title">Here&apos;s what next:</h3>

              <div className="thank-next-list">
                <NextRow
                  number="✓"
                  title="Tell us your favorite movies and genres"
                  subtitle="Complete"
                  complete
                />

                <NextRow
                  number="2"
                  title="Add your personal details"
                  subtitle="Name, date of birth, country, email and password"
                />

                <NextRow
                  number="3"
                  title="Add your streaming services"
                  subtitle="Link streaming services"
                />
              </div>


               {/* <p className="thank-text">
               By continuing you agree to Cineri&apos;s <a href="/terms">Terms of Serivce </a> and <a href="/privacy">Privacy Policy</a>.<span> Your preferences can be updated any time in Settings</span></p>
                */}

              <div className="step-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setStep(3)}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setStep(5)}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="step-eyebrow">Personal Details</div>
              <h1>Fill out your details</h1>
              <p className="register-subtitle">
                Almost there! Just a few details to complete your profile.
              </p>

             

              {error && <p className="auth-error">{error}</p>}

             <form
  className="register-form personal-details-form"
  onSubmit={
    isEditMode
      ? handleAccountUpdate
      : handleRegister
  }
>
  <div className="register-grid">
    <div className="field-group">
      <label>FIRST NAME *</label>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
    </div>

    <div className="field-group">
      <label>LAST NAME *</label>
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
    </div>

    <div className="field-group full-width">
      <label>EMAIL *</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>

    <div className="field-group">
      <label>USERNAME *</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
    </div>

    <div className="field-group">
      <label>PHONE *</label>
      <input
        type="tel"
        value={phone}
        onChange={(e) =>
          setPhone(formatPhoneNumber(e.target.value))
        }
      />
    </div>

    <div className="field-group">
      <label>DATE OF BIRTH *</label>
      <input
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
      />
    </div>

    <div className="field-group">
      <label>COUNTRY *</label>
      <select
        className="register-select"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      >
        <option value="">Select Country</option>
        <option value="Canada">Canada</option>
        <option value="United States">United States</option>
        <option value="Taiwan">Taiwan</option>
      </select>
    </div>
  </div>
{!isEditMode && (
  <>
    <div className="register-social-section">
      <div className="register-section-heading">
        <span />
        <p>SIGN UP WITH</p>
        <span />
      </div>

      <div className="social-login">
        <button
          type="button"
          className="social-btn google-btn"
          onClick={() => {
            savePendingAnswers();

            signIn("google", {
              callbackUrl: "/profile-complete",
            });
          }}
        >
          <FcGoogle />
          <span>Sign up with Gmail</span>
        </button>

        <button
          type="button"
          className="social-btn apple-btn"
          onClick={() => {
            savePendingAnswers();

            signIn("apple", {
              callbackUrl: "/profile-complete",
            });
          }}
        >
          <FaApple />
          <span>Sign up with Apple</span>
        </button>
      </div>

      <div
        className="register-section-heading password-heading"
        style={{ marginTop: "30px" }}
      >
        <span />
        <p>OR CREATE A PASSWORD</p>
        <span />
      </div>
    </div>

    <div className="register-password-stack">
      <div className="field-group">
        <label>PASSWORD *</label>

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Create a password"
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
          >
            {showPassword ? (
              <FiEyeOff />
            ) : (
              <FiEye />
            )}
          </button>
        </div>
      </div>

      <div className="field-group">
        <label>CONFIRM PASSWORD *</label>

        <div className="password-wrapper">
          <input
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            value={confirmPassword}
            placeholder="Repeat your password"
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowConfirmPassword(
                (current) => !current
              )
            }
          >
            {showConfirmPassword ? (
              <FiEyeOff />
            ) : (
              <FiEye />
            )}
          </button>
        </div>
      </div>
    </div>
  </>
)}
  <p className="register-security-note">
    Your data is kept secure with encryption and is never
    shared without your permission.
  </p>

  <div className="register-final-actions">
    <button
  type="button"
  className="secondary-btn"
  onClick={() => {
    if (isEditMode) {
      router.back();
    } else {
      setStep(4);
    }
  }}
>
  Back
</button>

    <button
  type="submit"
  className="primary-btn create-account-btn2"
>
  {isEditMode
    ? "Save Changes"
    : "Continue"}
</button>
  </div>
</form>

              
            
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ProgressBar({
  step,
  personalDetailsProgress,
}: {
  step: number;
  personalDetailsProgress: number;
}) {
  let preferenceProgress = 0;
  let detailsProgress = 0;
  const streamingProgress = 0;

  // Stage 1: the three preference questions
  if (step === 1) {
    preferenceProgress = 33.33;
  } else if (step === 2) {
    preferenceProgress = 66.66;
  } else if (step >= 3) {
    preferenceProgress = 100;
  }

  // Stage 2: personal information
  if (step === 5) {
    detailsProgress = personalDetailsProgress;
  }

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

function InfoRow({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="info-row">
      <div className="info-number">{number}</div>

      <div className="info-text">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function NextRow({
  number,
  title,
  subtitle,
  complete = false,
}: {
  number: string;
  title: string;
  subtitle: string;
  complete?: boolean;
}) {
  return (
    <div
      className={`thank-next-row ${
        complete ? "thank-next-row-complete" : ""
      }`}
    >
      <div className={`info-number ${complete ? "complete" : ""}`}>
        {number}
      </div>

      <div className="thank-next-row-text">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function QuestionStep({
  eyebrow,
  title,
  subtitle,

  label,
  options,
  selected,
  onToggle,

  secondaryLabel,
  secondarySelected = [],
  onSecondaryToggle,

  onBack,
  onNext,

  nextDisabled = false,
  nextText = "Continue",
  gridClassName = "",
}: {
  stepNumber: string;
  eyebrow: string;
  title: string;
  subtitle: string;

  label: string;
  options: (string | GenreOption | ContentTypeOption | PreferenceOption)[];
  selected: string[];
  onToggle: (item: string) => void;

  secondaryLabel?: string;
  secondarySelected?: string[];
  onSecondaryToggle?: (item: string) => void;

  onBack: () => void;
  onNext: () => void;

  onSkip?: () => void;
  nextDisabled?: boolean;
  nextText?: string;
  gridClassName?: string;
}) {
  function renderOptions(
    selectedItems: string[],
    toggleItem: (item: string) => void,
    sectionType: "preferred" | "excluded"
  ) {
    return (
      <div
        className={`choice-grid ${gridClassName} content-preference-grid ${sectionType}`}
      >
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? option
              : "genre_name" in option
                ? option.genre_name
                : "type_name" in option
                  ? option.type_name
                  : option.factor_name;

          const icon =
            typeof option === "string"
              ? ""
              : "genre_icon" in option
                ? option.genre_icon
                : "content_icon" in option
                  ? option.content_icon
                  : option.factor_icon;

          const description =
            typeof option === "string"
              ? ""
              : "description" in option
                ? option.description
                : "factor_description" in option
                  ? option.factor_description
                  : "";

          const genreColor =
            typeof option !== "string" && "genre_name" in option
              ? option.genre_color
              : "";

          const isActive = selectedItems.includes(item);

          return (
            <button
              key={`${sectionType}-${item}`}
              type="button"
              className={`choice-pill
                ${genreColor ? "genre-pill" : ""}
                ${isActive ? "active" : ""}
                ${sectionType === "excluded" ? "excluded-choice" : ""}
              `}
              style={
                genreColor
                  ? ({
                      "--genre-color": genreColor,
                    } as React.CSSProperties)
                  : undefined
              }
              onClick={() => toggleItem(item)}
            >
              <span className="choice-icon">
                {icon ? (
                  <img src={icon} alt="" className="genre-icon-img" />
                ) : null}
              </span>

              <div className="choice-content">
                <span className="choice-title">{item}</span>
                {description && (
                <span className="choice-description">
                  {description}
                </span>
              )}

                {/* {description && (
                  <span className="choice-description">{description}</span>
                )} */}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="question-header">
        <div>
          <p className="step-eyebrow2">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="register-subtitle">{subtitle}</p>
        </div>
      </div>

      <section className="content-preference-section">
        <p className="content-preference-label preferred-label">{label}</p>

        {renderOptions(selected, onToggle, "preferred")}
      </section>

      {secondaryLabel && onSecondaryToggle && (
        <section className="content-preference-section excluded-section">
          <p className="content-preference-label excluded-label">
            {secondaryLabel}
          </p>

          {renderOptions(
            secondarySelected,
            onSecondaryToggle,
            "excluded"
          )}
        </section>
      )}

      <p className="content-preference-note">
        This helps us personalize your recommendations.
      </p>

      {nextDisabled && (
        <p className="step-warning">
          Select at least one option to continue
        </p>
      )}

      <div className="step-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="button"
          className="primary-btn"
          disabled={nextDisabled}
          onClick={onNext}
        >
          {nextText}
        </button>
      </div>
    </>
  );
}