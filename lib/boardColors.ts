export type BoardPalette = {
  bar: string;
  header: string;
  wash: string;
  chip: string;
};

const PALETTES: BoardPalette[] = [
  {
    bar: "bg-indigo-500",
    header: "bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500",
    wash: "from-indigo-500/15 via-violet-400/8 to-transparent",
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300",
  },
  {
    bar: "bg-emerald-500",
    header: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
    wash: "from-emerald-500/15 via-teal-400/8 to-transparent",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  {
    bar: "bg-amber-500",
    header: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500",
    wash: "from-amber-400/18 via-orange-400/8 to-transparent",
    chip: "bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    bar: "bg-rose-500",
    header: "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400",
    wash: "from-rose-500/15 via-pink-400/8 to-transparent",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
  },
  {
    bar: "bg-violet-500",
    header: "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500",
    wash: "from-violet-500/15 via-purple-400/8 to-transparent",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
  },
  {
    bar: "bg-cyan-500",
    header: "bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500",
    wash: "from-sky-500/15 via-cyan-400/8 to-transparent",
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
  },
];

export function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

export function boardPalette(id: string): BoardPalette {
  return PALETTES[hashId(id) % PALETTES.length];
}

export function boardAccent(id: string) {
  return boardPalette(id).bar;
}
