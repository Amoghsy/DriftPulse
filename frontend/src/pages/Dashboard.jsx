import { useCallback, useEffect, useMemo, useState } from "react"
import MetricCard from "../components/MetricCard"
import TrendChart from "../components/TrendChart"
import DonutChart from "../components/DonutChart"
import DeviceTable from "../components/DeviceTable"
import { Server, AlertTriangle, Shield, Bell, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import {
  getAlerts,
  getAnomalyDistribution,
  getDashboardSummary,
  getDevices,
  triggerAnalysis,
} from "../services/api"

const toArray  = (v) => (Array.isArray(v) ? v : [])
const getNumber = (...vals) => {
  for (const v of vals) { const n = Number(v); if (Number.isFinite(n)) return n }
  return null
}
const normalizeTrendPoint = (p, i) => ({
  time:  p?.time ?? p?.timestamp ?? p?.label ?? p?.x ?? `T${i + 1}`,
  trust: getNumber(p?.trust, p?.trustScore, p?.avgTrustScore) ?? 0,
  drift: getNumber(p?.drift, p?.driftScore, p?.avgDriftScore) ?? 0,
})
const normalizeDonutData = (raw) => {
  const colorMap = { low: "#22C55E", medium: "#F59E0B", high: "#EF4444" }
  return toArray(raw).map((e) => {
    const key = String(e?.key ?? e?.risk ?? e?.name ?? "unknown").toLowerCase()
    return {
      name:  e?.name ?? (key === "low" ? "Low Risk" : key === "medium" ? "Medium Risk" : "High Risk"),
      value: getNumber(e?.value, e?.count, e?.percentage) ?? 0,
      color: colorMap[key] ?? "#94A3B8",
    }
  })
}

/** Status bar shown near the Analyze button */
const AnalyzeStatus = ({ status, message }) => {
  if (!status) return null
  const cfg = {
    running: { color: "var(--accent)",   icon: <RefreshCw size={14} className="spin-icon" />, text: "Running ML pipeline…" },
    success: { color: "var(--success)",  icon: <CheckCircle2 size={14} />, text: message || "Analysis complete — data refreshed." },
    error:   { color: "var(--danger)",   icon: <XCircle size={14} />,     text: message || "Analysis failed." },
  }[status] ?? null
  if (!cfg) return null
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      fontSize: "0.82rem", fontWeight: 500,
      color: cfg.color, padding: "0.45rem 0.85rem",
      background: `${cfg.color}14`, borderRadius: 8,
      border: `1px solid ${cfg.color}30`,
      animation: "fadeIn 0.25s ease",
    }}>
      {cfg.icon} {cfg.text}
    </div>
  )
}

export default function Dashboard() {
  const [summary,      setSummary]      = useState(null)
  const [devices,      setDevices]      = useState([])
  const [alerts,       setAlerts]       = useState([])
  const [distribution, setDistribution] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")
  const [analyzing,    setAnalyzing]    = useState(false)
  const [analyzeStatus, setAnalyzeStatus] = useState(null)  // null | 'running' | 'success' | 'error'
  const [analyzeMsg,   setAnalyzeMsg]   = useState("")

  /** Fetch data from DB (fast — no Python) */
  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")

    const [summaryRes, devicesRes, alertsRes, distributionRes] = await Promise.allSettled([
      getDashboardSummary(),
      getDevices(),
      getAlerts(),
      getAnomalyDistribution(),
    ])

    const summaryData = summaryRes.status === "fulfilled" ? summaryRes.value : null
    const devicesData = devicesRes.status === "fulfilled"
      ? toArray(devicesRes.value?.devices ?? devicesRes.value?.data ?? devicesRes.value) : []
    const alertsData = alertsRes.status === "fulfilled"
      ? toArray(alertsRes.value?.alerts ?? alertsRes.value?.data ?? alertsRes.value) : []
    const distributionData = distributionRes.status === "fulfilled"
      ? toArray(distributionRes.value?.distribution ?? distributionRes.value?.data ?? distributionRes.value) : []

    setSummary(summaryData)
    setDevices(devicesData)
    setAlerts(alertsData)
    setDistribution(distributionData)

    if ([summaryRes, devicesRes, alertsRes, distributionRes].every(r => r.status === "rejected")) {
      setError("Failed to load dashboard data from backend API.")
    }

    setLoading(false)
  }, [])

  /** On mount — just read from DB, no Python */
  useEffect(() => { loadData() }, [loadData])

  /** Analyze button handler */
  const handleAnalyze = useCallback(async () => {
    if (analyzing) return
    setAnalyzing(true)
    setAnalyzeStatus("running")
    setAnalyzeMsg("")

    try {
      const result = await triggerAnalysis()
      const count = getNumber(result?.devicesProcessed, result?.deviceCount, result?.count)
      setAnalyzeStatus("success")
      setAnalyzeMsg(`Analysis complete — ${count ?? "?"} device(s) updated.`)
      // Immediately reload from DB to pick up newly persisted data
      await loadData()
    } catch (err) {
      setAnalyzeStatus("error")
      setAnalyzeMsg(err?.message || "ML pipeline failed. Is Python configured?")
    } finally {
      setAnalyzing(false)
      // Auto-clear status after 6 seconds
      setTimeout(() => setAnalyzeStatus(null), 6000)
    }
  }, [analyzing, loadData])

  const metrics = useMemo(() => {
    const totalDevices    = getNumber(summary?.totalDevices,    summary?.metrics?.totalDevices,    devices.length) ?? 0
    const highRiskDevices = getNumber(summary?.highRiskDevices, summary?.metrics?.highRiskDevices,
      devices.filter((d) => String(d?.risk ?? d?.riskLevel ?? "").toLowerCase() === "high").length) ?? 0
    const avgTrustScore   = getNumber(summary?.avgTrustScore,  summary?.metrics?.avgTrustScore) ??
      (devices.length ? devices.reduce((a, d) => a + (getNumber(d?.trustScore) ?? 0), 0) / devices.length : 0)
    const activeAlerts    = getNumber(summary?.activeAlerts,   summary?.metrics?.activeAlerts,
      alerts.filter((a) => !["resolved","closed"].includes(String(a?.status ?? "").toLowerCase())).length) ?? 0
    return { totalDevices, highRiskDevices, avgTrustScore, activeAlerts }
  }, [alerts, devices, summary])

  const trendData = useMemo(() => {
    const pts = toArray(summary?.trustTrend ?? summary?.trendData ?? summary?.charts?.trustTrend)
    if (pts.length > 0) return pts.map(normalizeTrendPoint)
    return devices.slice(0, 7).map((d, i) => ({
      time:  d?.lastSeen ?? `T${i + 1}`,
      trust: getNumber(d?.trustScore) ?? 0,
      drift: getNumber(d?.driftScore) ?? 0,
    }))
  }, [devices, summary])

  const donutData = useMemo(() => {
    if (distribution.length > 0) return normalizeDonutData(distribution)
    const counts = devices.reduce((acc, d) => {
      const r = String(d?.risk ?? d?.riskLevel ?? "").toLowerCase()
      if (r === "high") acc.high += 1
      else if (r === "medium") acc.medium += 1
      else acc.low += 1
      return acc
    }, { low: 0, medium: 0, high: 0 })
    return [
      { name: "Low Risk",    value: counts.low,    color: "#22C55E" },
      { name: "Medium Risk", value: counts.medium, color: "#F59E0B" },
      { name: "High Risk",   value: counts.high,   color: "#EF4444" },
    ]
  }, [devices, distribution])

  return (
    <div className="main-content fade-in">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Operations Center</h1>
          <p className="page-subtitle">Real-time infrastructure drift and anomaly monitoring</p>
        </div>

        {/* Right side — Live badge + Analyze button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>

          <AnalyzeStatus status={analyzeStatus} message={analyzeMsg} />

          <span style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            fontSize: "0.78rem", color: "var(--success)", fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", animation: "pulse-dot 2s infinite" }} />
            Live Monitoring
          </span>

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={analyzing}
            title="Run ML pipeline and refresh data"
          >
            <RefreshCw size={15} className={analyzing ? "spin-icon" : ""} />
            {analyzing ? "Analyzing…" : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom: "1.5rem" }}>
        <MetricCard title="Total Devices"     value={loading ? "…" : metrics.totalDevices.toLocaleString()}   trend="up"   icon={Server}        iconColor="#2FB6C4" />
        <MetricCard title="High Risk Devices" value={loading ? "…" : metrics.highRiskDevices.toLocaleString()} trend="down" icon={AlertTriangle}  iconColor="#EF4444" color="var(--danger)" />
        <MetricCard title="Avg Trust Score"   value={loading ? "…" : metrics.avgTrustScore.toFixed(1)}         trend="up"   icon={Shield}         iconColor="#22C55E" color="var(--success)" />
        <MetricCard title="Active Alerts"     value={loading ? "…" : metrics.activeAlerts.toLocaleString()}   trend="down" icon={Bell}            iconColor="#F59E0B" color="var(--warning)" />
      </div>

      {error && (
        <div className="glass-panel" style={{ marginBottom: "1.25rem", padding: "0.8rem 1rem", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: "1.5rem" }}>
        <TrendChart data={trendData} loading={loading} />
        <DonutChart data={donutData} loading={loading} />
      </div>

      {/* Device Security Overview Table */}
      <div style={{ marginTop: "0.5rem" }}>
        <DeviceTable devices={devices} loading={loading} />
      </div>

    </div>
  )
}
