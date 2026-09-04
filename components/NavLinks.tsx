"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/lib/auth";
import { CheckSquareIcon, FolderIcon, ShieldIcon, TagIcon, LayoutIcon } from "./icons";

export default function NavLinks({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Genel Bakış", icon: LayoutIcon, match: (p: string) => p === "/dashboard" },
    { href: "/isler", label: user.appRole.canManageUsers || user.appRole.canManageRoles ? "İşler" : "İşlerim", icon: CheckSquareIcon, match: (p: string) => p.startsWith("/isler") },
    (user.appRole.canManageUsers || user.appRole.canManageRoles || user.appRole.canCreateProjects) && {
      href: "/boards", label: "Projeler", icon: FolderIcon, match: (p: string) => p.startsWith("/boards"),
    },
    user.appRole.canManageUsers && {
      href: "/admin/users",
      label: "Kullanıcılar",
      icon: ShieldIcon,
      match: (p: string) => p.startsWith("/admin/users"),
      hideLabelOnMobile: true,
    },
    user.appRole.canManageRoles && {
      href: "/admin/roles",
      label: "Roller",
      icon: TagIcon,
      match: (p: string) => p.startsWith("/admin/roles"),
      hideLabelOnMobile: true,
    },
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: typeof CheckSquareIcon;
    match: (p: string) => boolean;
    hideLabelOnMobile?: boolean;
  }[];

  return (
    <nav className="flex items-center gap-0.5 text-sm">
      {items.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2 sm:px-3 py-1.5 transition-colors font-medium ${
              active
                ? "bg-white/20 text-white ring-1 ring-white/30"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
