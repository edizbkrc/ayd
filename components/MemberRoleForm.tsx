"use client";

import { useTransition } from "react";
import CustomSelect from "./CustomSelect";

export default function MemberRoleForm({
  action,
  boardId,
  userId,
  currentRole,
}: {
  action: (formData: FormData) => void | Promise<void>;
  boardId: string;
  userId: string;
  currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(async () => { await action(fd); })}
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="userId" value={userId} />
      <CustomSelect
        name="role"
        defaultValue={currentRole}
        options={[
          { value: "MEMBER", label: "Üye" },
          { value: "ADMIN", label: "Yönetici" },
        ]}
        disabled={isPending}
        size="sm"
        className="min-w-[110px]"
      />
      <button type="submit" disabled={isPending} className="btn-secondary btn-sm">
        {isPending ? "..." : "Güncelle"}
      </button>
    </form>
  );
}
