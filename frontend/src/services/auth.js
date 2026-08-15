import { loginAdminWithPassword, requestPasswordResetApi } from "./api"

const STORAGE_KEY = 'dp_user'
const subscribers = new Set()

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage errors in dev mode
  }
}

export async function loginWithEmailPassword(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  try {
    const user = await loginAdminWithPassword(normalizedEmail, password)
    setStoredUser(user)
    subscribers.forEach((cb) => cb(user))
    return { user }
  } catch (error) {
    const err = new Error(error?.message || 'Authentication failed')
    err.code = 'auth/invalid-credential'
    throw err
  }
}

export function logoutUser() {
  return new Promise((resolve) => {
    setStoredUser(null)
    subscribers.forEach((cb) => cb(null))
    resolve()
  })
}

export async function requestPasswordReset(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  try {
    await requestPasswordResetApi(normalizedEmail)
  } catch (error) {
    const err = new Error(error?.message || 'Password reset request failed')
    err.code = 'auth/user-not-found'
    throw err
  }
}

export function observeAuthState(callback) {
  const current = getStoredUser()
  callback(current)
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}
