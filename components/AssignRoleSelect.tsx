"use client";

import { useRef, useTransition } from "react";
import CustomSelect from "./CustomSelect";

export default function AssignRoleSelect({
  action,
  userId,
  currentRoleId,
  roles,
  disabled,
}: {
  action: (formData: FormData) => void | Promise<void>;
  userId: string;
  currentRoleId: string;
  roles: { id: string; name: string }[];
  disabled?: boolean;
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
      className="min-w-[140px]"
    >
      <input type="hidden" name="userId" value={userId} />
      <CustomSelect
        name="roleId"
        defaultValue={currentRoleId}
        options={roles.map((r) => ({ value: r.id, label: r.name }))}
        disabled={disabled || isPending}
        onChange={() => submitRef.current?.click()}
        size="sm"
      />
      <button ref={submitRef} type="submit" className="hidden" tabIndex={-1} aria-hidden />
    </form>
  );
}
