"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Accessibility,
  AlertTriangle,
  CircleUserRound,
  Download,
  Globe2,
  RotateCcw,
  Shield,
} from "lucide-react";

import AccountSidebar from "@/app/components/AccountSidebar";

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

type TextSize = "S" | "M" | "L" | "XL";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="profile-streaming-page">
          <div className="profile-streaming-loading">
            Loading your settings...
          </div>
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const sessionUser =
    session?.user as SessionUser | undefined;

  const email =
    searchParams.get("email") ||
    sessionUser?.email ||
    "";

  /* ------------------------------------------------------------------------
     USER
     ------------------------------------------------------------------------ */

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

const [deletingAccount, setDeletingAccount] =
  useState(false);

const [deleteError, setDeleteError] =
  useState("");

const [showDeleteConfirm, setShowDeleteConfirm] =
  useState(false);

  /* ------------------------------------------------------------------------
     LANGUAGE & REGION
     ------------------------------------------------------------------------ */

  const [appLanguage, setAppLanguage] =
    useState("English");

  const [
    contentLanguage,
    setContentLanguage,
  ] = useState("All languages");

  const [region, setRegion] =
    useState("Canada");

  const [dateFormat, setDateFormat] =
    useState("DD MM YYYY");

  /* ------------------------------------------------------------------------
     PRIVACY & DATA
     ------------------------------------------------------------------------ */

  const [watchHistory, setWatchHistory] =
    useState(true);

  const [moodData, setMoodData] =
    useState(true);

  const [analytics, setAnalytics] =
    useState(true);

  /* ------------------------------------------------------------------------
     ACCESSIBILITY
     ------------------------------------------------------------------------ */

  const [reduceMotion, setReduceMotion] =
    useState(false);

  const [highContrast, setHighContrast] =
    useState(false);

 const [textSize, setTextSize] =
  useState<TextSize>(() => {
    if (typeof window === "undefined") {
      return "M";
    }

    const savedTextSize =
      localStorage.getItem(
        "cineri-text-size"
      ) as TextSize | null;

    return savedTextSize || "M";
  });

useEffect(() => {
  const root = document.documentElement;

  root.classList.remove(
    "text-size-s",
    "text-size-m",
    "text-size-l",
    "text-size-xl"
  );

  root.classList.add(
    `text-size-${textSize.toLowerCase()}`
  );

  localStorage.setItem(
    "cineri-text-size",
    textSize
  );
}, [textSize]);


  /* ------------------------------------------------------------------------
     LOAD USER PROFILE
     ------------------------------------------------------------------------ */
useEffect(() => {
  if (
    status === "loading" ||
    !email
  ) {
    return;
  }

  let cancelled = false;

  fetch(
    `/api/profile?email=${encodeURIComponent(email)}`,
    {
      cache: "no-store",
    }
  )
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok || !data.user) {
        throw new Error(
          data.error ||
            "Unable to load your profile."
        );
      }

      return data.user as User;
    })
    .then((loadedUser) => {
      if (cancelled) {
        return;
      }

      setUser(loadedUser);
      setError("");
    })
    .catch((loadError) => {
      if (cancelled) {
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your profile."
      );
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [status, email]);


async function handleRetry() {
  if (!email) {
    return;
  }

  try {
    setLoading(true);
    setError("");

    const response = await fetch(
      `/api/profile?email=${encodeURIComponent(email)}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data.user) {
      throw new Error(
        data.error ||
          "Unable to load your profile."
      );
    }

    setUser(data.user as User);
  } catch (loadError) {
    setError(
      loadError instanceof Error
        ? loadError.message
        : "Unable to load your profile."
    );
  } finally {
    setLoading(false);
  }
}

async function handleDeleteAccount() {
  if (!user) {
    return;
  }

  try {
    setDeletingAccount(true);
    setDeleteError("");

    const response = await fetch(
      "/api/delete-account",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          email: user.email,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to delete your account."
      );
    }

    localStorage.removeItem(
      "cineri-text-size"
    );

    await signOut({
      callbackUrl: "/",
    });
  } catch (deleteAccountError) {
    setDeleteError(
      deleteAccountError instanceof Error
        ? deleteAccountError.message
        : "Unable to delete your account."
    );

    setDeletingAccount(false);
  }
}

  const firstName = useMemo(() => {
    return user?.first_name || "User";
  }, [user]);

  /* ------------------------------------------------------------------------
     LOADING
     ------------------------------------------------------------------------ */

  if (
    status === "loading" ||
    loading
  ) {
    return (
      <main className="profile-streaming-page">
        <div className="profile-streaming-loading">
          Loading your settings...
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------
     NOT SIGNED IN
     ------------------------------------------------------------------------ */

  if (!sessionUser?.email) {
    return (
      <main className="profile-streaming-page">
        <section className="profile-streaming-message-card">
          <CircleUserRound size={44} />

          <h1>
            Sign in to view your settings
          </h1>

          <p>
            Manage your account, privacy,
            accessibility, and display settings.
          </p>

          <Link href="/login">
            Sign In
          </Link>
        </section>
      </main>
    );
  }

  /* ------------------------------------------------------------------------
     PROFILE ERROR
     ------------------------------------------------------------------------ */

  if (!user) {
    return (
      <main className="profile-streaming-page">
        <section className="profile-streaming-message-card">
          <CircleUserRound size={44} />

          <h1>
            Settings unavailable
          </h1>

          <p>
            {error ||
              "We could not find your account information."}
          </p>

          <button
                type="button"
                onClick={() => void handleRetry()}
                >
                Try Again
                </button>
        </section>
      </main>
    );
  }

  /* ------------------------------------------------------------------------
     SETTINGS PAGE
     ------------------------------------------------------------------------ */

  return (
    <main className="profile-streaming-page">
      <div className="profile-streaming-shell">
        <h1 className="profile-streaming-welcome">
          Welcome,{" "}
          <span>{firstName}!</span>
        </h1>

        <div className="profile-streaming-layout">
          <AccountSidebar active="settings" />

          <section className="settings-card">
            <div className="settings-card-heading">
              <h2>Settings</h2>

              <p>
                Manage your display, data, and
                account settings
              </p>
            </div>

            {/* LANGUAGE & REGION */}
            <section className="settings-section">
              <div className="settings-section-heading">
                <div className="settings-section-icon">
                  <Globe2 size={18} />
                </div>

                <div>
                  <h3>
                    Language & Region
                  </h3>

                  <p>
                    Set your preferred language,
                    region, and date format
                  </p>
                </div>
              </div>

              <div className="settings-fields-grid">
                <label className="settings-field">
                  <span>
                    APP LANGUAGE
                  </span>

                  <select
                    value={appLanguage}
                    onChange={(event) =>
                      setAppLanguage(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      English
                    </option>

                    <option>
                      中文
                    </option>

                    <option>
                      French
                    </option>

                    <option>
                      Spanish
                    </option>
                  </select>
                </label>

                <label className="settings-field">
                  <span>
                    CONTENT LANGUAGE
                  </span>

                  <select
                    value={contentLanguage}
                    onChange={(event) =>
                      setContentLanguage(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      All languages
                    </option>

                    <option>
                      English
                    </option>

                    <option>
                      Chinese
                    </option>

                    <option>
                      French
                    </option>

                    <option>
                      Spanish
                    </option>
                  </select>
                </label>

                <label className="settings-field">
                  <span>
                    REGION
                  </span>

                  <select
                    value={region}
                    onChange={(event) =>
                      setRegion(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Canada
                    </option>

                    <option>
                      United States
                    </option>

                    <option>
                      Taiwan
                    </option>

                    <option>
                      United Kingdom
                    </option>
                  </select>
                </label>

                <label className="settings-field">
                  <span>
                    DATE FORMAT
                  </span>

                  <select
                    value={dateFormat}
                    onChange={(event) =>
                      setDateFormat(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      DD MM YYYY
                    </option>

                    <option>
                      MM DD YYYY
                    </option>

                    <option>
                      YYYY MM DD
                    </option>
                  </select>
                </label>
              </div>
            </section>

            {/* PRIVACY & DATA */}
            <section className="settings-section">
              <div className="settings-section-heading">
                <div className="settings-section-icon">
                  <Shield size={18} />
                </div>

                <div>
                  <h3>
                    Privacy & Data
                  </h3>

                  <p>
                    Control how your data is
                    used to improve
                    recommendations
                  </p>
                </div>
              </div>

              <div className="settings-option-list">
                <div className="settings-option-row">
                  <div className="settings-option-copy">
                    <h4>
                      Watch history
                    </h4>

                    <p>
                      Save what you&apos;ve
                      watched to improve your
                      recommendations
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`settings-toggle ${
                      watchHistory
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setWatchHistory(
                        (current) =>
                          !current
                      )
                    }
                    aria-label="Toggle watch history"
                    aria-pressed={
                      watchHistory
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="settings-option-row">
                  <div className="settings-option-copy">
                    <h4>
                      Mood data collection
                    </h4>

                    <p>
                      Store mood selections to
                      build a long-term taste
                      profile
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`settings-toggle ${
                      moodData
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setMoodData(
                        (current) =>
                          !current
                      )
                    }
                    aria-label="Toggle mood data collection"
                    aria-pressed={
                      moodData
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="settings-option-row">
                  <div className="settings-option-copy">
                    <h4>
                      Anonymous usage analytics
                    </h4>

                    <p>
                      Share anonymised usage
                      data to help improve
                      Cineri
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`settings-toggle ${
                      analytics
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setAnalytics(
                        (current) =>
                          !current
                      )
                    }
                    aria-label="Toggle anonymous usage analytics"
                    aria-pressed={
                      analytics
                    }
                  >
                    <span />
                  </button>
                </div>
              </div>

              <div className="settings-small-actions">
                <button type="button">
                  <Download size={12} />

                  Download my data
                </button>

                <button type="button">
                  <RotateCcw size={12} />

                  Clear watch history
                </button>
              </div>
            </section>

            {/* ACCESSIBILITY */}
            <section className="settings-section">
              <div className="settings-section-heading">
                <div className="settings-section-icon">
                  <Accessibility size={18} />
                </div>

                <div>
                  <h3>
                    Accessibility
                  </h3>

                  <p>
                    Motion, contrast, and display
                    aids
                  </p>
                </div>
              </div>

              <div className="settings-option-list">
                <div className="settings-option-row">
                  <div className="settings-option-copy">
                    <h4>
                      Reduce motion
                    </h4>

                    <p>
                      Minimise animations and
                      transitions across the app
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`settings-toggle ${
                      reduceMotion
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setReduceMotion(
                        (current) =>
                          !current
                      )
                    }
                    aria-label="Toggle reduced motion"
                    aria-pressed={
                      reduceMotion
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="settings-option-row">
                  <div className="settings-option-copy">
                    <h4>
                      High contrast text
                    </h4>

                    <p>
                      Increase the contrast of
                      body text for legibility
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`settings-toggle ${
                      highContrast
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setHighContrast(
                        (current) =>
                          !current
                      )
                    }
                    aria-label="Toggle high contrast text"
                    aria-pressed={
                      highContrast
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="settings-option-row settings-text-size-row">
                  <div className="settings-option-copy">
                    <h4>
                      Text size
                    </h4>

                    <p>
                      Scale body text size across
                      the app
                    </p>
                  </div>

                  <div className="settings-text-sizes">
                    {(
                      [
                        "S",
                        "M",
                        "L",
                        "XL",
                      ] as TextSize[]
                    ).map((size) => (
                      <button
                        type="button"
                        key={size}
                        className={
                          textSize === size
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setTextSize(size)
                        }
                        aria-pressed={
                          textSize === size
                        }
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* DANGER ZONE */}
            <section className="settings-danger-section">
              <div className="settings-danger-heading">
                <div className="settings-danger-icon">
                  <AlertTriangle size={15} />
                </div>

                <div>
                  <h3>
                    Danger Zone
                  </h3>

                  <p>
                    Irreversible actions —
                    proceed with caution
                  </p>
                </div>
              </div>

              <div className="settings-delete-box">
                <div>
                  <h4>
                    Delete account
                  </h4>

                  <p>
                    Permanently removes your
                    account, all watchlists,
                    preferences and data. This
                    cannot be undone.
                  </p>
                </div>

               <button
                    type="button"
                    onClick={() =>
                        setShowDeleteConfirm(true)
                    }
                    disabled={deletingAccount}
                    >
                    {deletingAccount
                        ? "DELETING..."
                        : "DELETE ACCOUNT"}
                    </button>
              </div>
              {showDeleteConfirm && (
  <div className="settings-delete-confirm">
    <h4>
      Are you sure?
    </h4>

    <p>
      This will permanently delete your
      account, watchlists, preferences,
      reviews, and other saved data.
      This cannot be undone.
    </p>

    {deleteError && (
      <p className="settings-delete-error">
        {deleteError}
      </p>
    )}

    <div className="settings-delete-confirm-actions">
      <button
        type="button"
        onClick={() =>
          setShowDeleteConfirm(false)
        }
        disabled={deletingAccount}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={() =>
          void handleDeleteAccount()
        }
        disabled={deletingAccount}
      >
        {deletingAccount
          ? "Deleting..."
          : "Yes, delete my account"}
      </button>
    </div>
  </div>
)}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}