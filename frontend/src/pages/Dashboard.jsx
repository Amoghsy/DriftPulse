import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import MetricCard from "../components/MetricCard"
import TrendChart from "../components/TrendChart"
import DonutChart from "../components/DonutChart"
import {
  Server, AlertTriangle, Shield, Bell, RefreshCw,
  CheckCircle2, XCircle, Upload, FileText, Cpu, Activity,
  Zap, Search, Eye, ShieldAlert, Database
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  getAlerts, getAnomalyDistribution, getDashboardSummary,
  getDevices, triggerAnalysis,
} from "../services/api"

/* ── helpers ── */
const toArray  = (v) => (Array.isArray(v) ? v : [])
const getNumber = (...vals) => { for (const v of vals) { const n = Number(v); if (Number.isFinite(n)) return n } return null }
const normalizeTrendPoint = (p, i) => ({
  time:  p?.time ?? p?.timestamp ?? p?.label ?? p?.x ?? `T${i + 1}`,
  trust: getNumber(p?.trust, p?.trustScore, p?.avgTrustScore) ?? 0,
  drift: getNumber(p?.drift, p?.driftScore, p?.avgDriftScore) ?? 0,
})
const normalizeDonutData = (raw) => {
  const colorMap = { low: "#22C55E", medium: "#F59E0B", high: "#EF4444" }
  return toArray(raw).map((e) => {
    const rawKey = String(e?.key ?? e?.risk ?? e?.name ?? "unknown").toLowerCase()
    let key = "unknown"
    if (rawKey.includes("low")) key = "low"
    else if (rawKey.includes("medium") || rawKey.includes("med")) key = "medium"
    else if (rawKey.includes("high")) key = "high"
    return {
      name:  e?.name ?? (key === "low" ? "Low Risk" : key === "medium" ? "Medium Risk" : "High Risk"),
      value: getNumber(e?.value, e?.count) ?? 0,
      color: e?.color ?? colorMap[key] ?? "#94A3B8",
    }
  })
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

/* ── Status pill ── */
const AnalyzeStatus = ({ status, message }) => {
  if (!status) return null
  const cfg = {
    running: { color:"var(--accent)",  icon:<RefreshCw size={14} className="spin-icon" />, text:"Running ML pipeline…" },
    success: { color:"var(--success)", icon:<CheckCircle2 size={14} />, text: message || "Analysis complete." },
    error:   { color:"var(--danger)",  icon:<XCircle size={14} />,     text: message || "Analysis failed." },
  }[status] ?? null
  if (!cfg) return null
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.82rem",fontWeight:500,
      color:cfg.color,padding:"0.45rem 0.85rem",background:`${cfg.color}14`,
      borderRadius:8,border:`1px solid ${cfg.color}30`,animation:"fadeIn 0.25s ease",
    }}>
      {cfg.icon} {cfg.text}
    </div>
  )
}

/* ── Snapshot Saver for History ── */
export async function saveAnalysisSnapshot(fileName) {
  try {
    const [summaryRes, devicesRes, alertsRes, distributionRes] = await Promise.allSettled([
      getDashboardSummary(), getDevices(), getAlerts(), getAnomalyDistribution(),
    ])
    const summary = summaryRes.status === "fulfilled" ? summaryRes.value : null
    const devices = devicesRes.status === "fulfilled"
      ? toArray(devicesRes.value?.devices ?? devicesRes.value?.data ?? devicesRes.value) : []
    const alerts = alertsRes.status === "fulfilled"
      ? toArray(alertsRes.value?.alerts ?? alertsRes.value?.data ?? alertsRes.value) : []
    const distribution = distributionRes.status === "fulfilled"
      ? toArray(distributionRes.value?.distribution ?? distributionRes.value?.data ?? distributionRes.value) : []

    const metrics = {
      totalDevices: getNumber(summary?.totalDevices, summary?.metrics?.totalDevices, devices.length) ?? 0,
      highRiskDevices: getNumber(summary?.highRiskDevices, summary?.metrics?.highRiskDevices, devices.filter(d => String(d?.risk ?? "").toLowerCase() === "high").length) ?? 0,
      avgTrustScore: getNumber(summary?.avgTrustScore, summary?.metrics?.avgTrustScore) ?? (devices.length ? devices.reduce((a,d) => a+(getNumber(d?.trustScore)??0),0)/devices.length : 0),
      activeAlerts: getNumber(summary?.activeAlerts, summary?.metrics?.activeAlerts, alerts.filter(a => !["resolved","closed"].includes(String(a?.status??"").toLowerCase())).length) ?? 0,
    }

    const trendData = (toArray(summary?.trustTrend ?? summary?.trendData).length > 0)
      ? toArray(summary?.trustTrend ?? summary?.trendData).map(normalizeTrendPoint)
      : devices.slice(0,7).map((d,i) => ({ time: d?.lastSeen ?? `T${i+1}`, trust: getNumber(d?.trustScore)??0, drift: getNumber(d?.driftScore)??0 }))

    const donutData = distribution.length > 0 ? normalizeDonutData(distribution) : [
      { name: "Low Risk", value: devices.filter(d => String(d?.risk??"").toLowerCase()==="low").length, color: "#22C55E" },
      { name: "Medium Risk", value: devices.filter(d => String(d?.risk??"").toLowerCase()==="medium").length, color: "#F59E0B" },
      { name: "High Risk", value: devices.filter(d => String(d?.risk??"").toLowerCase()==="high").length, color: "#EF4444" },
    ]

    const normalizedDevicesList = devices.map(dev => ({
      id: String(dev?.id ?? dev?.deviceId ?? "UNKNOWN"),
      ip: String(dev?.ip ?? dev?.ipAddress ?? "-"),
      logCount: getNumber(dev?.logCount ?? dev?.log_count) ?? 0,
      totalBytes: getNumber(dev?.totalBytes ?? dev?.total_bytes) ?? 0,
      trustScore: getNumber(dev?.trustScore ?? dev?.trust) ?? 0,
      driftScore: getNumber(dev?.driftScore ?? dev?.drift) ?? 0,
      anomalyScore: getNumber(dev?.anomalyScore ?? dev?.anomaly) ?? 0,
      policy: String(dev?.policy ?? dev?.policyStatus ?? "Unknown"),
      risk: String(dev?.risk ?? dev?.riskLevel ?? "Unknown"),
      lastSeen: String(dev?.lastSeen ?? "-"),
    }))

    const snapshot = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      fileName: fileName || "telemetry_upload.csv",
      metrics,
      trendData,
      donutData,
      devices: normalizedDevicesList,
    }

    const prev = JSON.parse(localStorage.getItem("dp_analysis_history") || "[]")
    prev.unshift(snapshot)
    localStorage.setItem("dp_analysis_history", JSON.stringify(prev.slice(0, 50)))
  } catch (err) {
    console.error("Failed to save snapshot to history:", err)
  }
}

/* ════════════════════════════════════════════════════════════
   UPLOAD PHASE — full-screen premium upload UI
═══════════════════════════════════════════════════════════ */
function UploadPhase({ onUploadSuccess }) {
  const [dragging, setDragging]     = useState(false)
  const [fileName, setFileName]     = useState(null)
  const [analyzing, setAnalyzing]   = useState(false)
  const [status, setStatus]         = useState(null)
  const [statusMsg, setStatusMsg]   = useState("")
  const fileRef = useRef(null)

  const processFile = useCallback(async (file) => {
    if (!file) return
    setFileName(file.name)
    setAnalyzing(true)
    setStatus("running")
    setStatusMsg("")
    try {
      await triggerAnalysis(file)
      await saveAnalysisSnapshot(file.name)
      setStatus("success")
      setStatusMsg("Analysis complete! Loading your dashboard…")
      setTimeout(() => onUploadSuccess(), 1200)
    } catch (err) {
      setStatus("error")
      setStatusMsg(err?.message || "Analysis failed. Check the file and try again.")
      setAnalyzing(false)
    }
  }, [onUploadSuccess])


  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.name?.endsWith(".csv")) processFile(file)
    else setStatusMsg("Please drop a valid .csv file.")
  }, [processFile])

  const FEATURES = [
    { icon: Cpu,      label: "AI Anomaly Detection",   sub: "Isolation Forest with StandardScaler" },
    { icon: Activity, label: "Behavioral Drift",        sub: "Baseline deviation analysis" },
    { icon: Shield,   label: "Trust Score Computation", sub: "Multi-factor risk evaluation" },
    { icon: Zap,      label: "Real-time Insights",      sub: "Instant policy classification" },
  ]

  return (
    <div style={{
      minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"2rem",background:"radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)",
      position:"relative",overflow:"hidden",
    }}>
      {/* Floating orbs */}
      <div style={{ position:"absolute",top:"8%",left:"5%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",animation:"float 8s ease-in-out infinite",pointerEvents:"none" }} />
      <div style={{ position:"absolute",bottom:"10%",right:"8%",width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",animation:"float 10s ease-in-out infinite reverse",pointerEvents:"none" }} />
      <div style={{ position:"absolute",top:"50%",right:"15%",width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)",animation:"float 12s ease-in-out infinite",pointerEvents:"none" }} />

      {/* Header */}
      <div style={{ textAlign:"center",marginBottom:"2rem",zIndex:1 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"0.75rem",marginBottom:"0.75rem" }}>
          <div style={{
            width:52,height:52,borderRadius:16,background:"linear-gradient(135deg,var(--accent),#818cf8)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 0 32px rgba(34,211,238,0.35)",
          }}>
            <Database size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize:"2.2rem",fontWeight:800,letterSpacing:"-0.03em",background:"linear-gradient(135deg,#fff 30%,var(--accent))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
            DriftPulse SOC — Upload Dataset
          </h1>
        </div>
        <p style={{ fontSize:"1.05rem",color:"var(--text-muted)",maxWidth:520,lineHeight:1.6,margin:"0 auto" }}>
          Upload your IoT telemetry dataset to run AI-powered anomaly detection,
          behavioral drift analysis, and trust score computation.
        </p>
      </div>


      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !analyzing && fileRef.current?.click()}
        style={{
          width:"100%",maxWidth:600,borderRadius:24,cursor:analyzing?"not-allowed":"pointer",
          border:`2px dashed ${dragging ? "var(--accent)" : "rgba(34,211,238,0.25)"}`,
          background: dragging
            ? "rgba(34,211,238,0.06)"
            : "rgba(255,255,255,0.03)",
          padding:"3.5rem 2.5rem",display:"flex",flexDirection:"column",
          alignItems:"center",textAlign:"center",transition:"all 0.25s ease",
          boxShadow: dragging ? "0 0 60px rgba(34,211,238,0.15)" : "0 8px 40px rgba(0,0,0,0.25)",
          backdropFilter:"blur(12px)",zIndex:1,
          transform: dragging ? "scale(1.01)" : "scale(1)",
        }}
      >
        {analyzing ? (
          /* ── analyzing state ── */
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem" }}>
            <div style={{
              width:80,height:80,borderRadius:"50%",border:"3px solid rgba(34,211,238,0.2)",
              borderTop:"3px solid var(--accent)",animation:"spin 0.9s linear infinite",
              boxShadow:"0 0 30px rgba(34,211,238,0.2)",
            }} />
            <div>
              <p style={{ fontWeight:700,fontSize:"1.1rem",marginBottom:"0.3rem",color:"var(--accent)" }}>
                Analyzing {fileName}
              </p>
              <p style={{ color:"var(--text-muted)",fontSize:"0.88rem" }}>Running AI/ML pipeline — this may take a moment…</p>
            </div>
            {/* Animated progress dots */}
            <div style={{ display:"flex",gap:"0.5rem" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:8,height:8,borderRadius:"50%",background:"var(--accent)",
                  animation:`pulse-dot 1.2s ease-in-out ${i*0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        ) : status === "success" ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"0.75rem" }}>
            <CheckCircle2 size={52} style={{ color:"var(--success)" }} />
            <p style={{ fontWeight:700,color:"var(--success)",fontSize:"1.1rem" }}>{statusMsg}</p>
          </div>
        ) : (
          <>
            <div style={{
              width:72,height:72,borderRadius:20,
              background:"linear-gradient(135deg,rgba(34,211,238,0.15),rgba(99,102,241,0.15))",
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.25rem",
              border:"1px solid rgba(34,211,238,0.2)",
              boxShadow:"0 0 30px rgba(34,211,238,0.1)",
              transition:"transform 0.2s ease",
            }}>
              <Upload size={32} style={{ color:"var(--accent)" }} />
            </div>
            {fileName ? (
              <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",color:"var(--accent)",fontWeight:600,marginBottom:"0.5rem" }}>
                <FileText size={18}/> {fileName}
              </div>
            ) : (
              <p style={{ fontWeight:700,fontSize:"1.1rem",marginBottom:"0.4rem" }}>
                {dragging ? "Drop your dataset here" : "Drop CSV file or click to browse"}
              </p>
            )}
            <p style={{ color:"var(--text-muted)",fontSize:"0.85rem",marginBottom:"1.5rem" }}>
              Accepts .csv files — IoT Telemetry format required
            </p>
            {status === "error" && (
              <div style={{ color:"var(--danger)",fontSize:"0.85rem",marginBottom:"1rem",padding:"0.5rem 1rem",background:"rgba(239,68,68,0.1)",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)" }}>
                {statusMsg}
              </div>
            )}
            <div style={{
              background:"linear-gradient(135deg,var(--accent),#818cf8)",
              color:"#0a0e1a",fontWeight:700,fontSize:"0.92rem",padding:"0.75rem 2.5rem",
              borderRadius:12,boxShadow:"0 4px 24px rgba(34,211,238,0.3)",
              display:"inline-flex",alignItems:"center",gap:"0.5rem",letterSpacing:"0.02em",
              transition:"transform 0.15s ease, box-shadow 0.15s ease",
            }}>
              <Upload size={16}/> Select Dataset
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }}
          onChange={(e) => { const f=e.target.files?.[0]; if(f) processFile(f); e.target.value="" }} />
      </div>

      {/* Feature cards row */}
      <div style={{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",
        gap:"1rem",maxWidth:840,width:"100%",marginTop:"2.5rem",zIndex:1,
      }}>
        {FEATURES.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="feature-card"
            style={{
              background:"rgba(16,28,46,0.75)",borderRadius:16,padding:"1.25rem 1rem",
              border:"1px solid rgba(34,211,238,0.18)",textAlign:"center",backdropFilter:"blur(12px)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",
              boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
              transition:"all 0.25s ease",
            }}
          >
            <div style={{
              width:42,height:42,borderRadius:12,
              background:"rgba(34,211,238,0.1)",
              border:"1px solid rgba(34,211,238,0.25)",
              display:"flex",alignItems:"center",justifyContent:"center",
              marginBottom:"0.85rem",
              boxShadow:"0 0 16px rgba(34,211,238,0.15)",
            }}>
              <Icon size={20} style={{ color:"var(--accent)" }} />
            </div>

            <h4 style={{
              fontWeight:700,fontSize:"0.88rem",color:"#fff",
              marginBottom:"0.35rem",lineHeight:1.3,
              minHeight:"2.4rem",display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              {label}
            </h4>

            <p style={{
              fontSize:"0.76rem",color:"var(--text-secondary)",
              lineHeight:1.45,opacity:0.9,
            }}>
              {sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}


/* ════════════════════════════════════════════════════════════
   ANALYTICS PHASE — full SOC dashboard with devices embedded
═══════════════════════════════════════════════════════════ */
function AnalyticsPhase({ onReUpload }) {
  const navigate = useNavigate()
  const [summary,      setSummary]      = useState(null)
  const [devices,      setDevices]      = useState([])
  const [alerts,       setAlerts]       = useState([])
  const [distribution, setDistribution] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")
  const [analyzing,    setAnalyzing]    = useState(false)
  const [analyzeStatus,setAnalyzeStatus]= useState(null)
  const [analyzeMsg,   setAnalyzeMsg]   = useState("")
  const [searchTerm,   setSearchTerm]   = useState("")

  const loadData = useCallback(async () => {
    setLoading(true); setError("")
    const [summaryRes, devicesRes, alertsRes, distributionRes] = await Promise.allSettled([
      getDashboardSummary(), getDevices(), getAlerts(), getAnomalyDistribution(),
    ])
    setSummary(summaryRes.status === "fulfilled" ? summaryRes.value : null)
    setDevices(devicesRes.status === "fulfilled"
      ? toArray(devicesRes.value?.devices ?? devicesRes.value?.data ?? devicesRes.value) : [])
    setAlerts(alertsRes.status === "fulfilled"
      ? toArray(alertsRes.value?.alerts ?? alertsRes.value?.data ?? alertsRes.value) : [])
    setDistribution(distributionRes.status === "fulfilled"
      ? toArray(distributionRes.value?.distribution ?? distributionRes.value?.data ?? distributionRes.value) : [])
    if ([summaryRes,devicesRes,alertsRes,distributionRes].every(r => r.status==="rejected"))
      setError("Failed to load dashboard data from backend API.")
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setAnalyzing(true); setAnalyzeStatus("running"); setAnalyzeMsg("")
    try {
      const result = await triggerAnalysis(file)
      const count = getNumber(result?.devicesProcessed, result?.deviceCount)
      setAnalyzeStatus("success")
      setAnalyzeMsg(`Analysis complete — ${count ?? "?"} device(s) updated.`)
      await saveAnalysisSnapshot(file.name)
      await loadData()
    } catch (err) {
      setAnalyzeStatus("error"); setAnalyzeMsg(err?.message || "ML pipeline analysis failed.")
    } finally {
      setAnalyzing(false); e.target.value = ""
      setTimeout(() => setAnalyzeStatus(null), 6000)
    }
  }, [loadData])

  const metrics = useMemo(() => {
    const totalDevices    = getNumber(summary?.totalDevices,    summary?.metrics?.totalDevices,    devices.length) ?? 0
    const highRiskDevices = getNumber(summary?.highRiskDevices, summary?.metrics?.highRiskDevices,
      devices.filter(d => String(d?.risk ?? "").toLowerCase() === "high").length) ?? 0
    const avgTrustScore   = getNumber(summary?.avgTrustScore,  summary?.metrics?.avgTrustScore) ??
      (devices.length ? devices.reduce((a,d) => a+(getNumber(d?.trustScore)??0),0)/devices.length : 0)
    const activeAlerts    = getNumber(summary?.activeAlerts,   summary?.metrics?.activeAlerts,
      alerts.filter(a => !["resolved","closed"].includes(String(a?.status??"").toLowerCase())).length) ?? 0
    return { totalDevices, highRiskDevices, avgTrustScore, activeAlerts }
  }, [alerts, devices, summary])

  const trendData = useMemo(() => {
    const pts = toArray(summary?.trustTrend ?? summary?.trendData ?? summary?.charts?.trustTrend)
    if (pts.length > 0) return pts.map(normalizeTrendPoint)
    return devices.slice(0,7).map((d,i) => ({ time: d?.lastSeen??`T${i+1}`, trust:getNumber(d?.trustScore)??0, drift:getNumber(d?.driftScore)??0 }))
  }, [devices, summary])

  const donutData = useMemo(() => {
    if (distribution.length > 0) return normalizeDonutData(distribution)
    const c = devices.reduce((acc,d) => {
      const r = String(d?.risk??"").toLowerCase()
      if(r==="high") acc.high+=1; else if(r==="medium") acc.medium+=1; else acc.low+=1; return acc
    }, {low:0,medium:0,high:0})
    return [
      {name:"Low Risk",   value:c.low,    color:"#22C55E"},
      {name:"Medium Risk",value:c.medium, color:"#F59E0B"},
      {name:"High Risk",  value:c.high,   color:"#EF4444"},
    ]
  }, [devices, distribution])

  // Normalize devices for embedded table
  const normalizedDevices = useMemo(() => devices.map(dev => ({
    id:          String(dev?.id ?? dev?.deviceId ?? "UNKNOWN"),
    ip:          String(dev?.ip ?? dev?.ipAddress ?? "-"),
    logCount:    getNumber(dev?.logCount ?? dev?.log_count) ?? 0,
    totalBytes:  getNumber(dev?.totalBytes ?? dev?.total_bytes) ?? 0,
    trustScore:  getNumber(dev?.trustScore ?? dev?.trust) ?? 0,
    driftScore:  getNumber(dev?.driftScore ?? dev?.drift) ?? 0,
    anomalyScore:getNumber(dev?.anomalyScore ?? dev?.anomaly) ?? 0,
    policy:      String(dev?.policy ?? dev?.policyStatus ?? "Unknown"),
    risk:        String(dev?.risk ?? dev?.riskLevel ?? "Unknown"),
    lastSeen:    String(dev?.lastSeen ?? "-"),
  })), [devices])

  const filteredDevices = useMemo(() =>
    normalizedDevices.filter(d =>
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip.includes(searchTerm)
    ), [normalizedDevices, searchTerm])

  return (
    <div className="main-content fade-in">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Operations Center</h1>
          <p className="page-subtitle">Real-time infrastructure drift and anomaly monitoring</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap" }}>
          <AnalyzeStatus status={analyzeStatus} message={analyzeMsg} />
          <span style={{ display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.78rem",color:"var(--success)",fontWeight:600 }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:"var(--success)",animation:"pulse-dot 2s infinite" }} />
            Live Monitoring
          </span>
          <label className="analyze-btn" style={{ cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"0.5rem" }} title="Upload new dataset">
            <RefreshCw size={15} className={analyzing ? "spin-icon" : ""} />
            {analyzing ? "Analyzing…" : "Upload New Dataset"}
            <input type="file" accept=".csv" style={{ display:"none" }} onChange={handleFileUpload} disabled={analyzing} />
          </label>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom:"1.5rem" }}>
        <MetricCard title="Total Devices"     value={loading?"…":metrics.totalDevices.toLocaleString()}   trend="up"   icon={Server}       iconColor="#2FB6C4" />
        <MetricCard title="High Risk Devices" value={loading?"…":metrics.highRiskDevices.toLocaleString()} trend="down" icon={AlertTriangle} iconColor="#EF4444" color="var(--danger)" />
        <MetricCard title="Avg Trust Score"   value={loading?"…":metrics.avgTrustScore.toFixed(1)}         trend="up"   icon={Shield}       iconColor="#22C55E" color="var(--success)" />
        <MetricCard title="Active Alerts"     value={loading?"…":metrics.activeAlerts.toLocaleString()}   trend="down" icon={Bell}          iconColor="#F59E0B" color="var(--warning)" />
      </div>

      {error && <div className="glass-panel" style={{ marginBottom:"1.25rem",padding:"0.8rem 1rem",color:"var(--danger)" }}>{error}</div>}

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom:"1.5rem" }}>
        <TrendChart data={trendData} loading={loading} />
        <DonutChart data={donutData} loading={loading} />
      </div>

      {/* ── Embedded Device Table ── */}
      <div className="glass-panel" style={{ padding:0,overflow:"hidden",borderRadius:16 }}>
        {/* Table Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.2rem 1.5rem",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:"0.75rem" }}>
          <div>
            <h3 style={{ fontWeight:700,fontSize:"1rem",marginBottom:"0.15rem" }}>Device Security Overview</h3>
            <span style={{ fontSize:"0.8rem",color:"var(--text-muted)" }}>
              {loading ? "Loading devices…" : `${filteredDevices.length} device${filteredDevices.length!==1?"s":""} monitored`}
            </span>
          </div>
          <div className="search-bar" style={{ width:260 }}>
            <Search className="search-icon" size={15} />
            <input type="text" placeholder="Search by ID or IP…"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="device-table" style={{ width:"100%",minWidth:1080 }}>
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
                <th style={{ textAlign:"right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="10" style={{ textAlign:"center",padding:"3rem",color:"var(--text-muted)" }}>
                  <RefreshCw size={20} className="spin-icon" style={{ marginRight:"0.5rem" }} />Loading devices…
                </td></tr>
              )}
              {!loading && filteredDevices.length === 0 && (
                <tr><td colSpan="10" style={{ textAlign:"center",padding:"3rem",color:"var(--text-muted)" }}>
                  No devices found.
                </td></tr>
              )}
              {filteredDevices.map((dev, i) => {
                const ps = getPolicyStyle(dev.policy)
                const barColor = dev.risk==="High"?"var(--danger)":dev.risk==="Medium"?"var(--warning)":"var(--success)"
                return (
                  <tr key={dev.id} style={{ cursor:"pointer",animationDelay:`${i*0.04}s` }}
                    onClick={() => navigate(`/devices/${dev.id}`)}>
                    <td className="font-mono" style={{ color:"var(--accent)",fontWeight:600,whiteSpace:"nowrap" }}>{dev.id}</td>
                    <td className="font-mono text-sm" style={{ color:"var(--text-secondary)" }}>{dev.ip}</td>
                    <td className="font-mono text-sm">{dev.logCount.toLocaleString()}</td>
                    <td className="font-mono text-sm">{formatBytes(dev.totalBytes)}</td>
                    <td>
                      <div className="load-indicator" style={{ width:120 }}>
                        <div className="progress-bg">
                          <div className="progress-fill" style={{ width:`${dev.trustScore}%`,background:barColor }} />
                        </div>
                        <span className="font-mono text-sm">{dev.trustScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{dev.driftScore.toFixed(3)}</td>
                    <td className="font-mono text-sm">{dev.anomalyScore.toFixed(3)}</td>
                    <td>
                      <span style={{ display:"inline-flex",alignItems:"center",gap:"0.3rem",padding:"0.2rem 0.6rem",borderRadius:9999,fontSize:"0.7rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",color:ps.color,background:ps.bg,whiteSpace:"nowrap" }}>
                        <span style={{ width:5,height:5,borderRadius:"50%",background:ps.color,display:"inline-block" }} />
                        {dev.policy}
                      </span>
                    </td>
                    <td style={{ fontWeight:600,color:getRiskColor(dev.risk) }}>{dev.risk}</td>
                    <td style={{ textAlign:"right" }}>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"0.4rem" }} onClick={e=>e.stopPropagation()}>
                        <button className="icon-btn-small" title="View Device" onClick={() => navigate(`/devices/${dev.id}`)}><Eye size={15} /></button>
                        <button className="icon-btn-small" title="Flag Device" style={{ color:"var(--danger)" }}><ShieldAlert size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   ROOT DASHBOARD — phase controller
═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [phase, setPhase] = useState("upload") // "upload" | "analytics"

  if (phase === "upload") {
    return <UploadPhase onUploadSuccess={() => setPhase("analytics")} />
  }

  return <AnalyticsPhase onReUpload={() => setPhase("upload")} />
}


