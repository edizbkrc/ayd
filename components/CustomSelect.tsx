"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "./icons";

export type SelectOption = {
  value: string;
  label: string;
};

export default function CustomSelect({
  name,
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  placeholder,
  size = "md",
  className = "",
}: {
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? ""
  );
  const current = isControlled ? value! : internalValue;

  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === current);

  useEffect(() => { setMounted(true); }, []);

  function choose(val: string) {
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
    setOpen(false);
  }

  function openDropdown() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropUp = spaceBelow < 180;
      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 140),
        zIndex: 9999,
        ...(dropUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    setOpen((o) => !o);
  }

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Klavye
  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDropdown(); }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const idx = options.findIndex((o) => o.value === current);
      const next = e.key === "ArrowDown"
        ? Math.min(idx + 1, options.length - 1)
        : Math.max(idx - 1, 0);
      choose(options[next].value);
    }
  }

  const sizeBtn = size === "sm"
    ? "px-2.5 py-1.5 text-xs rounded-lg gap-1.5"
    : "px-3 py-2.5 text-sm rounded-xl gap-2";

  const sizeItem = size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm";

  const dropdown = open && mounted ? createPortal(
    <ul
      style={dropdownStyle}
      role="listbox"
      className="bg-white dark:bg-slate-900 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-xl py-1 overflow-hidden"
    >
      {options.map((opt) => {
        const active = opt.value === current;
        return (
          <li
            key={opt.value}
            role="option"
            aria-selected={active}
            onMouseDown={(e) => { e.preventDefault(); choose(opt.value); }}
            className={`${sizeItem} cursor-pointer flex items-center gap-2 font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? "bg-brand-500" : ""}`} />
            {opt.label}
          </li>
        );
      })}
    </ul>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onKeyDown={onKeyDown}
        onClick={openDropdown}
        className={`w-full flex items-center justify-between ${sizeBtn} font-medium bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-800 dark:text-slate-100 hover:ring-slate-300 dark:hover:ring-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? "Seç..."}</span>
        <ChevronDownIcon
          className={`shrink-0 h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {dropdown}
    </div>
  );
}
