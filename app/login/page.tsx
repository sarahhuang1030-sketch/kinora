"use client";

import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      login,
      email: login,
      username: login,
      password,
    });

    if (result?.ok) {
      window.location.href = "/profile";
    } else {
      setError("Invalid email/username or password");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email or Username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
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
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
            >
              <FcGoogle size={24} />
            </button>

            <button
              type="button"
              className="social-btn"
              onClick={() => signIn("apple", { callbackUrl: "/profile" })}
            >
              <FaApple size={24} />
            </button>
          </div>

          <button type="submit">Login</button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account?
          <a href="/register"> Register</a>
        </p>

        <p className="auth-link">
By signing in, you agree to our <a href="/terms"> Terms of Service</a> and
<a href="/privacy"> Privacy Policy</a>. </p>
      </div>
      
    </div>
  );
}