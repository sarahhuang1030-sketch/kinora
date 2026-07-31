// components/AccountSidebar.tsx

"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Bookmark,
  CircleUserRound,
  LogOut,
  MonitorPlay,
  Settings,
  SlidersHorizontal,
  SquarePlay,
} from "lucide-react";

type AccountSidebarProps = {
  active:
    | "profile"
    | "streaming"
    | "watchlists"
    | "preferences"
    | "activity"
    | "settings";
};

export default function AccountSidebar({
  active,
}: AccountSidebarProps) {
  const { data: session } = useSession();

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
    } catch (error) {
      console.error("Logout tracking failed:", error);
    }

    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <aside className="watchlists-account-sidebar">
      <p className="watchlists-sidebar-heading">
        Account
      </p>

      <div className="watchlists-sidebar-links">
        <Link
          href="/profile"
          className={
            active === "profile"
              ? "watchlists-sidebar-active"
              : ""
          }
        >
          <CircleUserRound
            size={17}
            fill={
              active === "profile"
                ? "currentColor"
                : "none"
            }
          />
          <span>Profile</span>
        </Link>

        <Link
          href="/profile/streaming-services"
          className={
            active === "streaming"
              ? "watchlists-sidebar-active"
              : ""
          }
        >
          <MonitorPlay
            size={17}
            fill={
              active === "streaming"
                ? "currentColor"
                : "none"
            }
          />
          <span>Streaming Services</span>
        </Link>

        <Link
          href="/watchlists"
          className={
            active === "watchlists"
              ? "watchlists-sidebar-active"
              : ""
          }
        >
          <Bookmark
            size={17}
            fill={
              active === "watchlists"
                ? "currentColor"
                : "none"
            }
          />
          <span>My Watchlists</span>
        </Link>

        <Link
          href="/profile/preferences"
          className={
            active === "preferences"
              ? "watchlists-sidebar-active"
              : ""
          }
        >
          <SlidersHorizontal size={17} />
          <span>Preferences</span>
        </Link>

        <Link
          href="/profile/activity"
          className={
            active === "activity"
              ? "watchlists-sidebar-active"
              : ""
          }
        >
          <SquarePlay size={17} />
          <span>Activity</span>
        </Link>

        <Link
          href="/profile/settings"
          className={
            active === "settings"
              ? "watchlists-sidebar-active"
              : ""
          }
        >
          <Settings size={17} />
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
  );
}