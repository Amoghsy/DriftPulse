import { createElement, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Radio, Timer,
  ChevronDown, Eye, Search,
} from 'lucide-react';
import AlertTrendChart from '../components/AlertTrendChart';
import VulnerabilityMap from '../components/VulnerabilityMap';
import { getAlerts, getDevices } from '../services/api';

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeSeverity = (severity) => {
  const raw = String(severity ?? '').trim().toLowerCase();
  if (raw === 'critical') return 'Critical';
  if (raw === 'high') return 'High';
  if (raw === 'medium') return 'Medium';
  if (raw === 'low') return 'Low';
  return 'Unknown';
};

const normalizeStatus = (status) => {
  const raw = String(status ?? '').trim().toLowerCase();
  if (raw === 'live') return 'Live';
  if (raw === 'investigating') return 'Investigating';
  if (raw === 'resolved') return 'Resolved';
  if (raw === 'closed') return 'Closed';
  if (raw === 'open') return 'Open';
  return 'Open';
};

const parseAlertTimestamp = (value) => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw || raw === '-') return null;

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw)
    ? raw.replace(' ', 'T') + ':00'
    : raw;

  const dt = new Date(normalized);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const formatAlertTimestamp = (value) => {
  const dt = parseAlertTimestamp(value);
  if (!dt) return String(value ?? '-');
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const h = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

const getRangeHours = (range) => {
  if (range === '24h') return 24;
  if (range === '7d') return 24 * 7;
  if (range === '30d') return 24 * 30;
  return Number.POSITIVE_INFINITY;
};

const StatCard = ({ title, value, trend, isPositive, icon: Icon, iconColor }) => (
  <div className="glass-panel metric-card">
    <div className="metric-header">
      <span className="metric-title">{title}</span>
      <div className="metric-icon-wrapper" style={{ background: `${iconColor}20`, color: iconColor, border: `1px solid ${iconColor}30` }}>
        {createElement(Icon, { size: 18 })}
      </div>
    </div>
    <div className="metric-body">
      <h3 className="metric-value">{value}</h3>
      <div className={`metric-change-wrapper ${isPositive ? 'trend-up' : 'trend-down'}`}>
        <span className="metric-change">{trend}</span>
        <span className="metric-period">vs last period</span>
      </div>
    </div>
  </div>
);

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const TIME_RANGES = [
    { value: '7d', label: 'Last 7d' },
    { value: '30d', label: 'Last 30d' },
    { value: 'all', label: 'All Time' },
  ];

const severityStyle = (severity) => {
  switch (String(severity).toLowerCase()) {
    case 'critical': return { color: 'var(--danger)', bg: 'var(--danger-bg)' };
    case 'high': return { color: 'var(--warning)', bg: 'var(--warning-bg)' };
    case 'medium': return { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    case 'low': return { color: 'var(--success)', bg: 'var(--success-bg)' };
    default: return { color: 'var(--text-muted)', bg: 'transparent' };
  }
};

const statusStyle = (status) => {
  switch (String(status).toLowerCase()) {
    case 'live': return { color: 'var(--danger)', bg: 'var(--danger-bg)' };
    case 'investigating': return { color: 'var(--warning)', bg: 'var(--warning-bg)' };
    case 'resolved':
    case 'closed':
      return { color: 'var(--success)', bg: 'var(--success-bg)' };
    case 'open': return { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' };
    default: return { color: 'var(--text-muted)', bg: 'transparent' };
  }
};

const Badge = ({ label, colorStyle }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.22rem 0.65rem', borderRadius: 9999,
    fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: colorStyle.color, background: colorStyle.bg,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: colorStyle.color, display: 'inline-block' }} />
    {label}
  </span>
);

export default function Alerts() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('24h');
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncWarning, setSyncWarning] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      setSyncWarning('');

      const [alertsRes, devicesRes] = await Promise.allSettled([
        getAlerts(),
        getDevices(),
      ]);

      if (!active) return;

      if (alertsRes.status === 'fulfilled') {
        const rows = toArray(alertsRes.value?.alerts ?? alertsRes.value?.data ?? alertsRes.value).map((alert, index) => ({
          id: alert?.id ?? null,
          rowKey: alert?.id != null
            ? `alert-${alert.id}`
            : `${alert?.deviceId ?? alert?.device ?? alert?.device_id ?? 'UNKNOWN'}-${alert?.timestamp ?? alert?.createdAt ?? alert?.created_at ?? 'na'}-${index}`,
          deviceId: alert?.deviceId ?? alert?.device ?? alert?.device_id ?? 'UNKNOWN',
          type: alert?.type ?? alert?.title ?? alert?.message ?? 'Unspecified alert',
          severity: normalizeSeverity(alert?.severity),
          status: normalizeStatus(alert?.status),
          timestamp: formatAlertTimestamp(alert?.timestamp ?? alert?.createdAt ?? alert?.created_at ?? '-'),
          timestampMs: parseAlertTimestamp(alert?.timestamp ?? alert?.createdAt ?? alert?.created_at ?? '-')?.getTime() ?? null,
          resolutionHours: alert?.resolutionHours ?? alert?.durationHours,
        }));
        setAlerts(rows);
      }

      if (devicesRes.status === 'fulfilled') {
        setDevices(toArray(devicesRes.value?.devices ?? devicesRes.value?.data ?? devicesRes.value));
      }

      if (alertsRes.status === 'rejected' && devicesRes.status === 'rejected') {
        setError('Failed to load alerts and device exposure data from backend API.');
      }

      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const alertsInRange = useMemo(() => {
    const rangeHours = getRangeHours(timeRange);
    if (!Number.isFinite(rangeHours)) return alerts;

    const cutoffMs = Date.now() - (rangeHours * 60 * 60 * 1000);
    return alerts.filter((alert) => {
      if (!Number.isFinite(alert.timestampMs)) return false;
      return alert.timestampMs >= cutoffMs;
    });
  }, [alerts, timeRange]);

  const filteredAlerts = useMemo(() => {
    return alertsInRange.filter((alert) => {
      const matchesSeverity = activeFilter === 'All' || String(alert.severity).toLowerCase() === activeFilter.toLowerCase();
      const matchesSearch =
        String(alert.deviceId).toLowerCase().includes(search.toLowerCase()) ||
        String(alert.type).toLowerCase().includes(search.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [activeFilter, alertsInRange, search]);

  const totalAlerts = alertsInRange.length;
  const criticalThreats = alertsInRange.filter((a) => String(a.severity).toLowerCase() === 'critical').length;
  const activeSessions = alertsInRange.filter((a) => ['open', 'live', 'investigating'].includes(String(a.status).toLowerCase())).length;

  const mttrHours = useMemo(() => {
    const resolved = alertsInRange.filter((a) => ['resolved', 'closed'].includes(String(a.status).toLowerCase()));
    if (resolved.length === 0) return 0;

    const resolutionHours = resolved.map((row) => {
      const direct = Number(row?.resolutionHours ?? row?.durationHours);
      return Number.isFinite(direct) ? Math.max(direct, 0) : 0;
    });

    const avg = resolutionHours.reduce((a, b) => a + b, 0) / resolved.length;
    return Number.isFinite(avg) ? avg : 0;
  }, [alertsInRange]);

  const alertTrendData = useMemo(() => {
    const buckets = new Map();

    alertsInRange.forEach((row) => {
      const date = Number.isFinite(row.timestampMs) ? new Date(row.timestampMs) : null;
      const hour = date && Number.isFinite(date.getTime()) ? `${String(date.getHours()).padStart(2, '0')}:00` : 'Unknown';
      buckets.set(hour, (buckets.get(hour) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .map(([time, count]) => ({ time, alerts: count }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [alertsInRange]);

  const vulnerabilityNodes = useMemo(() => {
    return devices.slice(0, 40).map((dev, index) => {
      const risk = String(dev?.risk ?? dev?.riskLevel ?? 'unknown').toLowerCase();
      return {
        id: dev?.id ?? dev?.deviceId ?? `node-${index}`,
        status: risk === 'high' ? 'critical' : risk === 'medium' ? 'minor' : risk === 'low' ? 'secure' : 'unknown',
      };
    });
  }, [devices]);

  return (
    <div className="main-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header items-center">
        <div>
          <h1 className="page-title">Alerts Management</h1>
          <p className="page-subtitle">Monitor and respond to security threats in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="search-bar" style={{ width: 280 }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search device or alert..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="glass-input"
              style={{
                minWidth: 130,
                padding: '0.52rem 1.85rem 0.52rem 0.75rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-main)',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                cursor: 'pointer',
              }}
              aria-label="Time range"
            >
             
            </select>
              
          </div>
         
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '0.8rem 1rem', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {syncWarning && (
        <div className="glass-panel" style={{ padding: '0.8rem 1rem', color: 'var(--warning)' }}>
          {syncWarning}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatCard title="Total Alerts" value={loading ? '...' : String(totalAlerts)} trend="+0.0%" isPositive={false} icon={AlertTriangle} iconColor="#2FB6C4" />
        <StatCard title="Critical Threats" value={loading ? '...' : String(criticalThreats)} trend="+0.0%" isPositive={false} icon={ShieldAlert} iconColor="#EF4444" />
        <StatCard title="Active Sessions" value={loading ? '...' : String(activeSessions)} trend="+0.0%" isPositive={true} icon={Radio} iconColor="#22C55E" />
        <StatCard title="Mean Time To Resolve" value={loading ? '...' : `${mttrHours.toFixed(1)}h`} trend="-0.0%" isPositive={true} icon={Timer} iconColor="#F59E0B" />
      </div>

      <div className="glass-panel device-table-card" style={{ overflow: 'hidden' }}>
        <div className="card-header">
          <div className="card-title">
            <h3>Active Alerts</h3>
            <span className="text-muted text-sm">{filteredAlerts.length} results</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setActiveFilter(s)}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.875rem',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  border: activeFilter === s ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: activeFilter === s ? 'var(--accent-dim)' : 'transparent',
                  color: activeFilter === s ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {s === 'All' ? 'All Severities' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="device-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Alert Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Loading alerts...
                  </td>
                </tr>
              )}

              {!loading && filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No alerts match your filter.
                  </td>
                </tr>
              )}

              {filteredAlerts.map((alert) => (
                <tr key={alert.rowKey} style={{ cursor: 'pointer' }}>
                  <td className="font-mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.875rem' }}>
                    {alert.deviceId}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: '0.9rem' }}>{alert.type}</td>
                  <td><Badge label={alert.severity} colorStyle={severityStyle(alert.severity)} /></td>
                  <td><Badge label={alert.status} colorStyle={statusStyle(alert.status)} /></td>
                  <td className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{alert.timestamp}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn-small" title="View details"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <AlertTrendChart data={alertTrendData} loading={loading} />
        <VulnerabilityMap nodes={vulnerabilityNodes} loading={loading} />
      </div>
    </div>
  );
}
