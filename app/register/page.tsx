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

 async function handleRegister(e: React.FormEvent) {
  e.preventDefault();

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
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
  router.push("/login");
}

  return (

    <>
    <Navbar />
    <div className="auth-page" style={{marginTop: "40px"}}>
    <div className="auth-card">
              <h1>Create Account</h1>

              <form onSubmit={handleRegister}>
                  <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)} />

                  <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} />

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