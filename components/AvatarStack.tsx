import Avatar from "./Avatar";

export default function AvatarStack({
  names,
  size = "sm",
}: {
  names: string[];
  size?: "sm" | "md";
}) {
  if (names.length === 0) {
    return <span className="text-xs text-faint">Atanmamış</span>;
  }

  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;

  return (
    <div className="flex items-center min-w-0">
      <div className="flex -space-x-1.5">
        {shown.map((name, i) => (
          <span key={`${name}-${i}`} className="ring-2 ring-white dark:ring-slate-900 rounded-full">
            <Avatar name={name} size={size} />
          </span>
        ))}
      </div>
      {extra > 0 && <span className="text-[11px] text-muted ml-1.5 font-medium">+{extra}</span>}
      {names.length === 1 && (
        <span className="text-xs text-muted truncate ml-1.5">{names[0]}</span>
      )}
    </div>
  );
}
