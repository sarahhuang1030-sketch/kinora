"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [answers, setAnswers] = useState({
    genres: [] as string[],
    streamingServices: [] as string[],
    contentTypes: [] as string[],
    preferences: [] as string[],
  });

  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [streamingOptions, setStreamingOptions] = useState<string[]>([]);
  const [contentTypeOptions, setContentTypeOptions] = useState<string[]>([]);
  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const genreRes = await fetch("/api/genres");
      const genreData = await genreRes.json();
      setGenreOptions(
        genreData.map((item: { genre_name: string }) => item.genre_name)
      );

      const streamingRes = await fetch("/api/streaming-services");
      const streamingData = await streamingRes.json();
      setStreamingOptions(
        streamingData.map((item: { platform_name: string }) => item.platform_name)
      );

      const contentRes = await fetch("/api/content-types");
      const contentData = await contentRes.json();
      setContentTypeOptions(
        contentData.map((item: { type_name: string }) => item.type_name)
      );

      const preferenceRes = await fetch("/api/recommendation-factors");
      const preferenceData = await preferenceRes.json();
      setPreferenceOptions(
        preferenceData.map((item: { factor_name: string }) => item.factor_name)
      );
    }

    loadOptions();
  }, []);

  function toggleAnswer(section: keyof typeof answers, item: string) {
    setAnswers((current) => ({
      ...current,
      [section]: current[section].includes(item)
        ? current[section].filter((value) => value !== item)
        : [...current[section], item],
    }));
  }

  function savePendingAnswers() {
    localStorage.setItem("pendingOnboardingAnswers", JSON.stringify(answers));
  }

  function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length < 4) return digits;

    if (digits.length < 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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
        streamingServices: answers.streamingServices,
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

console.log("loginResult:", loginResult);

if (loginResult?.ok) {
  window.location.href = "/profile";
} else {
  alert("Registration successful! Please log in.");
  router.push("/login");
}
  }

  return (
    <>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Create Account</h1>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleRegister}>
            <div className="form-row">
              <input
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="tel"
                placeholder="(403) 123-4567"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              />
            </div>

            <input
              type="text"
              placeholder="Bluejay123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-btn"
                onClick={() => {
                  savePendingAnswers();
                  signIn("google", {
                    callbackUrl: "/profile?socialNewUser=true",
                  });
                }}
              >
                <FcGoogle size={24} />
              </button>

              <button
                type="button"
                className="social-btn"
                onClick={() => {
                  savePendingAnswers();
                  signIn("apple", {
                    callbackUrl: "/profile?socialNewUser=true",
                  });
                }}
              >
                <FaApple size={24} />
              </button>
            </div>

            <button type="submit">Create Account</button>
          </form>

          <p className="auth-link">
            Already have an account?
            <a href="/login"> Login</a>
          </p>
        </div>
      </div>

      {step < 5 && (
        <div className="modal-backdrop open">
          <div className="modal feeling-modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Tell us what you like</h2>
                <p className="modal-subtitle">
                  We’ll personalize your recommendations based on your choices.
                </p>
              </div>
            </div>

            {step === 1 && (
              <>
                <h3>Which genres do you prefer?</h3>

                <div className="modal-grid" style={{ margin: "20px" }}>
                  {genreOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`choice ${
                        answers.genres.includes(item) ? "active" : ""
                      }`}
                      onClick={() => toggleAnswer("genres", item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="modal-footer" style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setStep(5)}
                  >
                    Skip
                  </button>

                  <button
                    type="button"
                    className="btn-next"
                    disabled={answers.genres.length === 0}
                    onClick={() => setStep(2)}
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3>Which streaming services are you currently using?</h3>

                <div className="modal-grid" style={{ margin: "20px" }}>
                  {streamingOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`choice ${
                        answers.streamingServices.includes(item) ? "active" : ""
                      }`}
                      onClick={() => toggleAnswer("streamingServices", item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="modal-footer" style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    className="btn-next"
                    disabled={answers.streamingServices.length === 0}
                    onClick={() => setStep(3)}
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3>What is your preferred content type?</h3>

                <div className="modal-grid" style={{ margin: "20px" }}>
                  {contentTypeOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`choice ${
                        answers.contentTypes.includes(item) ? "active" : ""
                      }`}
                      onClick={() => toggleAnswer("contentTypes", item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="modal-footer" style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    className="btn-next"
                    disabled={answers.contentTypes.length === 0}
                    onClick={() => setStep(4)}
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h3>What matters to you the most?</h3>

                <div className="modal-grid" style={{ margin: "20px" }}>
                  {preferenceOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`choice ${
                        answers.preferences.includes(item) ? "active" : ""
                      }`}
                      onClick={() => toggleAnswer("preferences", item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="modal-footer" style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setStep(3)}
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    className="btn-next"
                    disabled={answers.preferences.length === 0}
                    onClick={() => setStep(5)}
                  >
                    Continue to Register →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}