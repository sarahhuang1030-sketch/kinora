"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

type AnswerCategory = "genres" | "contentTypes" | "preferences";
type GenreOption = {
  genre_name: string;
  genre_icon: string;
};
type ContentTypeOption = {
  type_name: string;
  content_icon: string;
  description: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

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
    preferences: [] as string[],
  });

  const [genreOptions, setGenreOptions] = useState<GenreOption[]>([]);
  const [contentTypeOptions, setContentTypeOptions] = useState<ContentTypeOption[]>([]);
  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    async function loadOptions() {
      const genreRes = await fetch("/api/genres");
      const genreData = await genreRes.json();
      setGenreOptions(
        genreData.map((item: { genre_name: string; genre_icon: string }) => ({
          genre_name: item.genre_name,
          genre_icon: item.genre_icon,
        }))
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
        preferenceData.map((item: { factor_name: string }) => item.factor_name)
      );
    }

    loadOptions();
  }, []);

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
  alert("Registration successful! Please log in.");
  router.push("/login");
}
  }

  return (
    <main className="register-page">
      <div className="register-shell">
        {step > 0 && <ProgressBar step={step} />}

        <section className="register-card">
          {step === 0 && (
            <>
              <div className="step-eyebrow">New Account</div>

              <h1>Create an account</h1>
              <p className="register-subtitle">Here&apos;s how it works:</p>

              <div className="onboarding-list">
                <InfoRow
                  number="1"
                  title="Pick your favorite genres"
                  subtitle="Choose one or more genres"
                />
                <InfoRow
                  number="2"
                  title="Select your content type"
                  subtitle="Movies, TV shows, or both"
                />
                <InfoRow
                  number="3"
                  title="Tell us what matters most"
                  subtitle="Help us improve your recommendations"
                />
                <InfoRow
                  number="4"
                  title="Create your account"
                  subtitle="Save your personalized profile"
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
              eyebrow="QUESTION 1 of 5"
              title="Pick your favourite genres"
              subtitle="Choose as many as you like."
              label="Genres"
              options={genreOptions}
              selected={answers.genres}
              onToggle={(item) => toggleAnswer("genres", item)}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              onSkip={() => setStep(2)}
              nextDisabled={answers.genres.length === 0}
              gridClassName="genre-choice-grid"
            />
          )}

          {step === 2 && (
            <QuestionStep
              stepNumber="2"
              eyebrow="QUESTION 2 of 5"
              title="What do you prefer to watch?"
              subtitle="Pick your preferred content type(s)"
              label="Content Type"
              options={contentTypeOptions}
              selected={answers.contentTypes}
              onToggle={(item) => toggleAnswer("contentTypes", item)}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onSkip={() => setStep(3)}
              nextDisabled={answers.contentTypes.length === 0}
              gridClassName="content-choice-grid"
            />
          )}

          {step === 3 && (
            <QuestionStep
              stepNumber="3"
              eyebrow="QUESTION 3 of 5"
              title="What matters most to you?"
              subtitle="Choose what influences your recommendations."
              label="Preferences"
              options={preferenceOptions}
              selected={answers.preferences}
              onToggle={(item) => toggleAnswer("preferences", item)}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              onSkip={() => setStep(4)}
              nextDisabled={answers.preferences.length === 0}
              nextText="Continue"
            />
          )}

          {step === 4 && (
            <>
              <div className="thank-icon">
                <FiUser />
              </div>

              <h1 className="thank-title">Thank you!</h1>
              <p className="thank-orange">you&apos;re all set.</p>

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
                  subtitle="1 question"
                />

                <NextRow
                  number="3"
                  title="Create your account"
                  subtitle="Save your profile"
                />
              </div>


               <p className="thank-text">
               By continuing you agree to Cineri&apos;s <a href="/terms">Terms of Serivce </a> and <a href="/privacy">Privacy Policy</a>.<span> Your preferences can be updated any time in Settings</span></p>
               

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

             <form className="register-form personal-details-form" onSubmit={handleRegister}>
  <div className="register-grid">
    <div className="field-group">
      <label>FIRST NAME *</label>
      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
    </div>

    <div className="field-group">
      <label>LAST NAME *</label>
      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
    </div>

    <div className="field-group">
      <label>PHONE *</label>
      <input type="tel" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} />
    </div>

   

    <div className="field-group">
      <label>DATE OF BIRTH *</label>
      <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
    </div>

    <div className="field-group">
      <label>COUNTRY *</label>
      <select className="register-select" value={country} onChange={(e) => setCountry(e.target.value)}>
        <option value="">Select Country</option>
        <option value="Canada">Canada</option>
        <option value="United States">United States</option>
        <option value="Taiwan">Taiwan</option>
      </select>
    </div>


    <div className="field-group">
      <label>PASSWORD *</label>
      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>

    <div className="field-group">
      <label>CONFIRM PASSWORD *</label>
      <div className="password-wrapper">
       <input
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  </div>

  <button type="submit" className="primary-btn create-account-btn2">
    Create Account
  </button>
</form>

              <div className="social-divider">
                <span></span>
                <p>or continue with</p>
                <span></span>
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
                  <span>Sign in with Google</span>
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
                  <span>Log in with Apple</span>
                </button>
              </div>

              <button className="text-btn" onClick={() => setStep(4)}>
                ← Back
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="register-progress-lines">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className={`progress-line-block ${step >= item ? "active" : ""}`}
        />
      ))}
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
    <div className="thank-next-row">
      <div className={`thank-next-number ${complete ? "complete" : ""}`}>
        {number}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function QuestionStep({
  stepNumber,
  eyebrow,
  title,
  subtitle,
  label,
  options,
  selected,
  onToggle,
  onBack,
  onNext,
  onSkip,
  nextDisabled,
  nextText = "Continue",
  gridClassName = "",
}: {
  stepNumber: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  label: string;
  options: (string | GenreOption | ContentTypeOption)[];
  selected: string[];
  onToggle: (item: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  nextDisabled: boolean;
  nextText?: string;
  gridClassName?: string;
}) {
  return (
    <>
      <div className="question-header">
        {/* <div className="question-number">{stepNumber}</div> */}

        <div>
          <p className="step-eyebrow2">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="register-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* <p className="question-label">{label}</p> */}

      <div className={`choice-grid ${gridClassName}`}>
  {options.map((option) => {
   const item =
  typeof option === "string"
    ? option
    : "genre_name" in option
    ? option.genre_name
    : option.type_name;

    const icon =
      typeof option === "string"
        ? ""
        : "genre_icon" in option
        ? option.genre_icon
        : option.content_icon;

    const description =
      typeof option === "string"
        ? ""
        : "description" in option
        ? option.description
        : "";

    return (
      <button
        key={item}
        type="button"
        className={`choice-pill ${selected.includes(item) ? "active" : ""}`}
        onClick={() => onToggle(item)}
      >
        <span className="choice-icon">
          {icon ? (
            <img src={icon} alt="" className="genre-icon-img" />
          ) : null}
        </span>

        {/* <span>{item}</span> */}
        <div className="choice-content">
  <span className="choice-title">{item}</span>

  {description && (
    <span className="choice-description">
      {description}
    </span>
  )}
</div>
      </button>
    );
  })}
</div>

      {nextDisabled && (
        <p className="step-warning">Select at least one option to continue</p>
      )}

      <div className="step-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
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

      {/* <button type="button" className="skip-btn" onClick={onSkip}>
        Skip for now
      </button> */}
    </>
  );
}