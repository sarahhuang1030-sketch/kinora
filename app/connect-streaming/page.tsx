"use client";

import { Suspense, useState, useEffect } from "react";
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
  const userId = searchParams.get("userId");

useEffect(() => {
  async function loadConnectedServices() {
    if (!userId) {
      setConnectedServices([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/connect-service?userId=${encodeURIComponent(
          userId
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load connected services."
        );
      }

      setConnectedServices(
        Array.isArray(data.services)
          ? data.services
          : []
      );
    } catch (error) {
      console.error(
        "LOAD CONNECTED SERVICES ERROR:",
        error
      );

      setConnectedServices([]);
    }
  }

  void loadConnectedServices();
}, [userId]);

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
  if (userId) query.set("userId", userId);

  const queryString = query.toString();

  return queryString
    ? `/onboarding-complete?${queryString}`
    : "/onboarding-complete";
}

async function continueNext() {
  console.log("USER ID:", userId);
  console.log("CONNECTED SERVICES:", connectedServices);

  if (userId) {
    async function continueNext() {
  if (!userId) {
    console.error("Missing userId");

    return;
  }

  try {
    const response = await fetch(
      "/api/connect-service",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number(userId),
          services: connectedServices,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to save streaming services."
      );
    }

    router.push(buildNextUrl());
  } catch (error) {
    console.error(
      "SAVE STREAMING SERVICES ERROR:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Unable to save streaming services."
    );
  }
}
  }

  router.push(buildNextUrl());
}

  function skipConnect() {
    router.push(buildNextUrl());
  }

  return (
    <main className="register-page">
      <div className="register-shell">
        <OnboardingProgress
      preferenceProgress={100}
      detailsProgress={100}
      streamingProgress={100}
    />
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

function OnboardingProgress({
  preferenceProgress,
  detailsProgress,
  streamingProgress,
}: {
  preferenceProgress: number;
  detailsProgress: number;
  streamingProgress: number;
}) {
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