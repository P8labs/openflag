"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BellIcon,
  GridIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "@/components/app-icons";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", Icon: HomeIcon },
  { href: "/projects", label: "Projects", Icon: GridIcon },
  { href: "/post-project", label: "Post", Icon: PlusIcon },
  { href: "/notifications", label: "Alerts", Icon: BellIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[min(90vw,420px)] -translate-x-1/2 rounded-full border border-white/15 bg-[#111722]/90 px-3 py-2 text-white shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur">
      <ul className="flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.Icon;

          return (
            <li key={item.href}>
              <Link
                className={`flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-[11px] font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/10"
                }`}
                href={item.href}
              >
                <Icon className="size-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
