import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getIdToken as firebaseGetIdToken,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const errorMessages: Record<string, string> = {
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Use a stronger password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code && code in errorMessages) return errorMessages[code];
  }
  return "Something went wrong. Please try again.";
}

async function persistAuth() {
  await setPersistence(getFirebaseAuth(), browserLocalPersistence);
}

export async function signUp(email: string, password: string): Promise<User> {
  try {
    await persistAuth();
    return (await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)).user;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    await persistAuth();
    return (await signInWithEmailAndPassword(getFirebaseAuth(), email, password)).user;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  return user ? firebaseGetIdToken(user, true) : null;
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "auth/user-not-found") return;
    throw new Error(getAuthErrorMessage(error));
  }
}

export { onAuthStateChanged };
