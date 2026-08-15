import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{
        background: "rgba(12, 22, 34, 0.95)",
        border: "1px solid rgba(34, 211, 238, 0.3)",
        borderRadius: "8px",
        padding: "0.5rem 0.75rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}>
        <p className="tooltip-item" style={{ color: d.color, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}>
          <span className="tooltip-dot" style={{ backgroundColor: d.color, width: 7, height: 7, borderRadius: "50%", display: "inline-block" }} />
          {d.name}: <strong>{d.value} device{d.value !== 1 ? 's' : ''}</strong>
        </p>
      </div>
    );
  }
  return null;
};

export default function DonutChart({ data = [], loading = false }) {
  const chartData = Array.isArray(data) ? data : [];
  const total = chartData.reduce((sum, item) => sum + (Number(item?.value) || 0), 0);

  return (
    <div className="chart-card glass-panel fade-in delay-2" style={{ minHeight: 320, display: "flex", flexDirection: "column" }}>
      <div className="card-header">
        <div className="card-title">
          <h3>Anomaly Distribution</h3>
          <span className="text-muted text-sm">{loading ? 'Loading...' : 'By risk level'}</span>
        </div>
      </div>
      <div className="chart-container donut-container" style={{ flex: 1, paddingTop: '0.25rem', position: "relative", minHeight: 220 }}>
        {!loading && total === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '3rem' }}>
            No anomaly distribution available.
          </div>
        )}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData.length > 0 ? chartData : [{ name: "None", value: 1, color: "#1D3557" }]}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={88}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {(chartData.length > 0 ? chartData : [{ color: "#1D3557" }]).map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center-info" style={{
          position: "absolute", top: "44%", left: "50%", transform: "translate(-50%, -50%)",
          textAlign: "center", pointerEvents: "none"
        }}>
          <span className="donut-total" style={{ display: "block", fontSize: "1.6rem", fontWeight: 700, color: "#fff" }}>{total}</span>
          <span className="donut-label" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Devices</span>
        </div>
      </div>
      <div className="legend-custom" style={{ display: "flex", justifyContent: "center", gap: "1rem", paddingTop: "0.5rem" }}>
        {chartData.map((entry, i) => (
          <div key={i} className="legend-item" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            <span className="legend-color" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.color, display: "inline-block" }} />
            <span>{entry.name}: <strong>{entry.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}
