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

    if (!phone || !country || !dateOfBirth) {
      setError("Please complete all fields.");
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

      router.push("/connect-streaming?socialNewUser=true");
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
                  onChange={(e) =>
                    setDateOfBirth(e.target.value)
                  }
                />
              </div>

              <div className="field-group full-width">
                <label>COUNTRY *</label>

                <select
                  className="register-select"
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