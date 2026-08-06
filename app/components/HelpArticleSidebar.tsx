import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleUserRound,
  LockKeyhole,
  Monitor,
} from "lucide-react";
import Image from "next/image";


export type HelpArticleTopic =
  | "getting-started"
  | "account-recommendations"
  | "streaming-services"
  | "privacy-policy";

type HelpArticleSidebarProps = {
  activeTopic: HelpArticleTopic;
};

const helpArticleTopics = [
  {
  id: "getting-started",
  label: "Getting Started",
  href: "/help/getting-started",
  customIcon: "/icons/arrowRightBW1.png",
    },
  {
    id: "account-recommendations" as const,
    label: "Account & Recommendations",
    href: "/help/account-recommendations",
    icon: CircleUserRound,
  },
  {
    id: "streaming-services" as const,
    label: "Streaming Services",
    href: "/help/streaming-services",
    icon: Monitor,
  },
  {
    id: "privacy-policy" as const,
    label: "Privacy Policy",
    href: "/privacy",
    icon: LockKeyhole,
  },
];

export default function HelpArticleSidebar({
  activeTopic,
}: HelpArticleSidebarProps) {
  return (
    <aside className="help-article-sidebar">
      <Link href="/help" className="help-article-back">
        <ArrowLeft size={14} aria-hidden="true" />
        <span>Back to Help Center</span>
      </Link>

      <div className="help-article-sidebar-divider" />

      <p className="help-article-sidebar-label">Browse by topic</p>

      <div
        className="help-article-sidebar-nav"
        aria-label="Help article topics"
      >
        {helpArticleTopics.map((topic) => {
          const Icon = topic.icon;
          const isActive = activeTopic === topic.id;

          return (
            <Link
              key={topic.id}
              href={topic.href}
              className={`help-article-sidebar-link${
                isActive ? " active" : ""
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="help-article-sidebar-icon">
                {topic.customIcon ? (
                    <Image
                    src={topic.customIcon}
                    alt=""
                    width={14}
                    height={14}
                    className="help-article-sidebar-custom-icon"
                    />
                ) : (
                    Icon && <Icon size={13} />
                )}
                </span>

              <span>{topic.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}