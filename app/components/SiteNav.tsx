"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "בית" },
  { href: "/architecture", label: "ארכיטקטורה" },
  { href: "/memory", label: "זיכרון" },
  { href: "/mcu", label: "ה-8051" },
  { href: "/firmware", label: "Firmware" },
  { href: "/live", label: "חי" },
  { href: "/quiz", label: "מבחן" },
];

export default function SiteNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-8">
        <Link
          href="/"
          className="mono shrink-0 py-3 pl-4 text-sm font-semibold text-fg"
          dir="ltr"
        >
          <span className="text-data">RTL</span>8192EU
        </Link>
        <div className="flex items-center gap-0.5">
          {NAV.slice(1).map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-ink-3 text-data"
                    : "text-fg-muted hover:bg-ink-2 hover:text-fg"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
