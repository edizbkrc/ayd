"use client";

import { useRef, useTransition } from "react";
import { ArrowRightIcon } from "./icons";
import CustomSelect from "./CustomSelect";

export default function MoveCardSelect({
  action,
  boardId,
  cardId,
  currentListId,
  lists,
}: {
  action: (formData: FormData) => void | Promise<void>;
  boardId: string;
  cardId: string;
  currentListId: string;
  lists: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const submitRef = useRef<HTMLButtonElement>(null);

  return (
    <form
      action={(formData) => {
        startTransition(() => {
          action(formData);
        });
      }}
      className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800"
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="cardId" value={cardId} />
      <ArrowRightIcon className="h-3 w-3 text-faint shrink-0" />
      <CustomSelect
        name="targetListId"
        defaultValue={currentListId}
        options={lists.map((l) => ({ value: l.id, label: l.name }))}
        disabled={isPending}
        onChange={() => submitRef.current?.click()}
        size="sm"
        className="flex-1"
      />
      <button ref={submitRef} type="submit" className="hidden" tabIndex={-1} aria-hidden />
    </form>
  );
}
