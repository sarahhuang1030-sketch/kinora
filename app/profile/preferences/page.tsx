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
  CircleUserRound,
  Clapperboard,
  Edit3,
  Film,
  LogOut,
  MonitorPlay,
  Settings,
  SlidersHorizontal,
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
  created_at?: string;
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

type GenreApiItem = {
  genre_name: string;
};

type ContentTypeApiItem = {
  type_name: string;
};

type PreferenceFactorApiItem = {
  factor_name: string;
  description?: string;
};

type GenreOption = {
  genre_name: string;
  genre_icon: string;
  genre_color: string;
};

type ContentTypeOption = {
  type_name: string;
  content_icon: string;
  description?: string;
};

type PreferenceOption = {
  factor_name: string;
  factor_icon: string;
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

export default function PreferencesPage() {
  return (
    <Suspense
      fallback={
        <main className="preferences-page">
          <div className="preferences-loading">
            Loading your preferences...
          </div>
        </main>
      }
    >
      <PreferencesContent />
    </Suspense>
  );
}

function PreferencesContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const sessionUser = session?.user as SessionUser | undefined;
  const email =
    searchParams.get("email") || sessionUser?.email || "";

  const [user, setUser] = useState<User | null>(null);
  const [answers, setAnswers] =
    useState<Answers>(emptyAnswers);

  const [watchlistStats, setWatchlistStats] =
    useState<WatchlistStats>(emptyWatchlistStats);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [genres, setGenres] = useState<GenreOption[]>([]);

const [contentTypes, setContentTypes] =
  useState<ContentTypeOption[]>([]);

const [factors, setFactors] =
  useState<PreferenceOption[]>([]);
  const [selectedGenres, setSelectedGenres] =
    useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] =
    useState<string[]>([]);
  const [selectedFactors, setSelectedFactors] =
    useState<string[]>([]);

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

        if (response.ok) {
          setWatchlistStats(
            data.stats ?? emptyWatchlistStats
          );
        }
      } catch (watchlistError) {
        console.error(
          "Unable to load watchlist stats:",
          watchlistError
        );
      }
    },
    []
  );

  const loadPreferences = useCallback(async () => {
    if (!email) {
      setLoading(false);
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
          data.error || "Unable to load your preferences."
        );
      }

      const loadedUser = data.user as User;
      const loadedAnswers: Answers =
        data.answers ?? emptyAnswers;

      setUser(loadedUser);
      setAnswers(loadedAnswers);

      // These copies are used by edit mode.
      // Existing saved choices are preselected automatically.
      setSelectedGenres(loadedAnswers.genres);
      setSelectedContentTypes(loadedAnswers.contentTypes);
      setSelectedFactors(loadedAnswers.preferences);

      await loadWatchlistStats(loadedUser.user_id);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your preferences."
      );
    } finally {
      setLoading(false);
    }
  }, [email, loadWatchlistStats]);

 const loadEditOptions = useCallback(async () => {
  try {
    setLoadingOptions(true);
    setError("");

    const [
      genresResponse,
      contentTypesResponse,
      factorsResponse,
    ] = await Promise.all([
      fetch("/api/genres", {
        cache: "no-store",
      }),
      fetch("/api/content-types", {
        cache: "no-store",
      }),
      fetch("/api/recommendation-factors", {
        cache: "no-store",
      }),
    ]);

    if (
      !genresResponse.ok ||
      !contentTypesResponse.ok ||
      !factorsResponse.ok
    ) {
      throw new Error(
        "Unable to load preference choices."
      );
    }

    const genresData = await genresResponse.json();
    const contentTypesData =
      await contentTypesResponse.json();
    const factorsData = await factorsResponse.json();

    setGenres(
      genresData.map(
        (item: {
          genre_name: string;
          genre_icon: string;
          genre_color: string;
        }): GenreOption => ({
          genre_name: item.genre_name,
          genre_icon: item.genre_icon,
          genre_color: item.genre_color,
        })
      )
    );

    setContentTypes(
      contentTypesData.map(
        (item: {
          type_name: string;
          content_icon: string;
          description?: string;
        }): ContentTypeOption => ({
          type_name: item.type_name,
          content_icon: item.content_icon,
          description: item.description || "",
        })
      )
    );

    setFactors(
      factorsData.map(
        (item: {
          factor_name: string;
          factor_icon: string;
        }): PreferenceOption => ({
          factor_name: item.factor_name,
          factor_icon: item.factor_icon,
        })
      )
    );
  } catch (optionsError) {
    setError(
      optionsError instanceof Error
        ? optionsError.message
        : "Unable to load preference choices."
    );
  } finally {
    setLoadingOptions(false);
  }
}, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPreferences();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPreferences, status]);

  const displayName = useMemo(() => {
    if (!user) {
      return "";
    }

    return `${user.first_name} ${user.last_name}`.trim();
  }, [user]);

  const profileImage =
    user?.profile_image || sessionUser?.image || "";

  const memberSince = (() => {
    if (!user?.created_at) {
      return new Date().getFullYear();
    }

    const date = new Date(user.created_at);

    return Number.isNaN(date.getTime())
      ? new Date().getFullYear()
      : date.getFullYear();
  })();

  async function handleStartEdit() {
    // Reset the working selections every time Edit opens.
    // This guarantees that the currently saved values are selected.
    setSelectedGenres([...answers.genres]);
    setSelectedContentTypes([...answers.contentTypes]);
    setSelectedFactors([...answers.preferences]);

    setIsEditing(true);

    if (
      genres.length === 0 ||
      contentTypes.length === 0 ||
      factors.length === 0
    ) {
      await loadEditOptions();
    }
  }

  function handleCancelEdit() {
    // Restore the last saved database values.
    setSelectedGenres([...answers.genres]);
    setSelectedContentTypes([...answers.contentTypes]);
    setSelectedFactors([...answers.preferences]);
    setError("");
    setIsEditing(false);
  }

  async function handleSavePreferences() {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const updatedAnswers: Answers = {
        genres: selectedGenres,
        streamingServices: answers.streamingServices,
        contentTypes: selectedContentTypes,
        preferences: selectedFactors,
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          ...updatedAnswers,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save your preferences."
        );
      }

      setAnswers(updatedAnswers);
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your preferences."
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
          "Content-Type": "application/json",
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

  if (status === "loading" || loading) {
    return (
      <main className="preferences-page">
        <div className="preferences-loading">
          Loading your preferences...
        </div>
      </main>
    );
  }

  if (!sessionUser?.email) {
    return (
      <main className="preferences-page">
        <section className="preferences-message-card">
          <CircleUserRound size={44} />

          <h1>Sign in to view your preferences</h1>

          <p>
            Manage the choices Cineri uses to personalize
            your recommendations.
          </p>

          <Link href="/login">Sign In</Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="preferences-page">
        <section className="preferences-message-card">
          <CircleUserRound size={44} />

          <h1>Preferences unavailable</h1>

          <p>
            {error ||
              "We could not find your preference information."}
          </p>

          <button
            type="button"
            onClick={() => void loadPreferences()}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="preferences-page">
      <div className="preferences-shell">
        <h1 className="preferences-welcome">
          Welcome, <span>{user.first_name}!</span>
        </h1>

        <div className="preferences-layout">
          <aside className="watchlists-account-sidebar preferences-sidebar">
            <div>
              <p className="watchlists-sidebar-heading">
                Account
              </p>

              <div className="watchlists-sidebar-links">
                <Link href="/profile">
                  <CircleUserRound size={17} />
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
                <Link
                  href="/profile/preferences"
                  className="watchlists-sidebar-active"
                >
                  <Settings
                    size={17}
                    fill="currentColor"
                  />
                  <span>Preferences</span>
                </Link>

                <Link href="/privacy">
                  <UserRound size={17} />
                  <span>Privacy</span>
                </Link>
              </div>
            </div>

            <button
              type="button"
              className="watchlists-logout"
              onClick={() => void handleLogout()}
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button>
          </aside>

          <section className="preferences-card">
            {error && (
              <div className="preferences-error">
                {error}
              </div>
            )}

            <header className="preferences-user-header">
              <div className="preferences-avatar">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${displayName}'s profile`}
                  />
                ) : (
                  <UserRound
                    size={32}
                    strokeWidth={1.6}
                  />
                )}
              </div>

              <div className="preferences-user-copy">
                <h2>{displayName}</h2>
                <p>{user.email}</p>
                <span>Member since {memberSince}</span>
              </div>

              <Link
                href="/profile"
                className="preferences-edit-profile"
              >
                <Edit3 size={13} />
                Edit profile
              </Link>
            </header>

            {isEditing ? (
              <PreferencesEditForm
                genres={genres}
                contentTypes={contentTypes}
                factors={factors}
                selectedGenres={selectedGenres}
                selectedContentTypes={selectedContentTypes}
                selectedFactors={selectedFactors}
                loadingOptions={loadingOptions}
                saving={saving}
                onGenresChange={setSelectedGenres}
                onContentTypesChange={
                  setSelectedContentTypes
                }
                onFactorsChange={setSelectedFactors}
                onCancel={handleCancelEdit}
                onSave={() =>
                  void handleSavePreferences()
                }
              />
            ) : (
              <PreferencesSummary
                answers={answers}
                watchlistStats={watchlistStats}
                memberSince={memberSince}
                onEdit={() => void handleStartEdit()}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function PreferencesSummary({
  answers,
  watchlistStats,
  memberSince,
  onEdit,
}: {
  answers: Answers;
  watchlistStats: WatchlistStats;
  memberSince: number;
  onEdit: () => void;
}) {
  return (
    <>
      <section className="preferences-content-section">
        <div className="preferences-section-title-row">
          <h2>Content Preferences</h2>

          <button
            type="button"
            className="preferences-edit-button"
            onClick={onEdit}
          >
            <Edit3 size={13} />
            Edit
          </button>
        </div>

        <div className="preferences-choice-card">
          <PreferenceBlock
            icon={<Film size={18} />}
            title="Favourite genres"
            values={answers.genres}
            variant="genres"
          />

          <div className="preferences-choice-divider" />

          <PreferenceBlock
            icon={<MonitorPlay size={18} />}
            title="Prefer to watch"
            values={answers.contentTypes}
            variant="content"
          />

          <div className="preferences-choice-divider" />

          <PreferenceBlock
            icon={<Clapperboard size={18} />}
            title="What matters the most"
            values={answers.preferences}
            variant="factors"
          />
        </div>
      </section>

      <section className="preferences-activity-section">
        <h2>Your Activity</h2>

        <div className="preferences-activity-grid">
          <ActivityCell
            value={answers.genres.length}
            label="Genres selected"
            description={`Since June ${memberSince}`}
          />

          <ActivityCell
            value={watchlistStats.total_watchlists}
            label="Watchlists"
            description={`${watchlistStats.total_items} titles total`}
          />

          <ActivityCell
            value={answers.streamingServices.length}
            label="Services linked"
            description={
              answers.streamingServices.length > 0
                ? answers.streamingServices
                    .slice(0, 3)
                    .join(" · ")
                : "None connected"
            }
          />
        </div>
      </section>
    </>
  );
}

function PreferencesEditForm({
  genres,
  contentTypes,
  factors,
  selectedGenres,
  selectedContentTypes,
  selectedFactors,
  loadingOptions,
  saving,
  onGenresChange,
  onContentTypesChange,
  onFactorsChange,
  onCancel,
  onSave,
}: {
    genres: GenreOption[];
    contentTypes: ContentTypeOption[];
    factors: PreferenceOption[];
  selectedGenres: string[];
  selectedContentTypes: string[];
  selectedFactors: string[];
  loadingOptions: boolean;
  saving: boolean;
  onGenresChange: (values: string[]) => void;
  onContentTypesChange: (values: string[]) => void;
  onFactorsChange: (values: string[]) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="preferences-edit-mode">
      <div className="preferences-edit-heading">
        <h2>Content Preferences</h2>
        <p>
          Update your favourite genres, content preferences,
          and what matters the most.
        </p>
      </div>

      {loadingOptions ? (
        <div className="preferences-edit-loading">
          Loading preference choices...
        </div>
      ) : (
        <div className="preferences-edit-body">
          <PreferenceSelectionGroup
            title="Genres"
            options={genres}
            selected={selectedGenres}
            onChange={onGenresChange}
            variant="genres"
            />

            <PreferenceSelectionGroup
            title="What matters the most"
            options={factors}
            selected={selectedFactors}
            onChange={onFactorsChange}
            variant="factors"
            />

            <PreferenceSelectionGroup
            title="Content type"
            options={contentTypes}
            selected={selectedContentTypes}
            onChange={onContentTypesChange}
            variant="content"
            />
        </div>
      )}

      <div className="preferences-edit-actions">
        <button
          type="button"
          className="preferences-cancel-button"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="button"
          className="preferences-save-button"
          disabled={saving || loadingOptions}
          onClick={onSave}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
}

function PreferenceSelectionGroup({
  title,
  options,
  selected,
  onChange,
  variant,
}: {
  title: string;
  options: (
    | string
    | GenreOption
    | ContentTypeOption
    | PreferenceOption
  )[];
  selected: string[];
  onChange: (values: string[]) => void;
  variant: "genres" | "content" | "factors";
}) {
  function toggleOption(optionName: string) {
    if (
      variant === "content" &&
      optionName === "No Preference"
    ) {
      onChange(["No Preference"]);
      return;
    }

    let nextValues = [...selected];

    if (variant === "content") {
      nextValues = nextValues.filter(
        (value) => value !== "No Preference"
      );
    }

    nextValues = nextValues.includes(optionName)
      ? nextValues.filter(
          (value) => value !== optionName
        )
      : [...nextValues, optionName];

    onChange(nextValues);
  }

  return (
    <section className="preferences-selection-group">
      <h3>{title}</h3>

      <div
        className={`preferences-selection-grid preferences-selection-grid-${variant}`}
      >
        {options.map((option) => {
          const isString = typeof option === "string";

          const optionName = isString
            ? option
            : "genre_name" in option
              ? option.genre_name
              : "type_name" in option
                ? option.type_name
                : option.factor_name;

          const icon = isString
            ? ""
            : "genre_icon" in option
              ? option.genre_icon
              : "content_icon" in option
                ? option.content_icon
                : option.factor_icon;

          const description =
            !isString && "description" in option
              ? option.description || ""
              : "";

          const genreColor =
            !isString && "genre_color" in option
              ? option.genre_color
              : "";

          const active = selected.includes(optionName);

          return (
            <button
              key={optionName}
              type="button"
              className={`preferences-selection-option ${
                variant === "genres"
                  ? "preferences-genre-option"
                  : ""
              } ${active ? "active" : ""}`}
              style={
                genreColor
                  ? ({
                      "--genre-color": genreColor,
                    } as React.CSSProperties)
                  : undefined
              }
              aria-pressed={active}
              onClick={() => toggleOption(optionName)}
            >
              {icon && (
                <span className="preferences-option-icon">
                  <img
                    src={icon}
                    alt=""
                    aria-hidden="true"
                  />
                </span>
              )}

              <span className="preferences-option-copy">
                <strong>{optionName}</strong>

                {description && (
                  <small>{description}</small>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PreferenceBlock({
  icon,
  title,
  values,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  values: string[];
  variant: "genres" | "content" | "factors";
}) {
  const visibleValues = values.slice(0, 5);
  const remaining = Math.max(
    values.length - visibleValues.length,
    0
  );

  return (
    <div className="preferences-block">
      <span className="preferences-block-icon">
        {icon}
      </span>

      <div>
        <div className="preferences-block-heading">
          <strong>{title}</strong>
          <span>{values.length} selected</span>
        </div>

        <div className="preferences-chip-list">
          {visibleValues.length > 0 ? (
            <>
              {visibleValues.map((value, index) => (
                <span
                  key={value}
                  className={`preferences-chip ${
                    variant === "genres"
                      ? `genre-${index % 3}`
                      : ""
                  }`}
                >
                  {variant === "genres" && (
                    <SlidersHorizontal size={9} />
                  )}
                  {value}
                </span>
              ))}

              {remaining > 0 && (
                <span className="preferences-chip">
                  +{remaining}
                </span>
              )}
            </>
          ) : (
            <span className="preferences-empty">
              Not selected yet
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityCell({
  value,
  label,
  description,
}: {
  value: number;
  label: string;
  description: string;
}) {
  return (
    <article className="preferences-activity-cell">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{description}</p>
    </article>
  );
}