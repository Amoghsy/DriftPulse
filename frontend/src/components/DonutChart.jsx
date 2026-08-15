import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-item" style={{ color: d.color }}>
          <span className="tooltip-dot" style={{ backgroundColor: d.color }} />
          {d.name}: <strong>{d.value}</strong>
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
    <div className="chart-card glass-panel fade-in delay-2">
      <div className="card-header">
        <div className="card-title">
          <h3>Anomaly Distribution</h3>
          <span className="text-muted text-sm">{loading ? 'Loading...' : 'By risk level'}</span>
        </div>
      </div>
      <div className="chart-container donut-container" style={{ paddingTop: '0.25rem' }}>
        {!loading && chartData.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '3rem' }}>
            No anomaly distribution returned by backend.
          </div>
        )}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={88}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center-info">
          <span className="donut-total">{total}</span>
          <span className="donut-label">Devices</span>
        </div>
      </div>
      <div className="legend-custom">
        {chartData.map((entry, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
