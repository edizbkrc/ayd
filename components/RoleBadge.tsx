import { roleBadgeClass, roleDotClass } from "@/lib/roles";

export default function RoleBadge({
  name,
  color,
  className = "",
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${roleBadgeClass(color)} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${roleDotClass(color)}`} />
      {name}
    </span>
  );
}
