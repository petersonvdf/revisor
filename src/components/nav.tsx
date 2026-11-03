"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Revisar hoje" },
  { href: "/novo", label: "Novo card" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-800">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
