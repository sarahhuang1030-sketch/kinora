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
  Camera,
  ChevronRight,
  CircleUserRound,
  Film,
  Heart,
  LogOut,
  MonitorPlay,
  Settings,
  Sparkles,
  Trash2,
  Tv,
  UserRound,
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
  phone: string;
  country?: string;
  date_of_birth?: string;
  profile_image?: string;
};

type Answers = {
  genres: string[];
  streamingServices: string[];
  contentTypes: string[];
  preferences: string[];
};

type WatchlistStats = {
  total_watchlists: number;
  total_items: number;
  movies: number;
  tv_shows: number;
  completed: number;
};

type WatchlistApiResponse = {
  stats?: WatchlistStats;
};

const emptyAnswers: Answers = {
  genres: [],
  streamingServices: [],
  contentTypes: [],
  preferences: [],
};

const emptyWatchlistStats: WatchlistStats = {
  total_watchlists: 0,
  total_items: 0,
  movies: 0,
  tv_shows: 0,
  completed: 0,
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="account-profile-page">
          <div className="account-profile-loading">
            Loading your profile...
          </div>
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const sessionUser = session?.user as SessionUser | undefined;

  const emailFromUrl = searchParams.get("email");
  const email = emailFromUrl || sessionUser?.email || "";

  const isSocialNewUser =
    searchParams.get("socialNewUser") === "true";

  const [user, setUser] = useState<User | null>(null);
  const [answers, setAnswers] =
    useState<Answers>(emptyAnswers);

  const [profileImage, setProfileImage] = useState("");
  const [connectedServices, setConnectedServices] = useState<
    string[]
  >([]);

  const [watchlistStats, setWatchlistStats] =
    useState<WatchlistStats>(emptyWatchlistStats);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const loadWatchlistStats = useCallback(
    async (userId: number) => {
      try {
        const response = await fetch(
          `/api/watchlists?userId=${userId}`,
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as WatchlistApiResponse;

        if (!response.ok) {
          return;
        }

        setWatchlistStats(
          data.stats ?? emptyWatchlistStats
        );
      } catch (watchlistError) {
        console.error(
          "Unable to load watchlist stats:",
          watchlistError
        );
      }
    },
    []
  );

  const loadUser = useCallback(async () => {
    if (!email) {
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
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
          data.error || "Unable to load your profile."
        );
      }

      const loadedUser = data.user as User;

      setUser(loadedUser);
      setAnswers(data.answers ?? emptyAnswers);

      setProfileImage(
        loadedUser.profile_image ||
          sessionUser?.image ||
          ""
      );

      await loadWatchlistStats(loadedUser.user_id);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [email, loadWatchlistStats, sessionUser?.image]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    void loadUser();
  }, [loadUser, status]);

  useEffect(() => {
    try {
      const savedServices =
        localStorage.getItem("connectedServices");

      if (!savedServices) {
        return;
      }

      const parsedServices = JSON.parse(savedServices);

      if (Array.isArray(parsedServices)) {
        setConnectedServices(parsedServices);
      }
    } catch (storageError) {
      console.error(
        "Unable to read connected services:",
        storageError
      );
    }
  }, []);

  useEffect(() => {
    async function savePendingSocialAnswers() {
      if (!isSocialNewUser || !user) {
        return;
      }

      const saved = localStorage.getItem(
        "pendingOnboardingAnswers"
      );

      if (!saved) {
        return;
      }

      try {
        const pendingAnswers = JSON.parse(
          saved
        ) as Answers;

        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.user_id,
            ...pendingAnswers,
          }),
        });

        if (!response.ok) {
          return;
        }

        setAnswers(pendingAnswers);

        localStorage.removeItem(
          "pendingOnboardingAnswers"
        );

        window.history.replaceState(
          {},
          "",
          "/profile"
        );
      } catch (saveError) {
        console.error(
          "Unable to save pending onboarding answers:",
          saveError
        );
      }
    }

    void savePendingSocialAnswers();
  }, [isSocialNewUser, user]);

  const displayName = useMemo(() => {
    if (!user) {
      return "";
    }

    return `${user.first_name} ${user.last_name}`.trim();
  }, [user]);

  const initials = useMemo(() => {
    if (!user) {
      return "";
    }

    return `${user.first_name?.charAt(0) || ""}${
      user.last_name?.charAt(0) || ""
    }`.toUpperCase();
  }, [user]);

  const favoriteMood = useMemo(() => {
    return answers.preferences[0] || "Not selected";
  }, [answers.preferences]);

  async function handleProfileImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !user) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setError("Profile image must be smaller than 5 MB.");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");

      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const imageBase64 = reader.result as string;

          const response = await fetch(
            "/api/profile-image",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.user_id,
                profileImage: imageBase64,
              }),
            }
          );

          const data = await response
            .json()
            .catch(() => null);

          if (!response.ok) {
            throw new Error(
              data?.error ||
                "Unable to update your profile image."
            );
          }

          setProfileImage(imageBase64);
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Unable to update your profile image."
          );
        } finally {
          setUploadingImage(false);
        }
      };

      reader.onerror = () => {
        setUploadingImage(false);
        setError("Unable to read the selected image.");
      };

      reader.readAsDataURL(file);
    } catch (uploadError) {
      setUploadingImage(false);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to update your profile image."
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleRemoveProfileImage() {
    if (!user) {
      return;
    }

    try {
      setUploadingImage(true);
      setError("");

      const response = await fetch(
        "/api/profile-image",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.user_id,
            profileImage: "",
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to remove your profile image."
        );
      }

      setProfileImage("");
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove your profile image."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.email,
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

  if (status === "loading" || loadingProfile) {
    return (
      <main className="account-profile-page">
        <div className="account-profile-loading">
          Loading your profile...
        </div>
      </main>
    );
  }

  if (!sessionUser?.email) {
    return (
      <main className="account-profile-page">
        <section className="account-profile-login-card">
          <CircleUserRound size={44} />

          <h1>Sign in to view your profile</h1>

          <p>
            Manage your personal information, preferences,
            watchlists and streaming services.
          </p>

          <Link href="/login">Sign In</Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="account-profile-page">
        <section className="account-profile-login-card">
          <CircleUserRound size={44} />

          <h1>Profile unavailable</h1>

          <p>
            {error ||
              "We could not find your profile information."}
          </p>

          <button
            type="button"
            onClick={() => void loadUser()}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="account-profile-page">
      <div className="account-profile-shell">
        <div className="account-profile-layout">
          <aside className="watchlists-account-sidebar">
            <p className="watchlists-sidebar-heading">
              Account
            </p>

            <div className="watchlists-sidebar-links">
              <Link
                href="/profile"
                
              >
                <CircleUserRound
                  size={17}
                />
                <span>Profile</span>
              </Link>

              <Link href="/profile/streaming-services">
                <MonitorPlay size={17} />
                <span>Streaming Services</span>
              </Link>

              <Link href="/watchlists">
                <Bookmark size={17} />
                <span>Watchlist</span>
              </Link>
            </div>

            <div className="watchlists-sidebar-divider" />

            <p className="watchlists-sidebar-heading">
              Settings
            </p>

            <div className="watchlists-sidebar-links">
              <Link href="/profile/preferences" className="watchlists-sidebar-active">
                <Settings size={17} fill="currentColor"/>
                <span>Preferences</span>
              </Link>

              <Link href="/privacy">
                <UserRound size={17} />
                <span>Privacy</span>
              </Link>
            </div>

            <div className="watchlists-sidebar-space" />

            <button
              type="button"
              className="watchlists-logout"
              onClick={() => void handleLogout()}
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button>
          </aside>

          <section className="account-profile-content">
            <div className="account-profile-welcome">
              Welcome, <span>{user.first_name}!</span>
            </div>

            {error && (
              <div className="account-profile-error">
                {error}
              </div>
            )}

            <section className="account-profile-main-card">
              <div className="account-profile-user">
                <div className="account-profile-avatar-area">
                  <div className="account-profile-avatar">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={`${displayName}'s profile`}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <label
                    className={`account-profile-camera ${
                      uploadingImage ? "disabled" : ""
                    }`}
                    aria-label="Upload profile image"
                  >
                    <Camera size={15} />

                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingImage}
                      onChange={
                        handleProfileImageUpload
                      }
                    />
                  </label>
                </div>

                <div className="account-profile-user-info">
                  <h1>{displayName}</h1>

                  <p>@{user.username}</p>

                  <span>
                    Member since{" "}
                    {new Date().getFullYear()}
                  </span>
                </div>

                <div className="account-profile-user-actions">
                  <Link
                    href="/profile/edit"
                    className="account-profile-edit-button"
                  >
                    <Settings size={15} />
                    Edit profile
                  </Link>

                  {profileImage && (
                    <button
                      type="button"
                      className="account-profile-remove-button"
                      disabled={uploadingImage}
                      onClick={() =>
                        void handleRemoveProfileImage()
                      }
                    >
                      <Trash2 size={14} />
                      Remove image
                    </button>
                  )}
                </div>
              </div>

              <div className="account-profile-divider" />

              <div className="account-profile-section-heading">
                <div>
                  <h2>Content Preferences</h2>
                  <p>
                    Your selections help personalize your
                    recommendations.
                  </p>
                </div>

                <Link href="/profile/preferences">
                  Edit
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="account-preference-list">
                <PreferenceRow
                  icon={<Film size={17} />}
                  title="Favorite genres"
                  values={answers.genres}
                />

                <PreferenceRow
                  icon={<Heart size={17} />}
                  title="Favorite mood"
                  values={
                    favoriteMood === "Not selected"
                      ? []
                      : [favoriteMood]
                  }
                />

                <PreferenceRow
                  icon={<Tv size={17} />}
                  title="Content types"
                  values={answers.contentTypes}
                />

                <PreferenceRow
                  icon={<Sparkles size={17} />}
                  title="What matters most"
                  values={answers.preferences}
                />
              </div>
            </section>

            <section className="account-profile-activity">
              <div className="account-profile-section-heading">
                <div>
                  <h2>Your Activity</h2>

                  <p>
                    A quick overview of your Cineri account.
                  </p>
                </div>
              </div>

              <div className="account-profile-stat-grid">
                <ActivityCard
                  value={answers.genres.length}
                  label="Genres Selected"
                  description="Used for recommendations"
                  icon={<Film size={18} />}
                />

                <ActivityCard
                  value={watchlistStats.total_watchlists}
                  label="Watchlists"
                  description={`${watchlistStats.total_items} saved titles`}
                  icon={<Bookmark size={18} />}
                />

                <ActivityCard
                  value={connectedServices.length}
                  label="Streaming Services"
                  description="Connected accounts"
                  icon={<MonitorPlay size={18} />}
                />
              </div>
            </section>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .account-profile-page {
          min-height: calc(100vh - 64px);
          margin-top: 0;
          padding: 112px 48px 60px;
          background: #081522;
          color: #f8fafc;
        }

        .account-profile-shell {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .account-profile-welcome {
          margin: 0;
          font-size: clamp(1.65rem, 2.4vw, 2.25rem);
          font-weight: 750;
          letter-spacing: -0.04em;
        }

        .account-profile-welcome span {
          color: #ff7a1a;
        }

        .account-profile-layout {
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          align-items: start;
          gap: 36px;
        }

        .account-profile-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .account-profile-main-card,
        .account-profile-activity {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 14px;
          background: #101d2e;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
        }

        .account-profile-main-card {
          padding: 24px;
          border-top-color: rgba(255, 173, 65, 0.75);
        }

        .account-profile-user {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .account-profile-avatar-area {
          position: relative;
          flex: 0 0 auto;
        }

        .account-profile-avatar {
          width: 78px;
          height: 78px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 2px solid #ff7a1a;
          border-radius: 50%;
          background: linear-gradient(
            145deg,
            #ff8b20,
            #ff5f2e
          );
          box-shadow: 0 10px 24px
            rgba(255, 112, 28, 0.22);
        }

        .account-profile-avatar img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .account-profile-avatar span {
          color: #081522;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .account-profile-camera {
          position: absolute;
          right: -2px;
          bottom: -1px;
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border: 2px solid #101d2e;
          border-radius: 50%;
          color: #ffffff;
          background: #ff6b2c;
          cursor: pointer;
          transition:
            transform 160ms ease,
            background 160ms ease;
        }

        .account-profile-camera:hover {
          transform: translateY(-1px);
          background: #ff813f;
        }

        .account-profile-camera.disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .account-profile-user-info {
          min-width: 0;
          flex: 1;
        }

        .account-profile-user-info h1 {
          margin: 0 0 3px;
          font-size: 1.2rem;
          font-weight: 750;
        }

        .account-profile-user-info p {
          margin: 0 0 5px;
          color: #9caabd;
          font-size: 0.86rem;
        }

        .account-profile-user-info span {
          color: #6f8094;
          font-size: 0.74rem;
        }

        .account-profile-user-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .account-profile-edit-button,
        .account-profile-remove-button {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 13px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-decoration: none;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .account-profile-edit-button {
          border: 1px solid rgba(148, 163, 184, 0.23);
          color: #e9eef5;
          background: #1a293d;
        }

        .account-profile-edit-button:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 122, 26, 0.55);
          background: #21334b;
        }

        .account-profile-remove-button {
          min-height: auto;
          padding: 0;
          border: 0;
          color: #8e9bad;
          background: transparent;
          cursor: pointer;
        }

        .account-profile-remove-button:hover {
          color: #ff756c;
        }

        .account-profile-remove-button:disabled {
          cursor: wait;
          opacity: 0.55;
        }

        .account-profile-divider {
          height: 1px;
          margin: 22px 0;
          background: rgba(148, 163, 184, 0.12);
        }

        .account-profile-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
        }

        .account-profile-section-heading h2 {
          margin: 0 0 4px;
          font-size: 0.98rem;
          font-weight: 750;
        }

        .account-profile-section-heading p {
          margin: 0;
          color: #78889b;
          font-size: 0.72rem;
        }

        .account-profile-section-heading > a {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #c0cad7;
          font-size: 0.72rem;
          font-weight: 650;
          text-decoration: none;
        }

        .account-profile-section-heading > a:hover {
          color: #ff8b36;
        }

        .account-preference-list {
          display: grid;
          gap: 9px;
        }

        .account-preference-row {
          min-height: 58px;
          display: grid;
          grid-template-columns: 30px 145px minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          padding: 10px 13px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 9px;
          background: #142237;
        }

        .account-preference-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #ff8a32;
          background: rgba(255, 122, 26, 0.1);
        }

        .account-preference-row strong {
          color: #dce5ef;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .account-preference-values {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }

        .account-preference-chip {
          display: inline-flex;
          align-items: center;
          min-height: 23px;
          padding: 0 9px;
          border: 1px solid rgba(68, 184, 130, 0.22);
          border-radius: 999px;
          color: #73d7ae;
          background: rgba(42, 152, 105, 0.1);
          font-size: 0.63rem;
          font-weight: 650;
        }

        .account-preference-empty {
          color: #69798d;
          font-size: 0.7rem;
        }

        .account-profile-activity {
          padding: 21px 24px 24px;
        }

        .account-profile-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .account-profile-stat {
          position: relative;
          min-height: 95px;
          padding: 17px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 10px;
          background: #17263a;
        }

        .account-profile-stat-icon {
          position: absolute;
          right: 14px;
          top: 14px;
          color: rgba(255, 134, 51, 0.72);
        }

        .account-profile-stat strong {
          display: block;
          margin-bottom: 5px;
          color: #ff8a32;
          font-size: 1.45rem;
          line-height: 1;
        }

        .account-profile-stat span {
          display: block;
          margin-bottom: 3px;
          color: #e0e8f1;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .account-profile-stat p {
          margin: 0;
          color: #75859a;
          font-size: 0.63rem;
        }

        .account-profile-error {
          padding: 11px 14px;
          border: 1px solid rgba(255, 99, 92, 0.3);
          border-radius: 9px;
          color: #ffaaa5;
          background: rgba(153, 27, 27, 0.16);
          font-size: 0.77rem;
        }

        .account-profile-loading {
          min-height: 55vh;
          display: grid;
          place-items: center;
          color: #91a0b3;
        }

        .account-profile-login-card {
          width: min(500px, 100%);
          margin: 80px auto;
          padding: 42px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          color: #e8eef5;
          background: #101d2e;
          text-align: center;
        }

        .account-profile-login-card svg {
          color: #ff7a1a;
        }

        .account-profile-login-card h1 {
          margin: 18px 0 10px;
        }

        .account-profile-login-card p {
          margin: 0 0 22px;
          color: #8b99aa;
          line-height: 1.65;
        }

        .account-profile-login-card a,
        .account-profile-login-card button {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          padding: 0 22px;
          border: 0;
          border-radius: 9px;
          color: #ffffff;
          background: linear-gradient(
            135deg,
            #ff8a2b,
            #ff5e31
          );
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .account-profile-layout {
            grid-template-columns: 1fr;
          }

          .watchlists-account-sidebar {
            min-height: auto;
          }

          .account-profile-stat-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .account-profile-page {
            padding: 95px 20px 50px;
          }

          .account-profile-main-card,
          .account-profile-activity {
            padding: 18px;
          }

          .account-profile-user {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .account-profile-user-actions {
            width: 100%;
            align-items: flex-start;
          }

          .account-preference-row {
            grid-template-columns: 30px minmax(0, 1fr);
          }

          .account-preference-values {
            grid-column: 1 / -1;
            justify-content: flex-start;
            padding-left: 42px;
          }
        }
      `}</style>
    </main>
  );
}

function PreferenceRow({
  icon,
  title,
  values,
}: {
  icon: React.ReactNode;
  title: string;
  values: string[];
}) {
  const visibleValues = values.slice(0, 4);
  const remainingValues = Math.max(
    values.length - visibleValues.length,
    0
  );

  return (
    <div className="account-preference-row">
      <span className="account-preference-icon">
        {icon}
      </span>

      <strong>{title}</strong>

      <div className="account-preference-values">
        {visibleValues.length > 0 ? (
          <>
            {visibleValues.map((value) => (
              <span
                key={value}
                className="account-preference-chip"
              >
                {value}
              </span>
            ))}

            {remainingValues > 0 && (
              <span className="account-preference-chip">
                +{remainingValues}
              </span>
            )}
          </>
        ) : (
          <span className="account-preference-empty">
            Not selected yet
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityCard({
  value,
  label,
  description,
  icon,
}: {
  value: number;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="account-profile-stat">
      <span className="account-profile-stat-icon">
        {icon}
      </span>

      <strong>{value}</strong>
      <span>{label}</span>
      <p>{description}</p>
    </article>
  );
}