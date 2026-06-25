"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const services = [
  {
    name: "Netflix",
    logo: "/platforms/netflix.webp",
    className: "netflix-btn",
  },
  {
    name: "Prime Video",
    logo: "/platforms/prime.jpg",
    className: "prime-btn",
  },
  {
    name: "Crave",
    logo: "/platforms/crave.jpg",
    className: "crave-btn",
  },
  {
    name: "Disney+",
    logo: "/platforms/disney.png",
    className: "disney-btn",
  },
];

export default function ConnectStreamingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectStreamingContent />
    </Suspense>
  );
}

function ConnectStreamingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connectedServices, setConnectedServices] = useState<string[]>([]);

  const isSocialNewUser = searchParams.get("socialNewUser") === "true";
  const email = searchParams.get("email");

  function toggleService(service: string) {
    setConnectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  function buildNextUrl() {
    const query = new URLSearchParams();

    if (email) query.set("email", email);
    if (isSocialNewUser) query.set("socialNewUser", "true");

    const queryString = query.toString();

    return queryString
      ? `/onboarding-complete?${queryString}`
      : "/onboarding-complete";
  }

  function continueNext() {
    localStorage.setItem(
      "connectedServices",
      JSON.stringify(connectedServices)
    );

    router.push(buildNextUrl());
  }

  function skipConnect() {
    router.push(buildNextUrl());
  }

  return (
    <main className="register-page">
      <div className="register-shell">
        <section className="register-card">
          <div className="step-eyebrow">Streaming Services</div>

          <h1>Connect your streaming services</h1>

          <p className="register-subtitle">
            Link your accounts so Cineri can find what is available for you.
          </p>

          <div className="streaming-connect-grid">
            {services.map((service) => {
              const isConnected = connectedServices.includes(service.name);

              return (
                <div className="streaming-connect-card" key={service.name}>
                  <div className="streaming-connect-top">
                    <img src={service.logo} alt={service.name} />
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        {isConnected ? "Connected" : "Not connected"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      isConnected
                        ? "secondary-btn"
                        : `streaming-connect-btn ${service.className}`
                    }
                    onClick={() => toggleService(service.name)}
                  >
                    {isConnected ? "Disconnect" : `Connect ${service.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <button className="secondary-btn" type="button">
            Add other streaming service
          </button>

          <div className="step-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => router.push("/profile-complete")}
            >
              Back
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={continueNext}
            >
              Continue
            </button>
          </div>

          <button type="button" className="skip-btn" onClick={skipConnect}>
            Skip — connect services later
          </button>
        </section>
      </div>
    </main>
  );
}