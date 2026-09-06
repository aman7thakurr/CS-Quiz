"use server";

import { verifyPasscode, createSessionCookie, clearSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginWithPasscode(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const passcode = formData.get("passcode") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!passcode || !verifyPasscode(passcode)) {
    return { error: "Invalid passcode. Please check your credentials." };
  }

  await createSessionCookie(passcode);
  redirect(redirectTo);
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
