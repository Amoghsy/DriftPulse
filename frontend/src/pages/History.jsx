import { useState, useEffect, useMemo } from "react"
import { Clock, Trash2, FileText, ChevronDown, ChevronUp, Database, RefreshCw, Server, AlertTriangle, Shield, Bell, Search, Eye, ShieldAlert, Download } from "lucide-react"
import MetricCard from "../components/MetricCard"
import TrendChart from "../components/TrendChart"
import DonutChart from "../components/DonutChart"
import { useNavigate } from "react-router-dom"
import { generatePdfReport } from "../utils/generatePdfReport"

const HISTORY_KEY = "dp_analysis_history"

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return "just now"
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  return `${days}d ago`
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) +
    "  " + d.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })
}

const formatBytes = (n) => {
  if (n >= 1e9) return `${(n/1e9).toFixed(2)} GB`
  if (n >= 1e6) return `${(n/1e6).toFixed(2)} MB`
  if (n >= 1e3) return `${(n/1e3).toFixed(2)} KB`
  return `${Math.round(n)} B`
}
const getRiskColor = (r) => ({ Low:"var(--success)",Medium:"var(--warning)",High:"var(--danger)" }[r] ?? "var(--text-muted)")
const getPolicyStyle = (p) => ({
  Compliant:     { color:"var(--success)", bg:"rgba(34,197,94,0.1)" },
  Warning:       { color:"var(--warning)", bg:"rgba(245,158,11,0.1)" },
  "Non-Compliant":{ color:"var(--danger)",  bg:"rgba(239,68,68,0.1)" },
}[p] ?? { color:"var(--text-muted)", bg:"transparent" })

export default function History() {
  const [entries, setEntries] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      setEntries(parsed)
      if (parsed.length > 0) setExpanded(parsed[0].id)
    } catch {
      setEntries([])
    }
  }, [])

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setEntries([])
    setExpanded(null)
  }

  const deleteRun = (id, e) => {
    if (e) e.stopPropagation()
    const updated = entries.filter(item => item.id !== id)
    setEntries(updated)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    if (expanded === id) setExpanded(null)
  }

  return (
    <div className="main-content fade-in">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analysis History</h1>
          <p className="page-subtitle">Timeline, graph snapshots & PDF reports of past IoT telemetry analysis runs</p>
        </div>
        {entries.length > 0 && (
          <button
            className="btn-outline"
            style={{ display:"flex",alignItems:"center",gap:"0.5rem",color:"var(--danger)",borderColor:"rgba(239,68,68,0.4)" }}
            onClick={clearHistory}
          >
            <Trash2 size={15} /> Clear All History
          </button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div style={{
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          minHeight:400,gap:"1.25rem",
        }}>
          <div style={{
            width:80,height:80,borderRadius:24,
            background:"linear-gradient(135deg,rgba(34,211,238,0.1),rgba(99,102,241,0.1))",
            display:"flex",alignItems:"center",justifyContent:"center",
            border:"1px solid rgba(34,211,238,0.15)",
          }}>
            <Clock size={36} style={{ color:"var(--accent)" }} />
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontWeight:700,fontSize:"1.1rem",marginBottom:"0.4rem" }}>No analysis history yet</p>
            <p style={{ color:"var(--text-muted)",fontSize:"0.9rem" }}>
              Upload a dataset from the Dashboard to see runs and graph snapshots appear here.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {entries.length > 0 && (
        <div style={{ position:"relative",display:"flex",flexDirection:"column",gap:"0" }}>

          {/* Vertical timeline line */}
          <div style={{
            position:"absolute",left:23,top:0,bottom:0,width:2,
            background:"linear-gradient(to bottom,var(--accent),rgba(99,102,241,0.3),transparent)",
            borderRadius:2,zIndex:0,
          }} />

          {entries.map((entry, i) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              index={i}
              isLast={i === entries.length - 1}
              expanded={expanded === entry.id}
              onToggle={() => setExpanded(prev => prev === entry.id ? null : entry.id)}
              onDelete={(e) => deleteRun(entry.id, e)}
            />
          ))}
        </div>
      )}

      {/* Stats summary */}
      {entries.length > 0 && (
        <div className="glass-panel" style={{ marginTop:"2rem",padding:"1.25rem 1.5rem" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"1.5rem",flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",color:"var(--accent)" }}>
              <Database size={18} />
              <span style={{ fontWeight:700,fontSize:"0.9rem" }}>
                {entries.length} stored run{entries.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ color:"var(--text-muted)",fontSize:"0.85rem" }}>
              Latest: <span style={{ color:"var(--text-primary)",fontWeight:600 }}>{formatDate(entries[0].timestamp)}</span>
            </div>
            <div style={{ color:"var(--text-muted)",fontSize:"0.85rem" }}>
              Oldest: <span style={{ color:"var(--text-primary)",fontWeight:600 }}>{formatDate(entries[entries.length-1].timestamp)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryEntry({ entry, index, isLast, expanded, onToggle, onDelete }) {
  const navigate = useNavigate()
  const runNumber = index + 1
  const [searchTerm, setSearchTerm] = useState("")

  const metrics = entry.metrics || {
    totalDevices: entry.devices?.length || 0,
    highRiskDevices: entry.devices?.filter(d => d.risk === "High").length || 0,
    avgTrustScore: entry.devices?.length ? entry.devices.reduce((a, b) => a + (b.trustScore || 0), 0) / entry.devices.length : 0,
    activeAlerts: 0,
  }

  const devicesList = entry.devices || []
  const filteredDevices = useMemo(() => {
    return devicesList.filter(d =>
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip.includes(searchTerm)
    )
  }, [devicesList, searchTerm])

  return (
    <div style={{
      display:"flex",gap:"1.25rem",paddingBottom: isLast ? 0 : "1.5rem",
      position:"relative",zIndex:1,
    }}>
      {/* Timeline dot */}
      <div style={{
        width:48,height:48,borderRadius:14,flexShrink:0,
        background: index === 0
          ? "linear-gradient(135deg,var(--accent),#818cf8)"
          : "rgba(34,211,238,0.08)",
        border: index === 0
          ? "none"
          : "1px solid rgba(34,211,238,0.2)",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow: index === 0 ? "0 0 20px rgba(34,211,238,0.3)" : "none",
        marginTop:"0.25rem",
      }}>
        {index === 0
          ? <RefreshCw size={20} color="#fff" />
          : <FileText size={20} style={{ color:"var(--accent)",opacity:0.7 }} />
        }
      </div>

      {/* Card */}
      <div style={{ flex:1 }}>
        <div
          className="glass-panel"
          style={{
            padding:"1.25rem 1.5rem",cursor:"pointer",
            border: index === 0 ? "1px solid rgba(34,211,238,0.3)" : "1px solid var(--border)",
            transition:"border-color 0.2s,box-shadow 0.2s",
            boxShadow: index === 0 ? "0 4px 24px rgba(34,211,238,0.1)" : "none",
          }}
          onClick={onToggle}
        >
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
              {index === 0 && (
                <span style={{
                  fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",
                  color:"#0a0e1a",background:"linear-gradient(135deg,var(--accent),#818cf8)",
                  padding:"0.2rem 0.6rem",borderRadius:9999,
                }}>Latest Run</span>
              )}
              <span style={{ fontWeight:700,fontSize:"1rem" }}>Run #{runNumber}</span>
              <span style={{ color:"var(--text-muted)",fontSize:"0.82rem" }}>·</span>
              <span style={{ color:"var(--text-secondary)",fontSize:"0.85rem",display:"flex",alignItems:"center",gap:"0.3rem" }}>
                <Clock size={13} /> {timeAgo(entry.timestamp)}
              </span>
            </div>

            <div style={{ display:"flex",alignItems:"center",gap:"0.6rem" }}>
              <span style={{ color:"var(--text-muted)",fontSize:"0.8rem",fontFamily:"monospace",marginRight:"0.4rem" }}>
                {formatDate(entry.timestamp)}
              </span>

              {/* Action Buttons */}
              <button
                className="btn-outline"
                style={{ display:"inline-flex",alignItems:"center",gap:"0.35rem",padding:"0.25rem 0.65rem",fontSize:"0.75rem" }}
                onClick={(e) => { e.stopPropagation(); generatePdfReport(entry); }}
                title="Download PDF Security Report"
              >
                <Download size={13} /> PDF
              </button>

              <button
                className="btn-outline"
                style={{ display:"inline-flex",alignItems:"center",gap:"0.35rem",padding:"0.25rem 0.65rem",fontSize:"0.75rem",color:"var(--danger)",borderColor:"rgba(239,68,68,0.4)" }}
                onClick={onDelete}
                title="Delete this run from history"
              >
                <Trash2 size={13} /> Delete
              </button>

              {expanded ? <ChevronUp size={18} style={{ color:"var(--accent)" }} /> : <ChevronDown size={18} style={{ color:"var(--text-muted)" }} />}
            </div>
          </div>

          {/* File name & summary chips */}
          <div style={{ display:"flex",alignItems:"center",gap:"1.2rem",marginTop:"0.75rem",flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"0.4rem",color:"var(--accent)",fontFamily:"monospace",fontSize:"0.85rem",fontWeight:600 }}>
              <FileText size={14} /> {entry.fileName || "telemetry_upload.csv"}
            </div>
            <div style={{ display:"flex",gap:"0.6rem" }}>
              <span style={{ fontSize:"0.75rem",background:"rgba(34,211,238,0.1)",color:"var(--accent)",padding:"0.15rem 0.5rem",borderRadius:6,fontWeight:600 }}>
                {metrics.totalDevices} Devices
              </span>
              <span style={{ fontSize:"0.75rem",background:"rgba(239,68,68,0.1)",color:"var(--danger)",padding:"0.15rem 0.5rem",borderRadius:6,fontWeight:600 }}>
                {metrics.highRiskDevices} High Risk
              </span>
              <span style={{ fontSize:"0.75rem",background:"rgba(34,197,94,0.1)",color:"var(--success)",padding:"0.15rem 0.5rem",borderRadius:6,fontWeight:600 }}>
                Avg Trust: {metrics.avgTrustScore?.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Expanded full graphs & device analytics */}
          {expanded && (
            <div style={{
              marginTop:"1.25rem",paddingTop:"1.25rem",
              borderTop:"1px solid rgba(255,255,255,0.08)",
              display:"flex",flexDirection:"column",gap:"1.5rem",
              animation:"fadeIn 0.25s ease",
            }} onClick={e => e.stopPropagation()}>

              {/* Metrics Grid */}
              <div className="metrics-grid">
                <MetricCard title="Total Devices"     value={metrics.totalDevices.toLocaleString()}   trend="up"   icon={Server}        iconColor="#2FB6C4" />
                <MetricCard title="High Risk Devices" value={metrics.highRiskDevices.toLocaleString()} trend="down" icon={AlertTriangle}  iconColor="#EF4444" color="var(--danger)" />
                <MetricCard title="Avg Trust Score"   value={metrics.avgTrustScore.toFixed(1)}         trend="up"   icon={Shield}         iconColor="#22C55E" color="var(--success)" />
                <MetricCard title="Active Alerts"     value={metrics.activeAlerts.toLocaleString()}   trend="down" icon={Bell}            iconColor="#F59E0B" color="var(--warning)" />
              </div>

              {/* Analytics Charts Row */}
              <div className="charts-grid">
                <TrendChart data={entry.trendData || []} loading={false} />
                <DonutChart data={entry.donutData || []} loading={false} />
              </div>

              {/* Device Table for this Historical Run */}
              {devicesList.length > 0 && (
                <div className="glass-panel" style={{ padding:0,overflow:"hidden",borderRadius:16,border:"1px solid var(--border)" }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:"0.75rem" }}>
                    <div>
                      <h4 style={{ fontWeight:700,fontSize:"0.95rem",marginBottom:"0.1rem" }}>Historical Device Snapshot</h4>
                      <span style={{ fontSize:"0.78rem",color:"var(--text-muted)" }}>
                        {devicesList.length} device{devicesList.length !== 1 ? "s" : ""} captured in this run
                      </span>
                    </div>
                    <div className="search-bar" style={{ width:240 }}>
                      <Search className="search-icon" size={14} />
                      <input type="text" placeholder="Search devices..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table className="device-table" style={{ width:"100%",minWidth:900 }}>
                      <thead>
                        <tr>
                          <th>Device ID</th>
                          <th>IP Address</th>
                          <th>Logs</th>
                          <th>Total Bytes</th>
                          <th>Trust Score</th>
                          <th>Drift</th>
                          <th>Anomaly</th>
                          <th>Policy</th>
                          <th>Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDevices.map((dev, i) => {
                          const ps = getPolicyStyle(dev.policy)
                          const barColor = dev.risk==="High"?"var(--danger)":dev.risk==="Medium"?"var(--warning)":"var(--success)"
                          return (
                            <tr key={dev.id} style={{ cursor:"pointer" }} onClick={() => navigate(`/devices/${dev.id}`)}>
                              <td className="font-mono" style={{ color:"var(--accent)",fontWeight:600,whiteSpace:"nowrap" }}>{dev.id}</td>
                              <td className="font-mono text-sm" style={{ color:"var(--text-secondary)" }}>{dev.ip}</td>
                              <td className="font-mono text-sm">{dev.logCount?.toLocaleString()}</td>
                              <td className="font-mono text-sm">{formatBytes(dev.totalBytes)}</td>
                              <td>
                                <div className="load-indicator" style={{ width:110 }}>
                                  <div className="progress-bg">
                                    <div className="progress-fill" style={{ width:`${dev.trustScore}%`,background:barColor }} />
                                  </div>
                                  <span className="font-mono text-sm">{dev.trustScore?.toFixed(1)}</span>
                                </div>
                              </td>
                              <td className="font-mono text-sm">{dev.driftScore?.toFixed(3)}</td>
                              <td className="font-mono text-sm">{dev.anomalyScore?.toFixed(3)}</td>
                              <td>
                                <span style={{ display:"inline-flex",alignItems:"center",gap:"0.3rem",padding:"0.2rem 0.55rem",borderRadius:9999,fontSize:"0.68rem",fontWeight:600,textTransform:"uppercase",color:ps.color,background:ps.bg,whiteSpace:"nowrap" }}>
                                  <span style={{ width:5,height:5,borderRadius:"50%",background:ps.color,display:"inline-block" }} />
                                  {dev.policy}
                                </span>
                              </td>
                              <td style={{ fontWeight:600,color:getRiskColor(dev.risk) }}>{dev.risk}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
