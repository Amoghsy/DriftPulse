import { Server, Database, HardDrive, Wifi, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getRiskColor = (risk) => {
  switch (String(risk).toLowerCase()) {
    case 'low':
      return 'var(--success)';
    case 'medium':
      return 'var(--warning)';
    case 'high':
      return 'var(--danger)';
    default:
      return 'var(--text-muted)';
  }
};

const getTrustBarColor = (score, risk) => {
  if (String(risk).toLowerCase() === 'high') return 'var(--danger)';
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function DeviceTable({ devices = [], loading = false }) {
  const navigate = useNavigate();

  const normalizedDevices = (Array.isArray(devices) ? devices : []).map((dev) => {
    const type = String(dev?.type ?? dev?.deviceType ?? 'Server');

    const iconByType = {
      server: Server,
      database: Database,
      storage: HardDrive,
      network: Wifi,
    };

    const id = String(dev?.id ?? dev?.deviceId ?? 'UNKNOWN');
    const name = String(dev?.name ?? dev?.deviceName ?? dev?.hostname ?? id ?? 'Unknown Device');
    const showSecondaryId = name.trim().toLowerCase() !== id.trim().toLowerCase();

    return {
      id,
      name,
      showSecondaryId,
      type,
      risk: dev?.risk ?? dev?.riskLevel ?? 'Unknown',
      trustScore: toNumber(dev?.trustScore ?? dev?.trust),
      icon: iconByType[type.toLowerCase()] || Server,
    };
  });

  return (
    <div className="device-table-card glass-panel fade-in">
      <div className="card-header">
        <div className="card-title">
          <h3>Device Security Overview</h3>
          <span className="text-muted text-sm">
            {loading ? 'Loading devices...' : 'Real-time trust & drift monitoring'}
          </span>
        </div>
        <button className="btn-outline" onClick={() => navigate('/devices')}>View All</button>
      </div>

      <div className="table-wrapper">
        <table className="device-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Trust Score</th>
              <th>Risk Level</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && normalizedDevices.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No devices returned by backend API.
                </td>
              </tr>
            )}

            {normalizedDevices.map((dev) => {
              const Icon = dev.icon;
              return (
                <tr
                  key={dev.id}
                  className="table-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/devices/${dev.id}`)}
                >
                  <td>
                    <div className="device-info">
                      <div className="device-icon-box"><Icon size={16} /></div>
                      <div>
                        <div className="device-name">{dev.name}</div>
                        {dev.showSecondaryId && <div className="device-id font-mono">{dev.id}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="load-indicator" style={{ width: 140 }}>
                      <div className="progress-bg">
                        <div
                          className="progress-fill"
                          style={{ width: `${dev.trustScore}%`, background: getTrustBarColor(dev.trustScore, dev.risk) }}
                        />
                      </div>
                      <span className="font-mono text-sm">{dev.trustScore}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        color: getRiskColor(dev.risk),
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: getRiskColor(dev.risk),
                          display: 'inline-block',
                        }}
                      />
                      {dev.risk}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{dev.type}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/${dev.id}`);
                      }}
                      title="View Detail"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
