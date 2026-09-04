"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

function setSessionCookie(userId: string) {
  const token = createSessionToken(userId);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("E-posta ve şifre gereklidir."));
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=" + encodeURIComponent("E-posta veya şifre hatalı."));
  }

  setSessionCookie(user!.id);
  redirect("/isler");
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
