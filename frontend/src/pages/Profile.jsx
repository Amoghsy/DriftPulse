import { useState } from 'react';
import { User, Mail, Building, Key, Bell, LogOut, CheckCircle2, Shield } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: 'Amogh S Y',
    email: 'Amogh S Y @driftpulse.com',
    role: 'SECURITY LEAD',
    organization: 'Acme Corp Security',
    lastLogin: '2 hours ago',
    notificationsEnabled: true,
  });

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 3000);
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="main-content fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header items-center">
        <div>
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">Manage your personal account and security settings</p>
        </div>
        <button className="btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={15} /> Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', paddingBottom: '2rem' }}>

        {/* Sidebar card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel profile-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div className="profile-avatar">
              <User size={38} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{profile.name}</h2>
            <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{profile.role}</p>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={14} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building size={14} style={{ flexShrink: 0 }} /> <span>{profile.organization}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} /> <span style={{ color: 'var(--success)' }}>Active Account</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Last login: {profile.lastLogin}
            </div>
          </div>

          <div className="glass-panel profile-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Shield size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Security Status</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[['MFA', 'Enabled', 'var(--success)'], ['Session', 'Active', 'var(--success)'], ['API Key', 'Valid', 'var(--warning)']].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: c, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Edit Profile */}
          <div className="glass-panel settings-card" style={{ padding: '1.75rem' }}>
            <div className="settings-section-header">
              <div className="settings-icon-box" style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent)' }}>
                <User size={18} />
              </div>
              <div>
                <h2 className="settings-section-title">Edit Profile</h2>
                <p className="settings-section-sub">Update your personal information</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="settings-field-group">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="settings-field-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Full Name</label>
                  <input type="text" name="name" value={profile.name} onChange={handleChange} className="dp-input" />
                </div>
                <div>
                  <label className="settings-field-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Role</label>
                  <input type="text" value={profile.role} readOnly className="dp-input" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="settings-field-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Email Address</label>
                  <input type="email" name="email" value={profile.email} onChange={handleChange} className="dp-input" />
                </div>
              </div>

              <div className="settings-toggle-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Bell size={16} style={{ color: '#facc15' }} />
                  <span className="settings-field-label">Email alerts &amp; digests</span>
                </div>
                <label className="dp-toggle">
                  <input type="checkbox" name="notificationsEnabled" checked={profile.notificationsEnabled} onChange={handleChange} />
                  <span className="dp-toggle-track" style={{ '--toggle-on': '#facc15' }} />
                </label>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {profileSaved ? <><CheckCircle2 size={15} /> Saved!</> : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-panel settings-card" style={{ padding: '1.75rem', borderLeft: '3px solid rgba(239,68,68,0.5)' }}>
            <div className="settings-section-header">
              <div className="settings-icon-box" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                <Key size={18} />
              </div>
              <div>
                <h2 className="settings-section-title">Change Password</h2>
                <p className="settings-section-sub">Update your account password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSave} className="settings-field-group">
              <div>
                <label className="settings-field-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Current Password</label>
                <input type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({...p, current: e.target.value}))} className="dp-input" placeholder="••••••••" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="settings-field-label" style={{ marginBottom: '0.4rem', display: 'block' }}>New Password</label>
                  <input type="password" value={passwordForm.next} onChange={e => setPasswordForm(p => ({...p, next: e.target.value}))} className="dp-input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="settings-field-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Confirm Password</label>
                  <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({...p, confirm: e.target.value}))} className="dp-input" placeholder="••••••••" />
                </div>
              </div>
              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {pwSaved ? <><CheckCircle2 size={15} /> Changed!</> : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
