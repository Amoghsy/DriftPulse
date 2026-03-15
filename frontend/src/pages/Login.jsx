import { useState } from "react"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { isFirebaseConfigured } from "../services/firebase"
import { loginWithEmailPassword, requestPasswordReset } from "../services/auth"

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleCredentials = async (e) => {
    e.preventDefault()
    setError("")
    setNotice("")

    if (!email || !password) { setError("Please enter your credentials."); return }
    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Add your Vite Firebase environment variables and restart the frontend.")
      return
    }

    setLoading(true)
    try {
      const credential = await loginWithEmailPassword(email.trim(), password)
      onLogin({
        uid: credential.user.uid,
        email: credential.user.email ?? email.trim(),
        role: "Security Lead",
      })
    } catch (authError) {
      setError(getFirebaseErrorMessage(authError))
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    setError("")
    setNotice("")

    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Add your Vite Firebase environment variables and restart the frontend.")
      return
    }

    if (!email.trim()) {
      setError("Enter your email address first to receive a reset link.")
      return
    }

    setResetting(true)
    try {
      await requestPasswordReset(email.trim())
      setNotice("Password reset email sent. Check your inbox and spam folder.")
    } catch (authError) {
      setError(getPasswordResetErrorMessage(authError))
    }
    setResetting(false)
  }

  return (
    <div className="login-page-wrapper">
      {/* Animated background particles */}
      <div className="lp-bg-grid" />
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />

      {/* The rotating-border box */}
      <div className="lp-box">
        <div className="lp-form-container">
          <div className="lp-inner">

            <div className="lp-brand">
              <h2 className="lp-title">Drift<i>Pulse</i></h2>
              <p className="lp-subtitle">IoT Security Intelligence Platform</p>
            </div>

            {!isFirebaseConfigured && (
              <div className="lp-error">
                <AlertCircle size={14} />
                <span>Firebase config missing. Add values to the frontend env file before signing in.</span>
              </div>
            )}

            <form onSubmit={handleCredentials} noValidate className="lp-form">
              {error && (
                <div className="lp-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {notice && <div className="lp-success">{notice}</div>}

              <input
                id="lp-email"
                type="email"
                className="lp-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="lp-pw-wrap">
                <input
                  id="lp-password"
                  type={showPw ? "text" : "password"}
                  className="lp-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="lp-row">
                <label className="lp-remember">
                  <input type="checkbox" /> <span>Remember me</span>
                </label>
                <button type="button" className="lp-forgot" onClick={handlePasswordReset} disabled={resetting || loading}>
                  {resetting ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              <button type="submit" className="lp-submit" disabled={loading}>
                {loading ? <span className="lp-spinner" /> : "Sign In Securely"}
              </button>
            </form>

            <p className="lp-footer">Protected by end-to-end encryption &bull; DriftPulse v1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getFirebaseErrorMessage(error) {
  const code = error?.code ?? ""

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Invalid email or password."
  }

  if (code === "auth/invalid-email") {
    return "Enter a valid email address."
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again later."
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again."
  }

  return "Unable to sign in right now. Check Firebase configuration and credentials."
}

function getPasswordResetErrorMessage(error) {
  const code = error?.code ?? ""

  if (code === "auth/invalid-email") {
    return "Enter a valid email address before requesting a reset link."
  }

  if (code === "auth/too-many-requests") {
    return "Too many reset attempts. Try again later."
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again."
  }

  return "Unable to send reset email right now. Check Firebase configuration and try again."
}
