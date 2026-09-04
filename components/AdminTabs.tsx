"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldIcon, TagIcon } from "./icons";

export default function AdminTabs({
  canManageUsers,
  canManageRoles,
}: {
  canManageUsers: boolean;
  canManageRoles: boolean;
}) {
  const pathname = usePathname();
  const tabs = [
    canManageUsers && {
      href: "/admin/users",
      label: "Kullanıcılar",
      icon: ShieldIcon,
    },
    canManageRoles && {
      href: "/admin/roles",
      label: "Roller",
      icon: TagIcon,
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof ShieldIcon }[];

  if (tabs.length === 0) return null;

  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-white/70 ring-1 ring-slate-200/80 w-fit mb-8 dark:bg-slate-900/60 dark:ring-slate-800">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
