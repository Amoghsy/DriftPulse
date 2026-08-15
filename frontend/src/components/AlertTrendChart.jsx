import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getBarColor = (value) => {
  if (value > 40) return '#EF4444';
  if (value > 20) return '#F59E0B';
  return '#22C55E';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const color = getBarColor(payload[0].value);
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-item" style={{ color }}>
          <span className="tooltip-dot" style={{ backgroundColor: color }} />
          <strong>{payload[0].value} Alerts</strong>
        </p>
      </div>
    );
  }
  return null;
};

export default function AlertTrendChart({ data = [], loading = false }) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="chart-card glass-panel">
      <div className="card-header">
        <div className="card-title">
          <h3>Alert Trend (24H)</h3>
          <span className="text-muted text-sm">{loading ? 'Loading...' : 'Hourly alert volume'}</span>
        </div>
      </div>
      <div style={{ paddingTop: '0.5rem' }}>
        {!loading && chartData.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
            No alert trend data returned by backend.
          </div>
        )}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6F8F8C', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6F8F8C', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(47, 182, 196, 0.06)' }} />
            <Bar dataKey="alerts" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={getBarColor(entry.alerts)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
