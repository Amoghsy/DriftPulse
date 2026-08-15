export function generatePdfReport({ fileName, timestamp, metrics, devices = [], trendData = [], donutData = [] }) {
  const reportDate = new Date(timestamp || Date.now()).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  })

  const reportId = "DP-RPT-" + Math.floor(100000 + Math.random() * 900000)

  const devicesHtml = devices.map(d => `
    <tr>
      <td style="font-family: monospace; font-weight: bold; color: #22D3EE;">${d.id}</td>
      <td style="font-family: monospace;">${d.ip}</td>
      <td>${d.logCount?.toLocaleString() || 0}</td>
      <td>${formatBytes(d.totalBytes)}</td>
      <td><strong>${d.trustScore?.toFixed(1) || 0}/100</strong></td>
      <td>${d.driftScore?.toFixed(3) || 0}</td>
      <td>${d.anomalyScore?.toFixed(3) || 0}</td>
      <td><span class="badge ${d.risk === 'High' ? 'badge-danger' : d.risk === 'Medium' ? 'badge-warning' : 'badge-success'}">${d.policy}</span></td>
      <td style="font-weight: bold; color: ${d.risk === 'High' ? '#EF4444' : d.risk === 'Medium' ? '#F59E0B' : '#22C55E'};">${d.risk}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DriftPulse Security Report - ${reportId}</title>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: "Inter", sans-serif;
          background: #080D13;
          color: #E2EBF0;
          padding: 2.5rem;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #1D3557;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }
        .brand {
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .brand span { color: #22D3EE; }
        .meta-box {
          text-align: right;
          font-size: 0.82rem;
          color: #7FA8C0;
        }
        .title-section {
          margin-bottom: 2rem;
        }
        .title-section h1 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #22D3EE;
          margin-bottom: 0.3rem;
        }
        .title-section p {
          color: #7FA8C0;
          font-size: 0.9rem;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          background: #101C2E;
          border: 1px solid #1D3557;
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
        }
        .metric-card .val {
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
          margin-top: 0.25rem;
        }
        .metric-card .lbl {
          font-size: 0.75rem;
          color: #7FA8C0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .table-section {
          background: #101C2E;
          border: 1px solid #1D3557;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .table-section h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        th, td {
          padding: 0.75rem 0.85rem;
          text-align: left;
          border-bottom: 1px solid rgba(29,53,87,0.6);
        }
        th {
          color: #7FA8C0;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge {
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-success { background: rgba(34,197,94,0.15); color: #22C55E; }
        .badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; }
        .badge-danger { background: rgba(239,68,68,0.15); color: #EF4444; }
        .footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid #1D3557;
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #7FA8C0;
        }
        .print-btn {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background: #22D3EE;
          color: #080D13;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(34,211,238,0.4);
        }
        @media print {
          body { background: #fff !important; color: #000 !important; padding: 1rem; }
          .metric-card, .table-section { background: #fff !important; border-color: #ccc !important; }
          .brand, .title-section h1, .table-section h3, .metric-card .val { color: #000 !important; }
          th, td { border-bottom-color: #eee !important; color: #333 !important; }
          .print-btn { display: none !important; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Download PDF / Print</button>
      
      <div class="header">
        <div class="brand">Drift<span>Pulse</span></div>
        <div class="meta-box">
          <div>Report ID: <strong>${reportId}</strong></div>
          <div>Generated: ${reportDate}</div>
        </div>
      </div>

      <div class="title-section">
        <h1>SOC Security & Behavioral Analysis Report</h1>
        <p>Telemetry Source: <strong>${fileName || 'IoT Telemetry Upload'}</strong></p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="lbl">Total Devices</div>
          <div class="val">${metrics?.totalDevices ?? devices.length}</div>
        </div>
        <div class="metric-card">
          <div class="lbl">High Risk Devices</div>
          <div class="val" style="color: #EF4444;">${metrics?.highRiskDevices ?? 0}</div>
        </div>
        <div class="metric-card">
          <div class="lbl">Avg Trust Score</div>
          <div class="val" style="color: #22C55E;">${metrics?.avgTrustScore?.toFixed(1) ?? 0}</div>
        </div>
        <div class="metric-card">
          <div class="lbl">Active Alerts</div>
          <div class="val" style="color: #F59E0B;">${metrics?.activeAlerts ?? 0}</div>
        </div>
      </div>

      <div class="table-section">
        <h3>Monitored IoT Assets Audit</h3>
        <table>
          <thead>
            <tr>
              <th>Device ID</th>
              <th>IP Address</th>
              <th>Logs</th>
              <th>Total Bytes</th>
              <th>Trust Score</th>
              <th>Drift Rate</th>
              <th>Anomaly Score</th>
              <th>Policy</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${devicesHtml || '<tr><td colSpan="9">No device records available.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div>DriftPulse AI/ML Threat Intelligence System &bull; End-to-End Encryption</div>
        <div>Page 1 of 1</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        }
      </script>
    </body>
    </html>
  `

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function formatBytes(n) {
  if (!n) return "0 B"
  if (n >= 1e9) return (n/1e9).toFixed(2) + " GB"
  if (n >= 1e6) return (n/1e6).toFixed(2) + " MB"
  if (n >= 1e3) return (n/1e3).toFixed(2) + " KB"
  return Math.round(n) + " B"
}
