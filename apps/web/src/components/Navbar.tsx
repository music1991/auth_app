"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileButton } from "./ProfileButton";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

export function Navbar({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const navItems: NavItem[] = [
    { href: "/", label: "Dashboard" },
    { href: "/users", label: "Cuentas", adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname?.startsWith("/dashboard");
    }
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link 
          href="/" 
          className="font-semibold text-lg text-gray-800 hover:text-gray-900 transition-colors"
        >
          Teams Improve
        </Link>

        <nav className="flex items-center gap-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium transform hover:-translate-y-0.5 transition-all duration-200 ${
                isActive(item.href)
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <ProfileButton />
        </div>
      </div>
    </header>
  );
}