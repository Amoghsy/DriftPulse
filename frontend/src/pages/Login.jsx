import { useState } from "react"
import { AlertCircle, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react"
import { loginWithEmailPassword, requestPasswordReset, registerUser } from "../services/auth"

export default function Login({ onLogin }) {
  const [tab, setTab] = useState("signin") // "signin" | "signup"

  return (
    <div className="login-page-wrapper">
      <div className="lp-bg-grid" />
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb" style={{ width: 300, height: 300, top: "60%", left: "70%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", animationDelay: "3s" }} />

      <div className="lp-box">
        <div className="lp-form-container">
          <div className="lp-inner">

            <div className="lp-brand">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                <ShieldCheck size={28} style={{ color: "var(--accent)" }} />
                <h2 className="lp-title" style={{ marginBottom: 0 }}>Drift<i>Pulse</i></h2>
              </div>
              <p className="lp-subtitle">IoT Security Intelligence Platform</p>
            </div>

            {/* Tab Toggle */}
            <div className="lp-tab-toggle">
              {["signin", "signup"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`lp-tab-btn${tab === t ? " active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {tab === "signin"
              ? <SignInForm onLogin={onLogin} />
              : <SignUpForm onLogin={onLogin} />
            }

            <p className="lp-footer">Protected by end-to-end encryption &bull; DriftPulse v1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Sign In Form ─────────────────────────────────────────── */
function SignInForm({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(""); setNotice("")
    if (!email || !password) { setError("Please enter your credentials."); return }
    setLoading(true)
    try {
      const credential = await loginWithEmailPassword(email.trim(), password)
      try { sessionStorage.setItem("dp_otp_verified_uid", credential.user.uid) } catch {}
      onLogin({ uid: credential.user.uid, email: credential.user.email ?? email.trim(), role: credential.user.role ?? "Security Lead" })
    } catch (err) { setError(getAuthError(err)) }
    setLoading(false)
  }

  const handleReset = async () => {
    setError(""); setNotice("")
    if (!email.trim()) { setError("Enter your email address first."); return }
    setResetting(true)
    try { await requestPasswordReset(email.trim()); setNotice("Password reset email sent. Check your inbox.") }
    catch (err) { setError(getAuthError(err)) }
    setResetting(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="lp-form">
      {error && <div className="lp-error"><AlertCircle size={14} /><span>{error}</span></div>}
      {notice && <div className="lp-success">{notice}</div>}

      <input id="lp-email" type="email" className="lp-input" placeholder="Email address"
        value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

      <div className="lp-pw-wrap">
        <input id="lp-password" type={showPw ? "text" : "password"} className="lp-input"
          placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" required />
        <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <div className="lp-row">
        <label className="lp-remember"><input type="checkbox" /> <span>Remember me</span></label>
        <button type="button" className="lp-forgot" onClick={handleReset} disabled={resetting || loading}>
          {resetting ? "Sending..." : "Forgot password?"}
        </button>
      </div>

      <button type="submit" className="lp-submit lp-submit--cyan" disabled={loading}>
        {loading ? <span className="lp-spinner" style={{ borderColor: "rgba(10,14,20,0.3)", borderTopColor: "#0a0e14" }} /> : "Sign In Securely"}
      </button>
    </form>
  )
}

/* ─── Sign Up Form ─────────────────────────────────────────── */
function SignUpForm({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [role, setRole] = useState("Operator")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!email || !password || !confirm) { setError("Please fill in all fields."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    setLoading(true)
    try {
      const credential = await registerUser(email.trim(), password, role)
      try { sessionStorage.setItem("dp_otp_verified_uid", credential.user.uid) } catch {}
      onLogin({ uid: credential.user.uid, email: credential.user.email ?? email.trim(), role: credential.user.role ?? role })
    } catch (err) { setError(getRegisterError(err)) }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="lp-form">
      {error && <div className="lp-error"><AlertCircle size={14} /><span>{error}</span></div>}

      <input id="su-email" type="email" className="lp-input" placeholder="Email address"
        value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

      <div className="lp-pw-wrap">
        <input id="su-password" type={showPw ? "text" : "password"} className="lp-input"
          placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" required />
        <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <input id="su-confirm" type={showPw ? "text" : "password"} className="lp-input"
        placeholder="Confirm password" value={confirm}
        onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />

      <div style={{ position: "relative" }}>
        <select id="su-role" className="lp-input" value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ appearance: "none", cursor: "pointer", paddingRight: "2.2rem" }}>
          <option value="Security Lead">Security Lead</option>
          <option value="Operator">Operator</option>
          <option value="Analyst">Analyst</option>
        </select>
        <UserPlus size={14} style={{
          position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", pointerEvents: "none"
        }} />
      </div>

      <button type="submit" className="lp-submit lp-submit--cyan" disabled={loading}>
        {loading ? <span className="lp-spinner" style={{ borderColor: "rgba(10,14,20,0.3)", borderTopColor: "#0a0e14" }} /> : "Create Account"}
      </button>
    </form>
  )
}

function getAuthError(error) {
  const code = error?.code ?? ""
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Invalid email or password."
  if (code === "auth/invalid-email") return "Enter a valid email address."
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later."
  if (code === "auth/network-request-failed") return "Network error. Check your connection."
  return error?.message || "Unable to sign in right now."
}

function getRegisterError(error) {
  const code = error?.code ?? ""
  if (code === "auth/email-already-in-use") return "An account with this email already exists."
  if (code === "auth/invalid-email") return "Enter a valid email address."
  if (code === "auth/network-request-failed") return "Network error. Check your connection."
  return error?.message || "Unable to create account right now."
}
