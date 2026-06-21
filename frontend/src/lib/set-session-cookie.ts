import { auth } from './firebase-client';

/**
 * Sets the __session cookie with the current Firebase ID token.
 * This must be called BEFORE router.push() to protected routes,
 * because the Next.js middleware checks for this cookie on the server side.
 * 
 * The AuthProvider's onAuthStateChanged also sets this cookie, but there's
 * a race condition — router.push fires before the listener runs.
 */
export async function setSessionCookie(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const token = await user.getIdToken(true); // force refresh to get latest custom claims
  document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
}
