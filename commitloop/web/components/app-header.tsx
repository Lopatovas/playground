"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { api, type User } from "@/lib/api";

function buildNav(isMentor: boolean) {
  const items = [
    { href: "/home", label: "Home" },
    { href: "/assignment", label: "Assignment" },
    { href: "/curriculum", label: "Curriculum" },
    { href: "/settings", label: "Settings" },
  ] as const;

  if (!isMentor) return items;

  return [
    ...items.slice(0, 3),
    { href: "/mentor", label: "Mentor" },
    ...items.slice(3),
  ] as const;
}

export function AppHeader({
  user,
  onLogout,
}: {
  user: User;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <Logo href="/home" />
        <button
          type="button"
          className="app-header__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="app-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id="app-nav"
        className={`app-header__nav${menuOpen ? " is-open" : ""}`}
      >
        {buildNav(user.isMentor).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="app-header__user">
        <span className="app-header__username">@{user.username}</span>
        <button
          type="button"
          className="btn btn-ghost app-header__logout"
          onClick={() =>
            api.logout().then(() => {
              onLogout?.();
              router.push("/");
            })
          }
        >
          Log out
        </button>
      </div>
    </header>
  );
}
