"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Bookmark,
  Check,
  CircleUserRound,
  Link2,
  LogOut,
  MonitorPlay,
  Settings,
  UserRound,
  SlidersHorizontal,
  SquarePlay,
} from "lucide-react";

type SessionUser = {
  user_id?: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  country?: string;
  date_of_birth?: string;
  profile_image?: string;
  created_at?: string;
};

type Answers = {
  genres: string[];
  streamingServices: string[];
  contentTypes: string[];
  preferences: string[];
};

type StreamingService = {
  platform_id: number;
  platform_name: string;
  logo_url: string | null;
};

const emptyAnswers: Answers = {
  genres: [],
  streamingServices: [],
  contentTypes: [],
  preferences: [],
};

export default function StreamingServicesPage() {
  return (
    <Suspense
      fallback={
        <main className="profile-streaming-page">
          <div className="profile-streaming-loading">
            Loading your streaming services...
          </div>
        </main>
      }
    >
      <StreamingServicesContent />
    </Suspense>
  );
}

function StreamingServicesContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const sessionUser =
    session?.user as SessionUser | undefined;

  const email =
    searchParams.get("email") ||
    sessionUser?.email ||
    "";

  const [user, setUser] = useState<User | null>(null);

  const [answers, setAnswers] =
    useState<Answers>(emptyAnswers);

  const [streamingServices, setStreamingServices] =
    useState<StreamingService[]>([]);

  const [selectedServices, setSelectedServices] =
    useState<string[]>([]);

  const [savedServices, setSavedServices] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * This normalizes service names only for comparison.
   * The original database name is still used when saving.
   */
  function normalizeServiceName(name: string) {
    const normalized = name.trim().toLowerCase();

    if (
      normalized === "neflix" ||
      normalized === "netflix"
    ) {
      return "netflix";
    }

    if (
      normalized === "prime video" ||
      normalized === "amazon prime" ||
      normalized === "amazon prime video"
    ) {
      return "prime-video";
    }

    if (
      normalized === "disney+" ||
      normalized === "disney plus"
    ) {
      return "disney-plus";
    }

    return normalized;
  }

  function isServiceSelected(serviceName: string) {
    const serviceKey =
      normalizeServiceName(serviceName);

    return selectedServices.some(
      (selectedName) =>
        normalizeServiceName(selectedName) ===
        serviceKey
    );
  }

  function getDisplayName(platformName: string) {
    const key = normalizeServiceName(platformName);

    if (key === "netflix") {
      return "Netflix";
    }

    if (key === "prime-video") {
      return "Amazon Prime";
    }

    if (key === "disney-plus") {
      return "Disney+";
    }

    return platformName;
  }



  const loadPageData = useCallback(async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * Load the profile and available platform list
       * at the same time.
       */
      const [profileResponse, platformsResponse] =
        await Promise.all([
          fetch(
            `/api/profile?email=${encodeURIComponent(
              email
            )}`,
            {
              cache: "no-store",
            }
          ),

          fetch("/api/streaming-services", {
            cache: "no-store",
          }),
        ]);

      const profileData =
        await profileResponse.json();

      const platformsData =
        await platformsResponse.json();

      if (
        !profileResponse.ok ||
        !profileData.user
      ) {
        throw new Error(
          profileData.error ||
            "Unable to load your profile."
        );
      }

      if (!platformsResponse.ok) {
        throw new Error(
          platformsData.error ||
            "Unable to load streaming platforms."
        );
      }

      const loadedUser =
        profileData.user as User;

      const loadedAnswers: Answers = {
        genres:
          profileData.answers?.genres ?? [],

        streamingServices:
          profileData.answers
            ?.streamingServices ?? [],

        contentTypes:
          profileData.answers
            ?.contentTypes ?? [],

        preferences:
          profileData.answers
            ?.preferences ?? [],
      };

      const availablePlatforms =
        Array.isArray(platformsData)
          ? (platformsData as StreamingService[])
          : [];

      setUser(loadedUser);
      setAnswers(loadedAnswers);
      setStreamingServices(
        availablePlatforms
      );

      /*
       * Connected services are stored in
       * user_connected_services, so load them
       * from your existing list route.
       */
      const connectedResponse = await fetch(
         `/api/connect-service?userId=${loadedUser.user_id}`,
        {
          cache: "no-store",
        }
      );

      const connectedText =
  await connectedResponse.text();

let connectedData: {
  services?: string[];
  error?: string;
} = {};

try {
  connectedData = connectedText
    ? JSON.parse(connectedText)
    : {};
} catch {
  throw new Error(
    "The connected-services API returned an invalid response."
  );
}

      let connectedServices: string[] = [];

      if (
        connectedResponse.ok &&
        Array.isArray(connectedData.services)
      ) {
        connectedServices =
          connectedData.services;
      } else {
        /*
         * Fall back to profile answers if the
         * connected-services route has no data.
         */
        connectedServices =
          loadedAnswers.streamingServices;
      }

      setSelectedServices(
        connectedServices
      );

      setSavedServices(
        connectedServices
      );

      setAnswers((current) => ({
        ...current,
        streamingServices:
          connectedServices,
      }));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your streaming services."
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void loadPageData();
      }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPageData, status]);

  const firstName = useMemo(() => {
    return user?.first_name || "User";
  }, [user]);

  const connectedServices = useMemo(() => {
  return streamingServices.filter((service) =>
    isServiceSelected(service.platform_name)
  );
}, [streamingServices, selectedServices]);

  const otherServices = useMemo(() => {
  return streamingServices.filter(
    (service) =>
      !isServiceSelected(service.platform_name)
  );
}, [streamingServices, selectedServices]);

  function handleStartEdit() {
    setSelectedServices([
      ...savedServices,
    ]);

    setError("");
    setSuccess("");
    setIsEditing(true);
  }

  function handleCancel() {
    setSelectedServices([
      ...savedServices,
    ]);

    setError("");
    setSuccess("");
    setIsEditing(false);
  }

  function toggleService(
    serviceName: string
  ) {
    const serviceKey =
      normalizeServiceName(serviceName);

    setSelectedServices((current) => {
      const alreadySelected =
        current.some(
          (selectedName) =>
            normalizeServiceName(
              selectedName
            ) === serviceKey
        );

      if (alreadySelected) {
        return current.filter(
          (selectedName) =>
            normalizeServiceName(
              selectedName
            ) !== serviceKey
        );
      }

      return [...current, serviceName];
    });
  }

  function handleServiceClick(
    serviceName: string
  ) {
    if (!isEditing) {
      setIsEditing(true);
    }

    toggleService(serviceName);
  }

 async function handleSave() {
  if (!user) {
    return;
  }

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch(
      "/api/connect-service",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          services: selectedServices,
        }),
      }
    );

    const responseText =
      await response.text();

    let data: {
      success?: boolean;
      services?: string[];
      error?: string;
      details?: string;
    } = {};

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        "The server returned an invalid response while saving."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.details ||
          "Unable to save your streaming services."
      );
    }

    const saved =
      Array.isArray(data.services)
        ? data.services
        : selectedServices;

    setSelectedServices(saved);
    setSavedServices(saved);

    setAnswers((current) => ({
      ...current,
      streamingServices: saved,
    }));

    setIsEditing(false);

    setSuccess(
      "Your streaming services were updated successfully."
    );

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  } catch (saveError) {
    setError(
      saveError instanceof Error
        ? saveError.message
        : "Unable to save your streaming services."
    );
  } finally {
    setSaving(false);
  }
}

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email: sessionUser?.email,
        }),
      });
    } catch (logoutError) {
      console.error(
        "Logout tracking failed:",
        logoutError
      );
    }

    await signOut({
      callbackUrl: "/",
    });
  }

  if (
    status === "loading" ||
    loading
  ) {
    return (
      <main className="profile-streaming-page">
        <div className="profile-streaming-loading">
          Loading your streaming services...
        </div>
      </main>
    );
  }

  if (!sessionUser?.email) {
    return (
      <main className="profile-streaming-page">
        <section className="profile-streaming-message-card">
          <CircleUserRound size={44} />

          <h1>
            Sign in to view your streaming
            services
          </h1>

          <p>
            Manage the streaming platforms
            Cineri uses for your
            recommendations.
          </p>

          <Link href="/login">
            Sign In
          </Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-streaming-page">
        <section className="profile-streaming-message-card">
          <CircleUserRound size={44} />

          <h1>
            Streaming services unavailable
          </h1>

          <p>
            {error ||
              "We could not find your account information."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadPageData()
            }
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-streaming-page">
      <div className="profile-streaming-shell">
        <h1 className="profile-streaming-welcome">
          Welcome,{" "}
          <span>{firstName}!</span>
        </h1>

        <div className="profile-streaming-layout">
          <aside className="watchlists-account-sidebar">
          <p className="watchlists-sidebar-heading">
            Account
          </p>

         <div className="watchlists-sidebar-links">
                <Link href="/profile">
                  <CircleUserRound size={17} />
                  <span>Profile</span>
                </Link>

                <Link href="/profile/streaming-services">
                  <MonitorPlay size={17} fill="currentColor"/>
                  <span>Streaming Services</span>
                </Link>

                <Link href="/watchlists"  >
                  <Bookmark size={17} />
                  <span>My Watchlists</span>
                </Link>
            
                <Link
                  href="/profile/preferences"
                >
                  <SlidersHorizontal 
                    size={17}
                    
                  />
                  <span>Preferences</span>
                </Link>

                <Link href="/profile/activity">
                  <SquarePlay size={17} />
                  <span>Activity</span>
                </Link>

              <Link href="/profile/settings" className="watchlists-sidebar-active">
                  <Settings  size={17} fill="currentColor"/>
                  <span>Settings</span>
                </Link>

                <div className="watchlists-sidebar-divider" />

            <button
              type="button"
              className="watchlists-logout"
              onClick={() => void handleLogout()}
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button> 
             </div>
        </aside>

          <section className="profile-streaming-card">
           

           

           
          </section>
        </div>
      </div>
    </main>
  );
}