export const ROLE_COLORS = [
  { id: "indigo", label: "İndigo" },
  { id: "violet", label: "Mor" },
  { id: "sky", label: "Mavi" },
  { id: "emerald", label: "Yeşil" },
  { id: "amber", label: "Amber" },
  { id: "rose", label: "Gül" },
  { id: "cyan", label: "Camgöbeği" },
  { id: "slate", label: "Gri" },
] as const;

export type RoleColorId = (typeof ROLE_COLORS)[number]["id"];

const BADGE: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:ring-indigo-800",
  violet: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:ring-violet-800",
  sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-800",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-800",
  amber: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-800",
  rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-800",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/70 dark:text-cyan-300 dark:ring-cyan-800",
  slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

const DOT: Record<string, string> = {
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  slate: "bg-slate-400",
};

const SWATCH: Record<string, string> = {
  indigo: "bg-indigo-500 ring-indigo-300",
  violet: "bg-violet-500 ring-violet-300",
  sky: "bg-sky-500 ring-sky-300",
  emerald: "bg-emerald-500 ring-emerald-300",
  amber: "bg-amber-500 ring-amber-300",
  rose: "bg-rose-500 ring-rose-300",
  cyan: "bg-cyan-500 ring-cyan-300",
  slate: "bg-slate-400 ring-slate-300",
};

export function roleBadgeClass(color: string) {
  return BADGE[color] ?? BADGE.slate;
}

export function roleDotClass(color: string) {
  return DOT[color] ?? DOT.slate;
}

export function roleSwatchClass(color: string) {
  return SWATCH[color] ?? SWATCH.slate;
}

export function isValidRoleColor(color: string): color is RoleColorId {
  return ROLE_COLORS.some((c) => c.id === color);
}

export function canAccessAdmin(role: { canManageUsers: boolean; canManageRoles: boolean }) {
  return role.canManageUsers || role.canManageRoles;
}
