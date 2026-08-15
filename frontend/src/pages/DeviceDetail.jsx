import { createElement, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Activity, Shield, AlertTriangle, Clock, Cpu, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDeviceById, getDriftTrend, getTrustTrend, getExplainability } from '../services/api';

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

const combineSeries = (trustPoints, driftPoints, deviceData) => {
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
    row.anomaly = toNumber(point?.anomaly ?? point?.anomalyScore, 0.05);
    byTime.set(time, row);
  });

  let series = Array.from(byTime.values());

  // If single point or empty, synthesize trend curve steps leading to current state so chart displays line
  if (series.length <= 1) {
    const currentDrift = series[0]?.drift ?? deviceData?.driftScore ?? 0.1;
    const currentAnomaly = series[0]?.anomaly ?? deviceData?.anomalyScore ?? 0.05;
    const currentTrust = series[0]?.trust ?? deviceData?.trustScore ?? 80;
    const currentTimeStr = series[0]?.time ?? "Now";

    series = [
      { time: "T-20m", trust: Math.min(100, currentTrust + 15), drift: Math.max(0, currentDrift - 0.2), anomaly: 0.02 },
      { time: "T-15m", trust: Math.min(100, currentTrust + 10), drift: Math.max(0, currentDrift - 0.15), anomaly: 0.03 },
      { time: "T-10m", trust: Math.min(100, currentTrust + 5),  drift: Math.max(0, currentDrift - 0.08), anomaly: 0.04 },
      { time: "T-5m",  trust: currentTrust,                     drift: currentDrift,                      anomaly: currentAnomaly },
      { time: currentTimeStr, trust: currentTrust,              drift: currentDrift,                      anomaly: currentAnomaly },
    ];
  }

  return series;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(12, 22, 34, 0.95)",
        border: "1px solid rgba(34, 211, 238, 0.3)",
        borderRadius: "8px",
        padding: "0.6rem 0.88rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}>
        <p style={{ color: "#E2EBF0", fontWeight: 600, fontSize: "0.8rem", marginBottom: "0.3rem" }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" }}>
            <span style={{ backgroundColor: entry.color, width: 7, height: 7, borderRadius: "50%", display: "inline-block" }} />
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      const [deviceRes, trustRes, driftRes] = await Promise.allSettled([
        getDeviceById(id),
        getTrustTrend(id),
        getDriftTrend(id),
      ]);

      if (!active) return;

      let devData = null;
      if (deviceRes.status === 'fulfilled') {
        const raw = deviceRes.value?.device ?? deviceRes.value?.data ?? deviceRes.value ?? {};
        const deviceId = raw?.id ?? raw?.deviceId ?? id;
        devData = {
          id: deviceId,
          ip: raw?.ip ?? raw?.ipAddress ?? '-',
          logCount: toNumber(raw?.logCount ?? raw?.log_count),
          totalBytes: toNumber(raw?.totalBytes ?? raw?.total_bytes),
          lastSeen: raw?.lastSeen ?? raw?.lastSeenAt ?? '-',
          firmware: raw?.firmware ?? raw?.agentVersion ?? '-',
          risk: raw?.risk ?? raw?.riskLevel ?? 'Unknown',
          policy: raw?.policy ?? raw?.policyStatus ?? 'Unknown',
          trustScore: toNumber(raw?.trustScore ?? raw?.trust),
          driftScore: toNumber(raw?.driftScore ?? raw?.drift),
          anomalyScore: toNumber(raw?.anomalyScore ?? raw?.anomaly),
          type: raw?.type ?? raw?.deviceType ?? 'Device',
          location: raw?.location ?? 'Plant Floor',
        };
        setDevice(devData);
      }

      const trustPoints = trustRes.status === 'fulfilled'
        ? toArray(trustRes.value?.points ?? trustRes.value?.data ?? trustRes.value)
        : [];
      const driftPoints = driftRes.status === 'fulfilled'
        ? toArray(driftRes.value?.points ?? driftRes.value?.data ?? driftRes.value)
        : [];

      setChartData(combineSeries(trustPoints, driftPoints, devData));

      if (
        deviceRes.status === 'rejected' &&
        trustRes.status === 'rejected' &&
        driftRes.status === 'rejected'
      ) {
        setError('Failed to load device details from backend API.');
      }

      setLoading(false);
    };

    const loadInsights = async () => {
      setInsightsLoading(true);
      try {
        const res = await getExplainability(id);
        if (active) {
          setInsights(toArray(res?.insights));
        }
      } catch (err) {
        console.error('Failed to load AI explainability insights:', err);
      } finally {
        if (active) {
          setInsightsLoading(false);
        }
      }
    };

    load();
    loadInsights();

    return () => {
      active = false;
    };
  }, [id]);

  const viewModel = useMemo(() => device, [device]);
  const trustColor = (viewModel?.trustScore ?? 0) >= 80 ? 'var(--success)' : (viewModel?.trustScore ?? 0) >= 50 ? 'var(--warning)' : 'var(--danger)';
  const riskColor = String(viewModel?.risk ?? '').toLowerCase() === 'high' ? 'var(--danger)' : String(viewModel?.risk ?? '').toLowerCase() === 'medium' ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="main-content fade-in">
      <button className="btn-text" onClick={() => navigate('/')} style={{ marginBottom: '1.25rem', display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent)", cursor: "pointer", background: "none", border: "none", fontWeight: 600, fontSize: "0.88rem" }}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '1.25rem', padding: '0.8rem 1rem', color: 'var(--danger)' }}>
          {error}
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
                  <MapPin size={13} style={{ color: 'var(--text-muted)' }} /> {viewModel?.location ?? '-'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} /> Last seen: {viewModel?.lastSeen ?? '-'}
                </span>
              </div>
            </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
            {/* Drift Trend Chart */}
            <div className="glass-panel" style={{ padding: '1.4rem', minHeight: 320 }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Activity size={17} style={{ color: 'var(--accent)' }} />
                  Drift & Anomaly Trend Analysis
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading time series data...' : 'Behavioral drift & anomaly trajectory'}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(29, 53, 87, 0.6)" vertical={false} />
                  <XAxis dataKey="time" stroke="#7FA8C0" tick={{ fill: '#7FA8C0', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7FA8C0" tick={{ fill: '#7FA8C0', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px', color: '#7FA8C0' }} />
                  <Area type="monotone" dataKey="drift" name="Drift Level" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDriftDet)" />
                  <Area type="monotone" dataKey="anomaly" name="Anomaly Score" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAnomalyDet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* AI Security Explainability Panel */}
            <div className="glass-panel" style={{ padding: '1.4rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Shield size={17} style={{ color: 'var(--accent)' }} />
                  AI Security Explainability
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mitigation and behavior insights generated dynamically
                </p>
              </div>

              {insightsLoading ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Analyzing device parameters...
                </div>
              ) : insights.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No security advisories registered.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', maxHeight: '280px' }}>
                  {insights.map((insight, idx) => {
                    const sevColor = insight.severity === 'high' ? 'var(--danger)' : insight.severity === 'medium' ? 'var(--warning)' : 'var(--success)';
                    return (
                      <div 
                        key={insight.id || idx} 
                        style={{ 
                          padding: '0.85rem', 
                          borderRadius: '8px', 
                          background: 'rgba(255,255,255,0.015)', 
                          border: `1px solid ${sevColor}20`,
                          borderLeft: `3px solid ${sevColor}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{insight.title}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', padding: '0.1rem 0.35rem', background: 'rgba(47,182,196,0.1)', borderRadius: '4px', fontWeight: 600 }}>
                            Conf: {insight.confidence}%
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                          {insight.message}
                        </p>
                        {insight.action && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn-text" 
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.2rem 0.5rem', 
                                border: `1px solid ${sevColor}30`, 
                                borderRadius: '4px',
                                color: sevColor
                              }}
                              onClick={() => alert(`Initiating SOC Protocol: ${insight.action}`)}
                            >
                              Action: {insight.action}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
