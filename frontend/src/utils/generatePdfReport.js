export function generatePdfReport({ fileName, timestamp, metrics, devices = [], trendData = [], donutData = [] }) {
  const reportDate = new Date(timestamp || Date.now()).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  })

  const reportId = "DP-RPT-" + Math.floor(100000 + Math.random() * 900000)

  // Devices table rows
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

  // 1. Generate SVG Trend Area Chart
  const pts = trendData.length > 0 ? trendData : devices.slice(0, 6).map((d, i) => ({ time: `T${i+1}`, trust: d.trustScore || 80, drift: d.driftScore || 0.1 }))
  const svgWidth = 520
  const svgHeight = 200
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30

  const chartW = svgWidth - paddingLeft - paddingRight
  const chartH = svgHeight - paddingTop - paddingBottom

  const count = Math.max(1, pts.length)
  const trustPointsCoords = pts.map((p, i) => {
    const x = paddingLeft + (i / Math.max(1, count - 1)) * chartW
    const y = paddingTop + (1 - Math.min(100, Math.max(0, p.trust || p.trustScore || 0)) / 100) * chartH
    return `${x},${y}`
  })

  const driftPointsCoords = pts.map((p, i) => {
    const rawDrift = p.drift ?? p.driftScore ?? 0
    const driftScaled = rawDrift <= 1 ? rawDrift * 100 : rawDrift
    const x = paddingLeft + (i / Math.max(1, count - 1)) * chartW
    const y = paddingTop + (1 - Math.min(100, Math.max(0, driftScaled)) / 100) * chartH
    return `${x},${y}`
  })

  const trustAreaPath = trustPointsCoords.length > 0
    ? `M ${paddingLeft},${paddingTop + chartH} L ${trustPointsCoords.join(" L ")} L ${paddingLeft + chartW},${paddingTop + chartH} Z`
    : ""

  const driftAreaPath = driftPointsCoords.length > 0
    ? `M ${paddingLeft},${paddingTop + chartH} L ${driftPointsCoords.join(" L ")} L ${paddingLeft + chartW},${paddingTop + chartH} Z`
    : ""

  const xGridHtml = pts.map((p, i) => {
    const x = paddingLeft + (i / Math.max(1, count - 1)) * chartW
    return `<text x="${x}" y="${svgHeight - 8}" fill="#7FA8C0" font-size="10" text-anchor="middle">${p.time || `T${i+1}`}</text>`
  }).join('')

  // 2. Generate SVG Donut Chart
  const lowCount = devices.filter(d => d.risk === 'Low').length || (donutData.find(d => d.name?.includes('Low'))?.value ?? 0)
  const medCount = devices.filter(d => d.risk === 'Medium').length || (donutData.find(d => d.name?.includes('Med'))?.value ?? 0)
  const highCount = devices.filter(d => d.risk === 'High').length || (donutData.find(d => d.name?.includes('High'))?.value ?? 0)
  const totalDevs = devices.length || (lowCount + medCount + highCount) || 1

  const donutSvg = `
    <svg width="220" height="200" viewBox="0 0 220 200" style="display: block; margin: 0 auto;">
      <circle cx="110" cy="100" r="70" fill="none" stroke="#1D3557" stroke-width="24" />
      ${generateDonutSlices(lowCount, medCount, highCount, totalDevs)}
      <text x="110" y="95" fill="#FFFFFF" font-size="22" font-weight="bold" text-anchor="middle">${totalDevs}</text>
      <text x="110" y="115" fill="#7FA8C0" font-size="11" text-anchor="middle">DEVICES</text>
    </svg>
  `

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DriftPulse Security Intelligence Report - ${reportId}</title>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: "Inter", sans-serif;
          background: #080D13;
          color: #E2EBF0;
          padding: 2.5rem;
          line-height: 1.5;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #1D3557;
          padding-bottom: 1.5rem;
          margin-bottom: 1.75rem;
        }
        .brand {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .brand span { color: #22D3EE; }
        .meta-box {
          text-align: right;
          font-size: 0.82rem;
          color: #7FA8C0;
        }
        .title-section {
          margin-bottom: 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .title-section h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #22D3EE;
          margin-bottom: 0.2rem;
        }
        .title-section p {
          color: #7FA8C0;
          font-size: 0.9rem;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .metric-card {
          background: #101C2E;
          border: 1px solid #1D3557;
          border-radius: 12px;
          padding: 1.15rem;
          text-align: center;
        }
        .metric-card .val {
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
          margin-top: 0.2rem;
        }
        .metric-card .lbl {
          font-size: 0.72rem;
          color: #7FA8C0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }
        .charts-row {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }
        .chart-box {
          background: #101C2E;
          border: 1px solid #1D3557;
          border-radius: 12px;
          padding: 1.25rem;
        }
        .chart-box h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.2rem;
        }
        .chart-box p {
          font-size: 0.78rem;
          color: #7FA8C0;
          margin-bottom: 1rem;
        }
        .legend-list {
          display: flex;
          justify-content: center;
          gap: 1.25rem;
          margin-top: 0.75rem;
          font-size: 0.78rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .table-section {
          background: #101C2E;
          border: 1px solid #1D3557;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.75rem;
        }
        .table-section h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.85rem;
          color: #fff;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        th, td {
          padding: 0.65rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(29,53,87,0.6);
        }
        th {
          color: #7FA8C0;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge {
          padding: 0.2rem 0.55rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-success { background: rgba(34,197,94,0.15); color: #22C55E; }
        .badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; }
        .badge-danger { background: rgba(239,68,68,0.15); color: #EF4444; }
        .footer {
          margin-top: 2rem;
          padding-top: 1.25rem;
          border-top: 1px solid #1D3557;
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #7FA8C0;
        }
        .print-btn {
          position: fixed;
          top: 1rem;
          right: 1.5rem;
          background: #22D3EE;
          color: #080D13;
          border: none;
          padding: 0.65rem 1.4rem;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 4px 16px rgba(34,211,238,0.4);
          transition: transform 0.2s ease;
        }
        .print-btn:hover { transform: scale(1.05); }
        @media print {
          body { background: #fff !important; color: #000 !important; padding: 1rem; }
          .metric-card, .chart-box, .table-section { background: #fff !important; border-color: #ddd !important; }
          .brand, .title-section h1, .chart-box h3, .table-section h3, .metric-card .val { color: #000 !important; }
          th, td { border-bottom-color: #eee !important; color: #333 !important; }
          .print-btn { display: none !important; }
          svg circle, svg path, svg text { font-family: sans-serif; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Download PDF / Print</button>
      
      <div class="header">
        <div class="brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Drift<span>Pulse</span>
        </div>
        <div class="meta-box">
          <div>Report Reference: <strong>${reportId}</strong></div>
          <div>Execution Date: ${reportDate}</div>
        </div>
      </div>

      <div class="title-section">
        <div>
          <h1>Executive SOC Security & Behavioral Analysis Report</h1>
          <p>Source Telemetry File: <strong>${fileName || 'IoT Telemetry Upload'}</strong></p>
        </div>
        <div style="font-size: 0.8rem; color: #22D3EE; font-weight: 600; background: rgba(34,211,238,0.1); padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid rgba(34,211,238,0.2);">
          Verified ML Intelligence Report
        </div>
      </div>

      <!-- Metrics Row -->
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

      <!-- Visual Analytics Graphs -->
      <div class="charts-row">
        <!-- Trend SVG Chart -->
        <div class="chart-box">
          <h3>Trust Score vs Drift Rate Trend</h3>
          <p>Behavioral trajectory analysis across monitored checkpoints</p>
          <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="display: block; width: 100%; height: auto;">
            <defs>
              <linearGradient id="pdfGradTrust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.0"/>
              </linearGradient>
              <linearGradient id="pdfGradDrift" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#EF4444" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#EF4444" stop-opacity="0.0"/>
              </linearGradient>
            </defs>

            <!-- Y Gridlines -->
            <line x1="${paddingLeft}" y1="${paddingTop}" x2="${svgWidth - paddingRight}" y2="${paddingTop}" stroke="rgba(29,53,87,0.6)" stroke-dasharray="3 3"/>
            <line x1="${paddingLeft}" y1="${paddingTop + chartH*0.5}" x2="${svgWidth - paddingRight}" y2="${paddingTop + chartH*0.5}" stroke="rgba(29,53,87,0.6)" stroke-dasharray="3 3"/>
            <line x1="${paddingLeft}" y1="${paddingTop + chartH}" x2="${svgWidth - paddingRight}" y2="${paddingTop + chartH}" stroke="rgba(29,53,87,0.6)"/>

            <text x="${paddingLeft - 8}" y="${paddingTop + 4}" fill="#7FA8C0" font-size="9" text-anchor="end">100</text>
            <text x="${paddingLeft - 8}" y="${paddingTop + chartH*0.5 + 4}" fill="#7FA8C0" font-size="9" text-anchor="end">50</text>
            <text x="${paddingLeft - 8}" y="${paddingTop + chartH + 4}" fill="#7FA8C0" font-size="9" text-anchor="end">0</text>

            ${xGridHtml}

            <!-- Trust Area & Line -->
            ${trustAreaPath ? `<path d="${trustAreaPath}" fill="url(#pdfGradTrust)"/>` : ''}
            ${trustPointsCoords.length > 0 ? `<polyline points="${trustPointsCoords.join(" ")}" fill="none" stroke="#22D3EE" stroke-width="2.5"/>` : ''}

            <!-- Drift Area & Line -->
            ${driftAreaPath ? `<path d="${driftAreaPath}" fill="url(#pdfGradDrift)"/>` : ''}
            ${driftPointsCoords.length > 0 ? `<polyline points="${driftPointsCoords.join(" ")}" fill="none" stroke="#EF4444" stroke-width="2.5"/>` : ''}
          </svg>

          <div class="legend-list">
            <div class="legend-item"><span class="dot" style="background: #22D3EE;"></span> Trust Score (0-100)</div>
            <div class="legend-item"><span class="dot" style="background: #EF4444;"></span> Drift Rate (%)</div>
          </div>
        </div>

        <!-- Donut SVG Chart -->
        <div class="chart-box" style="text-align: center;">
          <h3>Anomaly Distribution</h3>
          <p>Risk classification breakdown</p>
          ${donutSvg}
          <div class="legend-list" style="margin-top: 0.5rem;">
            <div class="legend-item"><span class="dot" style="background: #22C55E;"></span> Low (${lowCount})</div>
            <div class="legend-item"><span class="dot" style="background: #F59E0B;"></span> Med (${medCount})</div>
            <div class="legend-item"><span class="dot" style="background: #EF4444;"></span> High (${highCount})</div>
          </div>
        </div>
      </div>

      <!-- Asset Audit Table -->
      <div class="table-section">
        <h3>Monitored IoT Assets Audit Table</h3>
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
        <div>DriftPulse AI/ML Threat Intelligence System &bull; Confidential Executive Report</div>
        <div>Generated by DriftPulse Engine &bull; Page 1 of 1</div>
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

function generateDonutSlices(low, med, high, total) {
  if (total === 0) return `<circle cx="110" cy="100" r="70" fill="none" stroke="#22C55E" stroke-width="24"/>`
  const r = 70
  const cx = 110
  const cy = 100
  const circ = 2 * Math.PI * r

  const lowDash = (low / total) * circ
  const medDash = (med / total) * circ
  const highDash = (high / total) * circ

  let offset = 0
  let slices = ""

  if (low > 0) {
    slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#22C55E" stroke-width="24" stroke-dasharray="${lowDash} ${circ - lowDash}" stroke-dashoffset="-${offset}" transform="rotate(-90 ${cx} ${cy})"/>`
    offset += lowDash
  }

  if (med > 0) {
    slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F59E0B" stroke-width="24" stroke-dasharray="${medDash} ${circ - medDash}" stroke-dashoffset="-${offset}" transform="rotate(-90 ${cx} ${cy})"/>`
    offset += medDash
  }

  if (high > 0) {
    slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EF4444" stroke-width="24" stroke-dasharray="${highDash} ${circ - highDash}" stroke-dashoffset="-${offset}" transform="rotate(-90 ${cx} ${cy})"/>`
  }

  return slices
}

function formatBytes(n) {
  if (!n) return "0 B"
  if (n >= 1e9) return (n/1e9).toFixed(2) + " GB"
  if (n >= 1e6) return (n/1e6).toFixed(2) + " MB"
  if (n >= 1e3) return (n/1e3).toFixed(2) + " KB"
  return Math.round(n) + " B"
}
