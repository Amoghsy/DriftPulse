import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, change, icon: Icon, trend, color, iconColor }) {
  const isUp = trend === 'up';

  return (
    <div className="metric-card glass-panel slide-up">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className="metric-icon-wrapper" style={iconColor ? { background: iconColor + '20', color: iconColor, border: `1px solid ${iconColor}30` } : {}}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="metric-body">
        <h3 className="metric-value" style={color ? { color } : {}}>{value}</h3>
        {change && (
          <div className={`metric-change-wrapper ${isUp ? 'trend-up' : 'trend-down'}`}>
            {isUp
              ? <TrendingUp size={13} style={{ color: 'var(--success)' }} />
              : <TrendingDown size={13} style={{ color: 'var(--danger)' }} />
            }
            <span className="metric-change">{isUp ? '+' : ''}{change}</span>
            <span className="metric-period">vs last week</span>
          </div>
        )}
      </div>
    </div>
  );
}
