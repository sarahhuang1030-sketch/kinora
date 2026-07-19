"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Link2 } from "lucide-react";

type StreamingPlatform = {
  platform_id: number;
  platform_name: string;
  logo_url: string;
};

export default function ConnectStreamingPage() {
  return (
    <Suspense
      fallback={
        <div className="streaming-loading-message">
          Loading...
        </div>
      }
    >
      <ConnectStreamingContent />
    </Suspense>
  );
}

function ConnectStreamingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<
    StreamingPlatform[]
  >([]);

  const [servicesLoading, setServicesLoading] =
    useState(true);

  const [connectedServices, setConnectedServices] =
    useState<string[]>([]);

  const [excludedServices, setExcludedServices] =
    useState<string[]>([]);

  const isSocialNewUser =
    searchParams.get("socialNewUser") === "true";

  const email = searchParams.get("email");
  const userId = searchParams.get("userId");

  const featuredServices = services.slice(0, 4);
  const otherServices = services.slice(4);

  useEffect(() => {
    async function loadStreamingPlatforms() {
      try {
        const response = await fetch(
          "/api/streaming-services",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load streaming platforms."
          );
        }

        setServices(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "LOAD STREAMING PLATFORMS ERROR:",
          error
        );

        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    }

    void loadStreamingPlatforms();
  }, []);

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

  function getDisplayName(platformName: string) {
    if (
      platformName === "Prime Video" ||
      platformName === "Amazon Prime"
    ) {
      return "Amazon Prime";
    }

    if (
      platformName === "Disney Plus" ||
      platformName === "Disney+"
    ) {
      return "Disney +";
    }

    return platformName;
  }

  function toggleService(service: string) {
    setExcludedServices((current) =>
      current.filter((item) => item !== service)
    );

    setConnectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  function toggleExcludedService(service: string) {
    setConnectedServices((current) =>
      current.filter((item) => item !== service)
    );

    setExcludedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  function buildNextUrl() {
    const query = new URLSearchParams();

    if (email) {
      query.set("email", email);
    }

    if (isSocialNewUser) {
      query.set("socialNewUser", "true");
    }

    if (userId) {
      query.set("userId", userId);
    }

    const queryString = query.toString();

    return queryString
      ? `/onboarding-complete?${queryString}`
      : "/onboarding-complete";
  }

  async function continueNext() {
    if (!userId) {
      console.error("Missing userId");

      alert(
        "User information is missing. Please go back and try again."
      );

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

      console.log(
        "STREAMING SERVICES SAVED:",
        data.services
      );

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
          <div className="step-eyebrow">
            Streaming Services
          </div>

          <h1>
            Connect your streaming services
          </h1>

          <p className="register-subtitle">
            Link your accounts so Cineri can find
            what is available for you.
          </p>

          {servicesLoading ? (
            <p className="streaming-loading-message">
              Loading streaming services...
            </p>
          ) : (
            <div className="streaming-connect-grid">
              {featuredServices.map((service) => {
                const isConnected =
                  connectedServices.includes(
                    service.platform_name
                  );

                const isExcluded =
                  excludedServices.includes(
                    service.platform_name
                  );

                const displayName =
                  getDisplayName(
                    service.platform_name
                  );

                return (
                  <article
                    key={service.platform_id}
                    className={[
                      "streaming-connect-card",
                      isConnected
                        ? "is-connected"
                        : "",
                      isExcluded
                        ? "is-excluded"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="streaming-connect-card-header">
                      <div className="streaming-connect-service">
                        <div className="streaming-connect-logo">
                          <img
                            src={service.logo_url}
                            alt={`${displayName} logo`}
                          />
                        </div>

                        <strong>
                          {displayName}
                        </strong>
                      </div>

                      <span
                        className={[
                          "streaming-connect-status",
                          isConnected
                            ? "is-connected"
                            : "",
                          isExcluded
                            ? "is-excluded"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {isConnected
                          ? "Connected"
                          : isExcluded
                            ? "Not using"
                            : "Not connected"}
                      </span>
                    </div>

                    <div className="streaming-connect-actions">
                      <button
                        type="button"
                        className={[
                          "streaming-connect-btn",
                          isConnected
                            ? "is-active"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() =>
                          toggleService(
                            service.platform_name
                          )
                        }
                      >
                        <Link2
                          size={17}
                          strokeWidth={2.2}
                        />

                        <span>
                          {isConnected
                            ? "CONNECTED"
                            : "CONNECT"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={[
                          "streaming-ignore-btn",
                          isExcluded
                            ? "is-active"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() =>
                          toggleExcludedService(
                            service.platform_name
                          )
                        }
                      >
                        {isExcluded
                          ? "Use This Service"
                          : "Don’t Use"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {otherServices.length > 0 && (
            <>
              <div className="connect-streaming-divider">
                <span />

                <p>
                  Add other streaming platforms
                </p>

                <span />
              </div>

              <div className="connect-streaming-other">
                {otherServices.map((service) => {
                  const isConnected =
                    connectedServices.includes(
                      service.platform_name
                    );

                  const isExcluded =
                    excludedServices.includes(
                      service.platform_name
                    );

                  return (
                    <button
                      key={service.platform_id}
                      type="button"
                      className={[
                        isConnected
                          ? "is-selected"
                          : "",
                        isExcluded
                          ? "is-excluded"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        toggleService(
                          service.platform_name
                        )
                      }
                    >
                      {getDisplayName(
                        service.platform_name
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="step-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                router.push(
                  "/profile-complete"
                )
              }
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

          <button
            type="button"
            className="skip-btn"
            onClick={skipConnect}
          >
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
        <ProgressSection
          progress={preferenceProgress}
        />

        <ProgressSection
          progress={detailsProgress}
        />

        <ProgressSection
          progress={streamingProgress}
        />
      </div>

      <div className="register-progress-labels">
        <span
          className={
            preferenceProgress > 0
              ? "active"
              : ""
          }
        />

        <span
          className={
            detailsProgress > 0
              ? "active"
              : ""
          }
        />

        <span
          className={
            streamingProgress > 0
              ? "active"
              : ""
          }
        />
      </div>
    </div>
  );
}

function ProgressSection({
  progress,
}: {
  progress: number;
}) {
  return (
    <div className="progress-line-block">
      <div
        className="progress-line-fill"
        style={{
          width: `${Math.min(
            Math.max(progress, 0),
            100
          )}%`,
        }}
      />
    </div>
  );
}