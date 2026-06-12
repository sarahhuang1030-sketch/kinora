"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

 async function handleRegister(e: React.FormEvent) {
  e.preventDefault();

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password, phone, firstName, lastName }),
  });

  const text = await res.text();
  console.log("REGISTER RESPONSE:", text);

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

  alert("Registration successful!");
  // router.push("/login");
  router.push(`/profile?email=${encodeURIComponent(email)}&newUser=true`);
}

// helper to format phone number as user types
function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) {
    return digits;
  }

  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(
    3,
    6
  )}-${digits.slice(6)}`;
}

  return (

    <>
    <Navbar />
    <div className="auth-page">
    <div className="auth-card">
              <h1>Create Account</h1>

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
                      onChange={(e) => setEmail(e.target.value)} />

                  <input
                      type="tel"
                      placeholder="(403) 123-4567"
                      value={phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setPhone(formatted);
                      }}
                    />
                   </div>
                    <input
                      type="text"
                      placeholder="Bluejay123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)} />

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
                   
                    {error && <p className="auth-error">{error}</p>}
                  </div>

                  <button type="submit">
                      Create Account
                  </button>
              </form>

              <p className="auth-link">
                  Already have an account?
                  <a href="/login"> Login</a>
              </p>
          </div>
      </div></>
);
}