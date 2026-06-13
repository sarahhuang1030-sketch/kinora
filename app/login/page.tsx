"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

   const text = await res.text();
console.log("LOGIN RESPONSE:", text);

let data;
try {
  data = JSON.parse(text);
} catch {
  setError("Server error. Check VS Code terminal.");
  return;
}

    if (!res.ok) {
      setError(data.message || "Login failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/");
  }

  return (

     <>
     <Navbar />
     <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleLogin}>
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
          <button type="submit">
            Login
          </button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account?
          <a href="/register"> Register</a>
        </p>
      </div>
    </div></>
);
}