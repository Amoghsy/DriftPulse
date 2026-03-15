import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "./firebase"

function getAuthInstance() {
  if (!auth) {
    throw new Error("Firebase Authentication is not configured.")
  }

  return auth
}

export function loginWithEmailPassword(email, password) {
  return signInWithEmailAndPassword(getAuthInstance(), email, password)
}

export function logoutUser() {
  return signOut(getAuthInstance())
}

export function requestPasswordReset(email) {
  return sendPasswordResetEmail(getAuthInstance(), email)
}

export function observeAuthState(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(getAuthInstance(), callback)
}
