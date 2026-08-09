"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/brand-mark";
import { BottomNav } from "@/components/bottom-nav";

const einkaufTabs = [
  { href: "/einkauf", label: "Liste", match: (p: string) => p === "/einkauf" },
  {
    href: "/einkauf/maerkte",
    label: "Märkte",
    match: (p: string) => p.startsWith("/einkauf/maerkte"),
  },
  {
    href: "/einkauf/vorraete",
    label: "Vorräte",
    match: (p: string) => p.startsWith("/einkauf/vorraete"),
  },
  {
    href: "/einkauf/essensplan",
    label: "Essen",
    match: (p: string) => p.startsWith("/einkauf/essensplan"),
  },
  {
    href: "/einkauf/katalog",
    label: "Katalog",
    match: (p: string) => p.startsWith("/einkauf/katalog"),
  },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const onEinkauf = pathname.startsWith("/einkauf");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-[color:var(--surface)]/92 px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-md">
        <BrandWordmark compact />
        {title ? (
          <div className="mt-2 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>
        ) : null}

        {onEinkauf ? (
          <nav
            aria-label="Einkauf Untermenü"
            className="mt-3 grid grid-cols-5 gap-1 rounded-2xl border border-line bg-white p-1"
          >
            {einkaufTabs.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-xl px-1 py-2 text-center text-[0.68rem] font-semibold leading-tight transition sm:text-xs ${
                    active
                      ? "bg-mint text-save"
                      : "text-muted hover:bg-sand hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
