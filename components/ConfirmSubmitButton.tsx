"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertIcon, LogOutIcon, XIcon } from "./icons";

export default function ConfirmSubmitButton({
  confirmMessage,
  confirmTitle = "Emin misiniz?",
  confirmLabel = "Evet",
  cancelLabel = "Vazgeç",
  tone = "danger",
  className,
  children,
  title,
}: {
  confirmMessage: string;
  confirmTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function confirm() {
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  const isDanger = tone === "danger";

  return (
    <>
      <button
        type="button"
        title={title}
        className={className}
        onClick={(e) => {
          formRef.current = e.currentTarget.form;
          setOpen(true);
        }}
      >
        {children}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Kapat"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-slate-950/65"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              className="relative w-full max-w-sm card-surface p-5 sm:p-6 animate-fade-in shadow-lift"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn absolute top-3 right-3"
                aria-label="Kapat"
              >
                <XIcon className="h-4 w-4" />
              </button>

              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                  isDanger
                    ? "bg-red-50 text-red-600 dark:bg-red-950/70 dark:text-red-400"
                    : "bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300"
                }`}
              >
                {isDanger ? <AlertIcon className="h-5 w-5" /> : <LogOutIcon className="h-5 w-5" />}
              </div>

              <h2 id={titleId} className="text-lg font-bold tracking-tight text-slate-900 dark:text-white pr-8">
                {confirmTitle}
              </h2>
              <p id={descId} className="text-sm text-muted mt-1.5 leading-relaxed">
                {confirmMessage}
              </p>

              <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button ref={cancelRef} type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  {cancelLabel}
                </button>
                <button type="button" onClick={confirm} className={isDanger ? "btn-danger" : "btn"}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
