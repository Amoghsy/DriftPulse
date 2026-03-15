import { useState } from 'react';
import { Save, Bell, Shield, Sliders, Globe, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    enableAlerts: true,
    emailNotifications: 'admin@driftpulse.io',
    darkMode: true,
    dataRetention: '30',
    apiEndpoint: 'https://api.driftpulse.local/v1',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="main-content fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header items-center">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your DriftPulse platform configuration</p>
        </div>
        <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

        {/* General */}
        <div className="glass-panel settings-card" style={{ padding: '1.75rem' }}>
          <div className="settings-section-header">
            <div className="settings-icon-box" style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent)' }}>
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="settings-section-title">General Settings</h2>
              <p className="settings-section-sub">Dashboard appearance and data preferences</p>
            </div>
          </div>

          <div className="settings-field-group">
            <div className="settings-toggle-row">
              <div>
                <div className="settings-field-label">Dark Mode</div>
                <div className="settings-field-hint">Enable dark theme for the dashboard</div>
              </div>
              <label className="dp-toggle">
                <input type="checkbox" name="darkMode" checked={settings.darkMode} onChange={handleChange} />
                <span className="dp-toggle-track" />
              </label>
            </div>

            <div>
              <label className="settings-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Data Retention Period</label>
              <select name="dataRetention" value={settings.dataRetention} onChange={handleChange} className="dp-select">
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="glass-panel settings-card" style={{ padding: '1.75rem' }}>
          <div className="settings-section-header">
            <div className="settings-icon-box" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <Globe size={18} />
            </div>
            <div>
              <h2 className="settings-section-title">System Preferences</h2>
              <p className="settings-section-sub">API endpoints and integration settings</p>
            </div>
          </div>

          <div className="settings-field-group">
            <div>
              <label className="settings-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>API Endpoint</label>
              <input type="text" name="apiEndpoint" value={settings.apiEndpoint} onChange={handleChange} className="dp-input font-mono" style={{ fontSize: '0.82rem' }} />
              <p className="settings-field-hint" style={{ marginTop: '0.4rem' }}>Primary endpoint the dashboard uses to fetch telemetry data.</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-panel settings-card" style={{ padding: '1.75rem' }}>
          <div className="settings-section-header">
            <div className="settings-icon-box" style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15' }}>
              <Bell size={18} />
            </div>
            <div>
              <h2 className="settings-section-title">Notification Settings</h2>
              <p className="settings-section-sub">Alert delivery and email digest configuration</p>
            </div>
          </div>

          <div className="settings-field-group">
            <div className="settings-toggle-row">
              <div>
                <div className="settings-field-label">Enable Alerts</div>
                <div className="settings-field-hint">Receive system-wide anomaly alerts</div>
              </div>
              <label className="dp-toggle">
                <input type="checkbox" name="enableAlerts" checked={settings.enableAlerts} onChange={handleChange} />
                <span className="dp-toggle-track" style={{ '--toggle-on': '#facc15' }} />
              </label>
            </div>

            <div>
              <label className="settings-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Email Notification Address</label>
              <input
                type="email" name="emailNotifications"
                value={settings.emailNotifications} onChange={handleChange}
                className="dp-input" disabled={!settings.enableAlerts}
                style={{ opacity: settings.enableAlerts ? 1 : 0.45 }}
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-panel settings-card" style={{ padding: '1.75rem', borderLeft: '3px solid rgba(239,68,68,0.6)' }}>
          <div className="settings-section-header">
            <div className="settings-icon-box" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 className="settings-section-title">Security Settings</h2>
              <p className="settings-section-sub">Advanced access control and key management</p>
            </div>
          </div>

          <div className="settings-field-group">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Advanced security configurations. Modifying these may affect user access and dashboard functionality.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', fontSize: '0.85rem' }}>
                Manage ACL
              </button>
              <button type="button" className="btn-outline" style={{ fontSize: '0.85rem' }}>
                Rotate API Keys
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
