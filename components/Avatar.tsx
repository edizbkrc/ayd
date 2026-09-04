import { hashId } from "@/lib/boardColors";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TONES = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/70 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/70 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/70 dark:text-cyan-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/70 dark:text-fuchsia-300",
];

export default function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";
  const tone = TONES[hashId(name) % TONES.length];
  return (
    <span className={`avatar ${tone} ${sizeClass} ${className}`} title={name}>
      {initials(name)}
    </span>
  );
}
