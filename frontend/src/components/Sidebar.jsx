import {
  LayoutDashboard, Server, Bell, Settings as SettingsIcon,
  LogOut, Shield, HelpCircle, User
} from "lucide-react";
import { createElement } from "react";
import { NavLink } from "react-router-dom";

const MAIN_NAV = [
  { to: "/",        icon: LayoutDashboard, label: "Dashboard" },
  { to: "/devices", icon: Server,          label: "Devices" },
  { to: "/alerts",  icon: Bell,            label: "Alerts" },
];

const SYSTEM_NAV = [
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
  { to: "/profile",  icon: User,         label: "Profile" },
  { to: "/help",     icon: HelpCircle,   label: "Help" },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon-wrapper">
          <Shield size={20} />
        </div>
        <span className="logo-text">Drift<span>Pulse</span></span>
      </div>

      <nav className="sidebar-nav">
        {/* Main Menu */}
        <span className="nav-section-label">Main Menu</span>

        {MAIN_NAV.map(({ to, icon, label }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            {createElement(icon, { className: "nav-icon", size: 18 })}
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        {/* System */}
        <span className="nav-section-label">System</span>

        {SYSTEM_NAV.map(({ to, icon, label }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            {createElement(icon, { className: "nav-icon", size: 18 })}
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          className="nav-item sidebar-logout-btn"
          style={{ width: "100%", textAlign: "left", marginTop: "0.25rem" }}
          onClick={onLogout}
        >
          <LogOut className="nav-icon" size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div
            className="status-dot pulsing"
            style={{ background: "var(--success)", width: 8, height: 8, borderRadius: "50%" }}
          />
          <span>System Healthy</span>
        </div>
      </div>
    </aside>
  );
}
