import { Navigate, useLocation } from "react-router-dom"

export default function AuthGuard({ user, authLoading, children }) {
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="login-page-wrapper">
        <div className="lp-bg-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-box" style={{ cursor: "default" }}>
          <div className="lp-form-container">
            <div className="lp-inner" style={{ gap: "0.75rem" }}>
              <div className="lp-brand">
                <h2 className="lp-title">Drift<i>Pulse</i></h2>
                <p className="lp-subtitle">Verifying secure access...</p>
              </div>
              <span className="lp-spinner" style={{ width: 18, height: 18 }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}