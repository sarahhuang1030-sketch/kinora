"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfileCompletePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length < 4) return digits;

    if (digits.length < 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(
      3,
      6
    )}-${digits.slice(6)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  setError("");

  // Required fields
  if (!phone.trim()) {
    setError("Phone number is required.");
    return;
  }

  if (!dateOfBirth) {
    setError("Date of birth is required.");
    return;
  }

  if (!country) {
    setError("Please select a country.");
    return;
  }

  // Canadian phone format: (403) 123-4567
  const canadianPhoneRegex = /^\([2-9]\d{2}\)\s\d{3}-\d{4}$/;

  if (!canadianPhoneRegex.test(phone)) {
    setError(
      "Please enter a valid Canadian phone number in the format (403) 123-4567."
    );
    return;
  }

  // Must be at least 13 years old
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  if (age < 13) {
    setError(
      "You must be at least 13 years old to create an account."
    );
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("/api/complete-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session?.user?.email,
        phone,
        country,
        dateOfBirth,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Unable to save profile.");
      return;
    }

    const profileRes = await fetch(
  `/api/profile?email=${encodeURIComponent(session?.user?.email || "")}`
);
const profileData = await profileRes.json();
const savedAnswers = localStorage.getItem("pendingOnboardingAnswers");

if (savedAnswers && profileData.user?.user_id) {
  const pendingAnswers = JSON.parse(savedAnswers);

  await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: profileData.user.user_id,
      ...pendingAnswers,
    }),
  });

  localStorage.removeItem("pendingOnboardingAnswers");
}

router.push(
  `/connect-streaming?socialNewUser=true&userId=${profileData.user.user_id}&email=${encodeURIComponent(profileData.user.email)}`
);
  } catch {
    setError("Something went wrong.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="register-page">
      <div className="register-shell">
        <section className="register-card">
          <div className="step-eyebrow">Almost Done</div>

          <h1>Complete Your Profile</h1>

          <p className="register-subtitle">
            We just need a few more details before you continue.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <form
            className="register-form personal-details-form"
            onSubmit={handleSubmit}
          >
            <div className="register-grid">

              <div className="field-group full-width">
                <label>EMAIL</label>
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                />
              </div>

              <div className="field-group">
                <label>PHONE *</label>
                <input
                  type="tel"
                  required
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
                  required
                  max={new Date().toISOString().split("T")[0]}
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(e.target.value)
                  }
                />
              </div>

              <div className="field-group full-width">
                <label>COUNTRY *</label>

                <select
                  className="register-select"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">Select Country</option>
                  <option value="Canada">Canada</option>
                  <option value="United States">
                    United States
                  </option>
                  <option value="Taiwan">Taiwan</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn create-account-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Complete Registration"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}