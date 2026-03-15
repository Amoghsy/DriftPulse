import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="tooltip-item" style={{ color: entry.color }}>
            <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data = [], loading = false }) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="chart-card glass-panel fade-in delay-1">
      <div className="card-header">
        <div className="card-title">
          <h3>Trust Score vs Drift Trend</h3>
          <span className="text-muted text-sm">{loading ? 'Loading...' : ''}</span>
        </div>
       
      </div>
      <div style={{ paddingTop: '0.5rem' }}>
        {!loading && chartData.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
            No trend data returned by backend.
          </div>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(39,74,78,0.6)" vertical={false} />
            <XAxis dataKey="time" stroke="#6F8F8C" tick={{ fill: '#6F8F8C', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#6F8F8C" tick={{ fill: '#6F8F8C', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(47,182,196,0.2)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#9DB5B2' }} />
            <Area type="monotone" dataKey="trust" name="Trust Score" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrust)" />
            <Area type="monotone" dataKey="drift" name="Drift Score" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDrift)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
