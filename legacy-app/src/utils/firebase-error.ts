// utils/firebase-error.ts
import { FirebaseError } from "firebase/app";

export function isFirebaseError(error: unknown): error is FirebaseError {
  return typeof error === "object" && error !== null && "code" in error;
}

export function firebaseError(error: FirebaseError): string {
  switch (error.code) {
    case "auth/user-not-found":
      return "No user found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/invalid-login-credentials":
      return "Invalid login credentials.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/missing-email":
      return "Email address is required.";
    case "auth/expired-action-code":
      return "This link has expired. Please request a new one.";
    case "auth/invalid-action-code":
      return "Invalid or expired verification link.";

    default:
      return error.message || "An unexpected error occurred.";
  }
}
