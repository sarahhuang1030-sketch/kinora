"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Bookmark,
  CalendarDays,
  Camera,
  CircleUserRound,
  Eye,
  EyeOff,
  Globe2,
  Languages,
  LockKeyhole,
  LogOut,
  Mail,
  MonitorPlay,
  Pencil,
  Save,
  Settings,
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

type EditForm = {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  date_of_birth: string;
  language: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyForm: EditForm = {
  first_name: "",
  last_name: "",
  email: "",
  country: "Canada",
  date_of_birth: "",
  language: "English",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="profile-edit-page">
          <div className="profile-edit-loading">Loading your profile...</div>
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
  const sessionImage = sessionUser?.image ?? "";
  const emailFromUrl = searchParams.get("email");
  const email = emailFromUrl || sessionUser?.email || "";

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [profileImage, setProfileImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const loadUser = useCallback(async () => {
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
        data.error || "Unable to load your profile."
      );
    }

    const loadedUser = data.user as User;

    setUser(loadedUser);

    setProfileImage(
  loadedUser.profile_image || sessionImage
);

    setForm({
      first_name: loadedUser.first_name || "",
      last_name: loadedUser.last_name || "",
      email: loadedUser.email || "",
      country: loadedUser.country || "Canada",
      date_of_birth: loadedUser.date_of_birth
        ? loadedUser.date_of_birth.slice(0, 10)
        : "",
      language: "English",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  } catch (loadError) {
    setError(
      loadError instanceof Error
        ? loadError.message
        : "Unable to load your profile."
    );
  } finally {
    setLoading(false);
  }
}, [email, sessionImage]);

  useEffect(() => {
  if (status === "loading") {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    void loadUser();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadUser, status]);

  const initials = useMemo(() => {
    const first = form.first_name.charAt(0);
    const last = form.last_name.charAt(0);
    return `${first}${last}`.toUpperCase() || "U";
  }, [form.first_name, form.last_name]);

  function updateForm<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleProfileImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be smaller than 5 MB.");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      const imageBase64 = await readFileAsDataUrl(file);

      const response = await fetch("/api/profile-image", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user_id,
          profileImage: imageBase64,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update profile image.");
      }

      setProfileImage(imageBase64);
      setSuccess("Profile picture updated.");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      window.dispatchEvent(
  new CustomEvent("profile-updated", {
    detail: {
      profileImage: imageBase64,
      firstName: form.first_name,
      lastName: form.last_name,
    },
  })
);
      
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to update profile image."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const updatedEmail = form.email.trim();

    if (!firstName || !lastName) {
      setError("Please enter both your first and last name.");
      return;
    }

    if (!updatedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (form.newPassword && !form.currentPassword) {
      setError("Enter your current password before choosing a new password.");
      return;
    }

    if (form.newPassword && form.newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const requestBody = {
        ...user,
        first_name: firstName,
        last_name: lastName,
        email: updatedEmail,
        country: form.country,
        date_of_birth: form.date_of_birth,
        language: form.language,
        ...(form.newPassword
          ? {
              currentPassword: form.currentPassword,
              newPassword: form.newPassword,
            }
          : {}),
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save your profile.");
      }

      const updatedUser: User = {
        ...user,
        first_name: firstName,
        last_name: lastName,
        email: updatedEmail,
        country: form.country,
        date_of_birth: form.date_of_birth,
      };

      setUser(updatedUser);
      setForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSuccess("Your profile was saved successfully.");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      window.dispatchEvent(
      new CustomEvent("Profile Updated")
      );
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!user) return;

    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      country: user.country || "Canada",
      date_of_birth: user.date_of_birth
        ? user.date_of_birth.slice(0, 10)
        : "",
      language: "English",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
    setIsEditing(false);
  }

  function handleStartEditing() {
    setError("");
    setSuccess("");
    setIsEditing(true);
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      });
    } catch (logoutError) {
      console.error("Logout tracking failed:", logoutError);
    }

    await signOut({ callbackUrl: "/" });
  }

  if (status === "loading" || loading) {
    return (
      <main className="profile-edit-page">
        <div className="profile-edit-loading">Loading your profile...</div>
      </main>
    );
  }

  if (!sessionUser?.email) {
    return (
      <main className="profile-edit-page">
        <section className="profile-edit-login-card">
          <CircleUserRound size={44} />
          <h1>Sign in to view your profile</h1>
          <p>Manage your personal information and account settings.</p>
          <Link href="/login">Sign In</Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-edit-page">
        <section className="profile-edit-login-card">
          <CircleUserRound size={44} />
          <h1>Profile unavailable</h1>
          <p>{error || "We could not find your profile information."}</p>
          <button type="button" onClick={() => void loadUser()}>
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-edit-page">
      <div className="profile-edit-shell">
        <h1 className="profile-edit-welcome">
          Welcome, <span>{user.first_name}!</span>
        </h1>

        <div className="profile-edit-layout">
          <aside className="watchlists-account-sidebar profile-edit-sidebar">
            <p className="watchlists-sidebar-heading">Account</p>

            <div className="watchlists-sidebar-links">
              <Link href="/profile" className="watchlists-sidebar-active">
                <CircleUserRound size={17} fill="currentColor" />
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

            <p className="watchlists-sidebar-heading">Settings</p>

            <div className="watchlists-sidebar-links">
              <Link href="/profile/preferences">
                <Settings size={17} />
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

          <section className="profile-edit-content">
            <section className="profile-edit-hero-card">
              <div className="profile-edit-avatar-wrap">
                <div className="profile-edit-avatar">
                  {profileImage ? (
                    <img src={profileImage} alt={`${user.first_name}'s profile`} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
              </div>

              <div className="profile-edit-hero-copy">
                <h2>Edit Profile</h2>
                <p>Keep your account details and profile picture up to date.</p>

                <label
                  className={`profile-edit-picture-button ${
                    uploadingImage ? "disabled" : ""
                  }`}
                >
                  <Camera size={14} />
                  {uploadingImage ? "Uploading..." : "Edit profile picture"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploadingImage}
                    onChange={handleProfileImageUpload}
                  />
                </label>
              </div>
            </section>

            <section className="profile-edit-form-card">
              <div className="profile-edit-card-heading">
                <div>
                  <h2>Personal Information</h2>
                  <p>View and manage your personal account information.</p>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    className="profile-edit-mode-button"
                    onClick={handleStartEditing}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                )}
              </div>

              {(error || success) && (
                <div
                  className={`profile-edit-message ${
                    error ? "error" : "success"
                  }`}
                >
                  {error || success}
                </div>
              )}

              <div className="profile-edit-form-section">
                <p className="profile-edit-section-label">Basic Information</p>

                <div className="profile-edit-grid">
                  <Field label="First name" icon={<UserRound size={15} />}>
                    <input
                      value={form.first_name}
                      autoComplete="given-name"
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateForm("first_name", event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Last name" icon={<UserRound size={15} />}>
                    <input
                      value={form.last_name}
                      autoComplete="family-name"
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateForm("last_name", event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Date of birth" icon={<CalendarDays size={15} />}>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateForm("date_of_birth", event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Country" icon={<Globe2 size={15} />}>
                    <select
                      value={form.country}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateForm("country", event.target.value)
                      }
                    >
                      <option value="">Select country</option>
                      <option value="Canada">Canada</option>
                      <option value="United States">United States</option>
                      <option value="Taiwan">Taiwan</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </Field>

                  <Field label="Language" icon={<Languages size={15} />}>
                    <select
                      value={form.language}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateForm("language", event.target.value)
                      }
                    >
                      <option value="English">English</option>
                      <option value="Traditional Chinese">
                        Traditional Chinese
                      </option>
                      <option value="Simplified Chinese">
                        Simplified Chinese
                      </option>
                      <option value="French">French</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="profile-edit-form-section profile-edit-security-section">
                <p className="profile-edit-section-label">Login &amp; Security</p>

                <div className="profile-edit-grid">
                  <Field label="Email address" icon={<Mail size={15} />}>
                    <input
                      type="email"
                      value={form.email}
                      autoComplete="email"
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Current password"
                    icon={<LockKeyhole size={15} />}
                  >
                    <PasswordInput
                      value={form.currentPassword}
                      visible={showCurrentPassword}
                      placeholder="Enter to change password"
                      autoComplete="current-password"
                      disabled={!isEditing}
                      onChange={(value) => updateForm("currentPassword", value)}
                      onToggle={() =>
                        setShowCurrentPassword((current) => !current)
                      }
                    />
                  </Field>

                  <Field label="New password" icon={<LockKeyhole size={15} />}>
                    <PasswordInput
                      value={form.newPassword}
                      visible={showNewPassword}
                      placeholder="8+ characters"
                      autoComplete="new-password"
                      disabled={!isEditing}
                      onChange={(value) => updateForm("newPassword", value)}
                      onToggle={() =>
                        setShowNewPassword((current) => !current)
                      }
                    />
                  </Field>

                  <Field
                    label="Confirm new password"
                    icon={<LockKeyhole size={15} />}
                  >
                    <PasswordInput
                      value={form.confirmPassword}
                      visible={showConfirmPassword}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      disabled={!isEditing}
                      onChange={(value) => updateForm("confirmPassword", value)}
                      onToggle={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                    />
                  </Field>
                </div>
              </div>

              {isEditing && (
                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-edit-cancel"
                    disabled={saving}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="profile-edit-save"
                    disabled={saving}
                    onClick={() => void handleSave()}
                  >
                    <Save size={15} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="profile-edit-field">
      <span className="profile-edit-field-label">{label}</span>
      <span className="profile-edit-input-wrap">
        <span className="profile-edit-input-icon">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function PasswordInput({
  value,
  visible,
  placeholder,
  autoComplete,
  disabled,
  onChange,
  onToggle,
}: {
  value: string;
  visible: boolean;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <>
      <input
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="profile-edit-password-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
        onClick={onToggle}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}