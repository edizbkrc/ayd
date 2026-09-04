"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function saveNotificationSettings(formData: FormData) {
  const user = await requireUser();
  const bool = (key: string) => formData.get(key) === "on";

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      emailOnAssigned: bool("emailOnAssigned"),
      emailOnApproved: bool("emailOnApproved"),
      emailOnRejected: bool("emailOnRejected"),
      emailOnReopened: bool("emailOnReopened"),
      emailOnReview:   bool("emailOnReview"),
      emailOnComment:  bool("emailOnComment"),
    },
    update: {
      emailOnAssigned: bool("emailOnAssigned"),
      emailOnApproved: bool("emailOnApproved"),
      emailOnRejected: bool("emailOnRejected"),
      emailOnReopened: bool("emailOnReopened"),
      emailOnReview:   bool("emailOnReview"),
      emailOnComment:  bool("emailOnComment"),
    },
  });

  revalidatePath("/ayarlar");
}
