import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AN';

  return (
    <header className="navbar">
      {/* Left: Logo + Search */}
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          Drift<span>Pulse</span>
        </Link>
        <div className="search-bar">
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Search devices, alerts, or logs..." />
        </div>
      </div>

      {/* Right: User Badge */}
      <div className="nav-actions">
        <div className="user-profile">
          <div className="avatar">
            {user?.email ? initials : <User size={18} />}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.email ?? 'Analyst'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
