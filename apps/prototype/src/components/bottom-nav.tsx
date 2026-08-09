"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Heute", icon: TodayIcon },
  { href: "/einkauf", label: "Einkauf", icon: CartIcon },
  { href: "/zuhause", label: "Zuhause", icon: HomeIcon },
  { href: "/plan", label: "Plan", icon: PlanIcon },
  { href: "/life-ai", label: "LifeAI", icon: AiIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptbereiche"
      className="sticky bottom-0 z-20 border-t border-line bg-[color:var(--surface)]/92 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] transition ${
                  active
                    ? "bg-mint text-save"
                    : "text-muted hover:bg-sand hover:text-ink"
                }`}
              >
                <Icon active={active} />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke={active ? "#d8efe0" : "currentColor"}
        strokeWidth="1.8"
      />
      <path
        d="M8 3v3M16 3v3M4 10h16"
        stroke={active ? "#6bc275" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h2l1.2 9.2a2 2 0 0 0 2 1.8h7.5a2 2 0 0 0 2-1.6L20 8H7"
        stroke={active ? "#d8efe0" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.3" fill={active ? "#6bc275" : "currentColor"} />
      <circle cx="17" cy="20" r="1.3" fill={active ? "#6bc275" : "currentColor"} />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke={active ? "#d8efe0" : "currentColor"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke={active ? "#d8efe0" : "currentColor"}
        strokeWidth="1.8"
      />
      <path
        d="M12 8v4.5l3 2"
        stroke={active ? "#6bc275" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AiIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1"
        stroke={active ? "#6bc275" : "currentColor"}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3.2"
        stroke={active ? "#d8efe0" : "currentColor"}
        strokeWidth="1.8"
      />
    </svg>
  );
}
