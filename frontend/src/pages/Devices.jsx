import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, ShieldAlert } from 'lucide-react';
import { getDevices } from '../services/api';

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatBytes = (value) => {
  const n = toNumber(value, 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)} GB`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)} MB`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} KB`;
  return `${Math.round(n)} B`;
};

const normalizeRisk = (risk) => {
  const raw = String(risk ?? '').trim().toLowerCase();
  if (raw === 'high') return 'High';
  if (raw === 'medium' || raw === 'med') return 'Medium';
  if (raw === 'low' || raw === 'safe' || raw === 'normal') return 'Low';
  return 'Unknown';
};

const formatLastSeen = (value) => {
  if (value == null) return '-';
  const input = String(value).trim();
  if (!input || input === '-') return '-';

  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;

  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = String(dt.getFullYear());
  return `${day} ${month} ${year}`;
};

const getRiskColor = (risk) => {
  switch (risk) {
    case 'Low':    return 'var(--success)';
    case 'Medium': return 'var(--warning)';
    case 'High':   return 'var(--danger)';
    default:       return 'var(--text-muted)';
  }
};

const getTrustBarColor = (score, risk) => {
  const normalizedRisk = String(risk).toLowerCase();
  if (normalizedRisk === 'high') return 'var(--danger)';
  if (normalizedRisk === 'medium') return 'var(--warning)';
  return 'var(--success)';
};

const getPolicyStyle = (policy) => {
  switch (policy) {
    case 'Compliant':     return { color: 'var(--success)', bg: 'var(--success-bg)' };
    case 'Warning':       return { color: 'var(--warning)', bg: 'var(--warning-bg)' };
    case 'Non-Compliant': return { color: 'var(--danger)', bg: 'var(--danger-bg)' };
    default:              return { color: 'var(--text-muted)', bg: 'transparent' };
  }
};

export default function Devices() {
  const navigate   = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getDevices();
        if (!active) return;

        const list = toArray(response?.devices ?? response?.data ?? response).map((dev) => {
          const trustScore = toNumber(dev?.trustScore ?? dev?.trust);
          const driftScore = toNumber(dev?.driftScore ?? dev?.drift);
          const anomalyScore = toNumber(dev?.anomalyScore ?? dev?.anomaly);
          const risk = normalizeRisk(dev?.risk ?? dev?.riskLevel ?? 'Unknown');
          const policy = String(dev?.policy ?? dev?.policyStatus ?? 'Unknown');

          return {
            id: dev?.id ?? dev?.deviceId ?? 'UNKNOWN',
            ip: dev?.ip ?? dev?.ipAddress ?? '-',
            logCount: toNumber(dev?.logCount ?? dev?.log_count),
            totalBytes: toNumber(dev?.totalBytes ?? dev?.total_bytes),
            trustScore,
            driftScore,
            anomalyScore,
            policy,
            risk,
            lastSeen: formatLastSeen(dev?.lastSeen ?? dev?.lastSeenAt ?? '-'),
          };
        });

        setDevices(list);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to load devices from backend API.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter((dev) =>
      String(dev.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(dev.ip).includes(searchTerm)
    );
  }, [devices, searchTerm]);

  const policyCounts = useMemo(() => {
    return devices.reduce(
      (acc, dev) => {
        const policy = String(dev.policy ?? '').trim().toLowerCase();
        if (policy === 'compliant') acc.compliant += 1;
        else if (policy === 'warning') acc.warning += 1;
        else if (policy === 'non-compliant' || policy === 'noncompliant' || policy === 'non_compliant') {
          acc.nonCompliant += 1;
        }
        return acc;
      },
      { compliant: 0, warning: 0, nonCompliant: 0 }
    );
  }, [devices]);

  return (
    <div className="main-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header items-center">
        <div>
          <h1 className="page-title">Devices</h1>
          <p className="page-subtitle">Monitor and manage all connected IoT assets</p>
        </div>
        <div className="search-bar" style={{ width: 320 }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search devices, IPs or IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center' }}>
          <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Out of {devices.length} devices:
          </span>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Compliant: {policyCounts.compliant}</span>
          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Warning: {policyCounts.warning}</span>
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Non-Compliant: {policyCounts.nonCompliant}</span>
        </div>
      </div>

      <div className="glass-panel device-table-card">
        {error && (
          <div style={{ padding: '0.9rem 1rem', color: 'var(--danger)', borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div className="table-wrapper">
          <table className="device-table" style={{ width: '100%', minWidth: 1380 }}>
            <thead>
              <tr>
                <th>Device ID</th>
                <th>IP Address</th>
                <th>Log Count</th>
                <th>Total Bytes</th>
                <th>Trust Score</th>
                <th>Drift Score</th>
                <th>Anomaly Score</th>
                <th>Policy Status</th>
                <th>Risk Level</th>
                <th>Last Seen</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Loading devices...
                  </td>
                </tr>
              )}
              {filteredDevices.map((dev, i) => {
                const pStyle = getPolicyStyle(dev.policy);
                return (
                  <tr
                    key={dev.id}
                    style={{ cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
                    onClick={() => navigate(`/devices/${dev.id}`)}
                  >
                    <td className="font-mono" style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dev.id}</td>
                    <td className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{dev.ip}</td>
                    <td className="font-mono text-sm">{Math.round(dev.logCount)}</td>
                    <td className="font-mono text-sm">{formatBytes(dev.totalBytes)}</td>
                    <td>
                      <div className="load-indicator" style={{ width: 130 }}>
                        <div className="progress-bg">
                          <div
                            className="progress-fill"
                            style={{ width: `${dev.trustScore}%`, background: getTrustBarColor(dev.trustScore, dev.risk) }}
                          />
                        </div>
                        <span className="font-mono text-sm">{dev.trustScore}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{dev.driftScore.toFixed(2)}</td>
                    <td className="font-mono text-sm">{dev.anomalyScore.toFixed(2)}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.22rem 0.65rem', borderRadius: 9999,
                        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                        color: pStyle.color, background: pStyle.bg, whiteSpace: 'nowrap',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: pStyle.color, display: 'inline-block' }} />
                        {dev.policy}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: getRiskColor(dev.risk) }}>{dev.risk}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{dev.lastSeen}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                        <button className="icon-btn-small" title="View Device" onClick={() => navigate(`/devices/${dev.id}`)}>
                          <Eye size={16} />
                        </button>
                       
                        <button className="icon-btn-small" title="Quarantine Device" style={{ color: 'var(--danger)' }}>
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredDevices.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No devices found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
