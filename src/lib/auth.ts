import { cookies } from "next/headers";

const COOKIE_NAME = "cbt_session";

/**
 * Generate a deterministic SHA-256 hash for the passcode using standard Web Crypto
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || "cbt-trainer-punjab-group-b-exam-secret";
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode + ":" + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify if provided passcode matches the environment APP_PASSCODE
 */
export function verifyPasscode(enteredPasscode: string): boolean {
  const expectedPasscode = process.env.APP_PASSCODE;
  if (!expectedPasscode) {
    // If no passcode configured, allow access
    return true;
  }
  return enteredPasscode.trim() === expectedPasscode.trim();
}

/**
 * Set authenticated session cookie
 */
export async function createSessionCookie(passcode: string) {
  const token = await hashPasscode(passcode);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Check if the current request is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const expectedPasscode = process.env.APP_PASSCODE;
  // If no passcode is set in environment, bypass authentication
  if (!expectedPasscode) {
    return true;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const expectedToken = await hashPasscode(expectedPasscode);
  return token === expectedToken;
}
