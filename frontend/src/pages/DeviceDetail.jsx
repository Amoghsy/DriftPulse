import { createElement, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Activity, Shield, AlertTriangle, Clock, MapPin, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDeviceById, getDriftTrend, getTrustTrend } from '../services/api';

const toArray = (value) => (Array.isArray(value) ? value : []);
const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatBytes = (value) => {
  const n = toNumber(value, 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)} GB`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)} MB`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} KB`;
  return `${Math.round(n)} B`;
};

const statsPanel = (label, value, color, Icon) => (
  <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.5rem' }}>
    {createElement(Icon, { size: 22, style: { color } })}
    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: '1.15rem', fontWeight: 700, color, fontFamily: '"Poppins", sans-serif' }}>{value}</div>
  </div>
);

const combineSeries = (trustPoints, driftPoints) => {
  const byTime = new Map();

  trustPoints.forEach((point, index) => {
    const time = point?.time ?? point?.timestamp ?? point?.label ?? `T${index + 1}`;
    const row = byTime.get(time) ?? { time, trust: 0, drift: 0, anomaly: 0 };
    row.trust = toNumber(point?.trust ?? point?.trustScore ?? point?.value);
    byTime.set(time, row);
  });

  driftPoints.forEach((point, index) => {
    const time = point?.time ?? point?.timestamp ?? point?.label ?? `T${index + 1}`;
    const row = byTime.get(time) ?? { time, trust: 0, drift: 0, anomaly: 0 };
    row.drift = toNumber(point?.drift ?? point?.driftScore ?? point?.value);
    row.anomaly = toNumber(point?.anomaly ?? point?.anomalyScore, row.drift > 0.7 ? 1 : 0);
    byTime.set(time, row);
  });

  return Array.from(byTime.values()).sort((a, b) => String(a.time).localeCompare(String(b.time)));
};

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncWarning, setSyncWarning] = useState('');

  useEffect(() => {
    if (!id) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      setSyncWarning('');

      const [deviceRes, trustRes, driftRes] = await Promise.allSettled([
        getDeviceById(id),
        getTrustTrend(id),
        getDriftTrend(id),
      ]);

      if (!active) return;

      if (deviceRes.status === 'fulfilled') {
        const raw = deviceRes.value?.device ?? deviceRes.value?.data ?? deviceRes.value ?? {};
        const deviceId = raw?.id ?? raw?.deviceId ?? id;
        setDevice({
          id: deviceId,
          ip: raw?.ip ?? raw?.ipAddress ?? '-',
          logCount: toNumber(raw?.logCount ?? raw?.log_count),
          totalBytes: toNumber(raw?.totalBytes ?? raw?.total_bytes),
          lastSeen: raw?.lastSeen ?? raw?.lastSeenAt ?? '-',
          firmware: raw?.firmware ?? raw?.agentVersion ?? '-',
          risk: raw?.risk ?? raw?.riskLevel ?? 'Unknown',
          policy: raw?.policy ?? raw?.policyStatus ?? 'Unknown',
          trustScore: toNumber(raw?.trustScore ?? raw?.trust),
          type: raw?.type ?? raw?.deviceType ?? 'Device',
        });
      }

      const trustPoints = trustRes.status === 'fulfilled'
        ? toArray(trustRes.value?.points ?? trustRes.value?.data ?? trustRes.value)
        : [];
      const driftPoints = driftRes.status === 'fulfilled'
        ? toArray(driftRes.value?.points ?? driftRes.value?.data ?? driftRes.value)
        : [];

      setChartData(combineSeries(trustPoints, driftPoints));

      if (
        deviceRes.status === 'rejected' &&
        trustRes.status === 'rejected' &&
        driftRes.status === 'rejected'
      ) {
        setError('Failed to load device details from backend API.');
      }

      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const viewModel = useMemo(() => {
    return device;
  }, [device]);

  const trustColor = (viewModel?.trustScore ?? 0) >= 80 ? 'var(--success)' : (viewModel?.trustScore ?? 0) >= 50 ? 'var(--warning)' : 'var(--danger)';
  const riskColor = String(viewModel?.risk ?? '').toLowerCase() === 'high' ? 'var(--danger)' : String(viewModel?.risk ?? '').toLowerCase() === 'medium' ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="main-content fade-in">
      <button className="btn-text" onClick={() => navigate('/devices')} style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft size={15} />
        Back to Devices
      </button>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '1.25rem', padding: '0.8rem 1rem', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {syncWarning && (
        <div className="glass-panel" style={{ marginBottom: '1.25rem', padding: '0.8rem 1rem', color: 'var(--warning)' }}>
          {syncWarning}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: 'var(--accent-dim)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(47,182,196,0.3)', color: 'var(--accent)', flexShrink: 0 }}>
              <Server size={30} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: 'var(--accent)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                {loading ? 'Loading...' : (viewModel?.id ?? 'Unavailable')}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Activity size={13} style={{ color: 'var(--text-muted)' }} /> {viewModel?.ip ?? '-'}
                </span>
                
                
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} /> Last seen: {viewModel?.lastSeen ?? '-'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          
           
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '1rem' }}>
            {statsPanel('Risk Level', viewModel?.risk ?? '-', riskColor, Shield)}
            {statsPanel('Policy Status', viewModel?.policy ?? '-', String(viewModel?.policy ?? '').toLowerCase() === 'non-compliant' ? 'var(--danger)' : 'var(--warning)', AlertTriangle)}
            {statsPanel('Trust Score', `${viewModel?.trustScore ?? 0}/100`, trustColor, Activity)}
            {statsPanel('Log Count', `${Math.round(viewModel?.logCount ?? 0)}`, 'var(--accent)', Cpu)}
            {statsPanel('Total Bytes', formatBytes(viewModel?.totalBytes ?? 0), 'var(--info)', MapPin)}
          </div>

          <div className="glass-panel" style={{ padding: '1.4rem', width: '100%', maxWidth: 860, margin: '0 auto' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Activity size={17} style={{ color: 'var(--accent)' }} />
                Drift Severity Analysis
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {loading ? 'Loading time series data...' : 'Configuration and behavior drift over time'}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDriftDet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorAnomalyDet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(39,74,78,0.5)" vertical={false} />
                <XAxis dataKey="time" stroke="#6F8F8C" tick={{ fill: '#6F8F8C', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6F8F8C" tick={{ fill: '#6F8F8C', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: 8 }} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-muted)' }} />
                <Area type="monotone" dataKey="drift" name="Drift Level" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDriftDet)" />
                <Area type="monotone" dataKey="anomaly" name="Anomaly Spike" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAnomalyDet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
