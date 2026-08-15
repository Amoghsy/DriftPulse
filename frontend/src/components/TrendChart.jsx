import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        background: "rgba(12, 22, 34, 0.95)",
        border: "1px solid rgba(34, 211, 238, 0.3)",
        borderRadius: "8px",
        padding: "0.6rem 0.8rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}>
        <p className="tooltip-label" style={{ color: "#E2EBF0", fontWeight: 600, fontSize: "0.8rem", marginBottom: "0.3rem" }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="tooltip-item" style={{ color: entry.color, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.15rem 0" }}>
            <span className="tooltip-dot" style={{ backgroundColor: entry.color, width: 7, height: 7, borderRadius: "50%", display: "inline-block" }} />
            {entry.name}: <strong>{entry.value}{entry.dataKey === "drift" && entry.value <= 1 ? " (" + (entry.value * 100).toFixed(0) + "%)" : ""}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data = [], loading = false }) {
  const rawData = Array.isArray(data) ? data : [];

  // Normalize data for dual-axis or clear percentage scaling
  const chartData = rawData.map((item) => {
    const rawTrust = Number(item?.trust ?? item?.trustScore ?? 0);
    const rawDrift = Number(item?.drift ?? item?.driftScore ?? 0);
    // If drift is 0..1 scale, convert to percentage scale (0..100) for visual clarity if plotted on same axis
    const driftScaled = rawDrift <= 1 ? Number((rawDrift * 100).toFixed(1)) : rawDrift;

    return {
      time: item?.time ?? item?.label ?? "T",
      trust: Number(rawTrust.toFixed(1)),
      drift: Number(rawDrift.toFixed(2)),
      driftScaled: Number(driftScaled.toFixed(1)),
    };
  });

  return (
    <div className="chart-card glass-panel fade-in delay-1" style={{ minHeight: 320, display: "flex", flexDirection: "column" }}>
      <div className="card-header">
        <div className="card-title">
          <h3>Trust Score vs Drift Trend</h3>
          <span className="text-muted text-sm">{loading ? 'Loading...' : 'Behavioral trajectory analysis'}</span>
        </div>
      </div>
      <div style={{ flex: 1, paddingTop: '0.5rem', minHeight: 260 }}>
        {!loading && chartData.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
            No trend data available.
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(29, 53, 87, 0.6)" vertical={false} />
            <XAxis dataKey="time" stroke="#7FA8C0" tick={{ fill: '#7FA8C0', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="trustAxis" domain={[0, 100]} stroke="#7FA8C0" tick={{ fill: '#7FA8C0', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="driftAxis" orientation="right" domain={[0, 100]} stroke="#EF4444" tick={{ fill: '#EF4444', fontSize: 10 }} tickLine={false} axisLine={false} hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#7FA8C0' }} />
            <Area yAxisId="trustAxis" type="monotone" dataKey="trust" name="Trust Score (0-100)" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrust)" />
            <Area yAxisId="driftAxis" type="monotone" dataKey="driftScaled" name="Drift Rate (%)" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDrift)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
