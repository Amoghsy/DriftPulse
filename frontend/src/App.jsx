import { useEffect, useState } from "react"
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import AuthGuard from "./components/AuthGuard"
import Dashboard from "./pages/Dashboard"
import Alerts from "./pages/Alerts"
import Devices from "./pages/Devices"
import DeviceDetail from "./pages/DeviceDetail"
import Settings from "./pages/Settings"
import Profile from "./pages/Profile"
import Help from "./pages/Help"
import Login from "./pages/Login"
import { observeAuthState, logoutUser } from "./services/auth"

const OTP_VERIFIED_UID_KEY = "dp_otp_verified_uid"

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = observeAuthState((firebaseUser) => {
      if (!firebaseUser) {
        sessionStorage.removeItem(OTP_VERIFIED_UID_KEY)
        setUser(null)
        setAuthLoading(false)
        return
      }

      const verifiedUid = sessionStorage.getItem(OTP_VERIFIED_UID_KEY)
      if (verifiedUid !== firebaseUser.uid) {
        setUser(null)
        setAuthLoading(false)
        return
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        role: "Security Lead",
      })
      setAuthLoading(false)
    })

    return unsubscribe
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    sessionStorage.removeItem(OTP_VERIFIED_UID_KEY)
    try {
      await logoutUser()
      setUser(null)
    } catch (error) {
      console.error("Failed to sign out", error)
    }
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        element={(
          <AuthGuard user={user} authLoading={authLoading}>
            <ProtectedLayout user={user} onLogout={handleLogout} />
          </AuthGuard>
        )}
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  )
}

function ProtectedLayout({ user, onLogout }) {
  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-wrapper">
        <Navbar user={user} onLogout={onLogout} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
