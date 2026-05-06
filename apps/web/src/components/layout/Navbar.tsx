"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileButton } from "../profile/ProfileButton";
import { ThemeMenu } from "./ThemeMenu";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

export function Navbar({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const navItems: NavItem[] = [
    { href: "/", label: "Panel de Control" },
    { href: "/users", label: "Cuentas", adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full relative bg-white/92 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200/90 dark:border-slate-700/50 shadow-[0_2px_16px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Brand accent line at the very top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-green-500" />

      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        {/* Logo — uses theme brand color */}
        <Link
          href="/"
          className="font-bold text-base tracking-tight text-green-600 dark:text-green-400 hover:opacity-75 transition-opacity"
        >
          Teams Improve
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive(item.href)
                  ? "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-300 font-semibold"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeMenu />
          <ProfileButton />
        </div>
      </div>
    </header>
  );
}
