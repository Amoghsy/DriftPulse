const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const ENABLE_API_FALLBACK = import.meta.env.VITE_ENABLE_API_FALLBACK !== 'false';

const mockDevices = [
  {
    id: 'DEV-1001',
    ip: '10.0.1.12',
    type: 'Server',
    trustScore: 91,
    driftScore: 0.18,
    anomalyScore: 0.09,
    policy: 'Compliant',
    risk: 'Low',
    lastSeen: '2026-03-14T09:20:00Z',
    location: 'Plant A - Zone 1',
    firmware: 'v2.4.1',
    uptime: '39d 8h',
  },
  {
    id: 'DEV-1002',
    ip: '10.0.1.33',
    type: 'Database',
    trustScore: 68,
    driftScore: 0.46,
    anomalyScore: 0.31,
    policy: 'Warning',
    risk: 'Medium',
    lastSeen: '2026-03-14T09:18:00Z',
    location: 'Plant A - Zone 3',
    firmware: 'v2.3.7',
    uptime: '13d 2h',
  },
  {
    id: 'DEV-1003',
    ip: '10.0.2.7',
    type: 'Network',
    trustScore: 44,
    driftScore: 0.81,
    anomalyScore: 0.74,
    policy: 'Non-Compliant',
    risk: 'High',
    lastSeen: '2026-03-14T09:11:00Z',
    location: 'Plant B - Gateway',
    firmware: 'v1.9.4',
    uptime: '2d 11h',
  },
  {
    id: 'DEV-1004',
    ip: '10.0.2.42',
    type: 'Storage',
    trustScore: 79,
    driftScore: 0.29,
    anomalyScore: 0.14,
    policy: 'Compliant',
    risk: 'Low',
    lastSeen: '2026-03-14T09:23:00Z',
    location: 'Plant B - Archive Rack',
    firmware: 'v2.4.0',
    uptime: '52d 1h',
  },
  {
    id: 'DEV-1005',
    ip: '10.0.3.9',
    type: 'Server',
    trustScore: 57,
    driftScore: 0.64,
    anomalyScore: 0.39,
    policy: 'Warning',
    risk: 'Medium',
    lastSeen: '2026-03-14T09:16:00Z',
    location: 'Plant C - Controls',
    firmware: 'v2.2.8',
    uptime: '7d 6h',
  },
];

const mockAlerts = [
  {
    id: 'ALT-9001',
    deviceId: 'DEV-1003',
    type: 'Unexpected firmware hash mismatch',
    severity: 'Critical',
    status: 'Investigating',
    timestamp: '2026-03-14T08:57:00Z',
    resolutionHours: 0,
  },
  {
    id: 'ALT-9002',
    deviceId: 'DEV-1005',
    type: 'Baseline drift exceeded threshold',
    severity: 'High',
    status: 'Open',
    timestamp: '2026-03-14T08:21:00Z',
    resolutionHours: 0,
  },
  {
    id: 'ALT-9003',
    deviceId: 'DEV-1002',
    type: 'Suspicious command burst',
    severity: 'Medium',
    status: 'Resolved',
    timestamp: '2026-03-14T07:44:00Z',
    resolutionHours: 1.8,
  },
  {
    id: 'ALT-9004',
    deviceId: 'DEV-1001',
    type: 'Policy deviation auto-corrected',
    severity: 'Low',
    status: 'Closed',
    timestamp: '2026-03-14T06:18:00Z',
    resolutionHours: 0.7,
  },
];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const buildMockSummary = () => {
  const totalDevices = mockDevices.length;
  const highRiskDevices = mockDevices.filter((d) => String(d.risk).toLowerCase() === 'high').length;
  const avgTrustScore =
    totalDevices > 0
      ? mockDevices.reduce((sum, d) => sum + toNumber(d.trustScore, 0), 0) / totalDevices
      : 0;
  const activeAlerts = mockAlerts.filter((a) => !['resolved', 'closed'].includes(String(a.status).toLowerCase())).length;

  return {
    totalDevices,
    highRiskDevices,
    avgTrustScore,
    activeAlerts,
    trustTrend: [
      { time: '05:00', trust: 73, drift: 0.49 },
      { time: '06:00', trust: 75, drift: 0.45 },
      { time: '07:00', trust: 71, drift: 0.52 },
      { time: '08:00', trust: 69, drift: 0.58 },
      { time: '09:00', trust: 68, drift: 0.62 },
    ],
  };
};

const buildMockDistribution = () => {
  const counts = mockDevices.reduce(
    (acc, device) => {
      const risk = String(device.risk).toLowerCase();
      if (risk === 'high') acc.high += 1;
      else if (risk === 'medium') acc.medium += 1;
      else acc.low += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 },
  );

  return [
    { name: 'Low Risk', value: counts.low, color: '#22C55E' },
    { name: 'Medium Risk', value: counts.medium, color: '#F59E0B' },
    { name: 'High Risk', value: counts.high, color: '#EF4444' },
  ];
};

const buildMockDeviceDetail = (deviceId) => {
  const found = mockDevices.find((d) => String(d.id) === String(deviceId));
  return found || mockDevices[0];
};

const buildMockTrustTrend = () => [
  { time: '05:00', trust: 78 },
  { time: '06:00', trust: 74 },
  { time: '07:00', trust: 70 },
  { time: '08:00', trust: 66 },
  { time: '09:00', trust: 63 },
];

const buildMockDriftTrend = () => [
  { time: '05:00', drift: 0.35, anomaly: 0 },
  { time: '06:00', drift: 0.42, anomaly: 0 },
  { time: '07:00', drift: 0.51, anomaly: 1 },
  { time: '08:00', drift: 0.63, anomaly: 1 },
  { time: '09:00', drift: 0.59, anomaly: 0 },
];

const buildMockExplainability = (deviceId) => {
  const device = buildMockDeviceDetail(deviceId);
  const trustScore = toNumber(device?.trustScore, 0);
  const driftScore = toNumber(device?.driftScore, 0);
  const anomalyScore = toNumber(device?.anomalyScore, 0);
  const confidence = Math.max(55, Math.min(95, Math.round((driftScore * 35 + anomalyScore * 45 + (100 - trustScore) * 0.2))));

  const insights = [];

  if (anomalyScore >= 0.7) {
    insights.push({
      id: 'EXP-ANOM',
      severity: 'high',
      confidence,
      title: 'High Anomaly Detected',
      message: `Anomaly score is ${anomalyScore.toFixed(2)} on ${device.id}, indicating a significant behavioral deviation from baseline.`,
      action: 'Quarantine Device',
    });
  }

  if (driftScore >= 0.5) {
    insights.push({
      id: 'EXP-DRIFT',
      severity: 'medium',
      confidence: Math.max(60, Math.min(90, Math.round(driftScore * 100))),
      title: 'Data Drift Rising',
      message: `Drift score is ${driftScore.toFixed(2)} for ${device.id}, which suggests recent configuration or workload profile change.`,
      action: 'Run Baseline Update',
    });
  }

  if (trustScore < 50) {
    insights.push({
      id: 'EXP-TRUST',
      severity: 'high',
      confidence,
      title: 'Low Trust Score',
      message: `Trust score dropped to ${trustScore.toFixed(0)}/100 for ${device.id}. Immediate verification is recommended.`,
      action: 'Review Device',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'EXP-NORMAL',
      severity: 'low',
      confidence: 64,
      title: 'No Anomalies',
      message: `${device.id} is operating within expected baseline thresholds across trust, drift, and anomaly indicators.`,
      action: 'Mark as Reviewed',
    });
  }

  return insights.slice(0, 3);
};

async function withFallback(apiCall, fallbackValueFactory) {
  try {
    return await apiCall();
  } catch (error) {
    if (!ENABLE_API_FALLBACK) {
      throw error;
    }

    return typeof fallbackValueFactory === 'function' ? fallbackValueFactory() : fallbackValueFactory;
  }
}

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...options,
    });
  } catch (error) {
    throw new Error(error?.message || `Network request failed for ${path}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  if (!raw || !raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function getDashboardSummary() {
  return withFallback(() => request('/dashboard/summary'), buildMockSummary);
}

export function getDevices() {
  return withFallback(() => request('/devices'), () => ({ devices: mockDevices }));
}

export function getDeviceById(deviceId) {
  return withFallback(
    () => request(`/devices/${encodeURIComponent(deviceId)}`),
    () => ({ device: buildMockDeviceDetail(deviceId) }),
  );
}

export function getTrustTrend(deviceId) {
  return withFallback(
    () => request(`/devices/${encodeURIComponent(deviceId)}/trust-trend`),
    () => ({ points: buildMockTrustTrend() }),
  );
}

export function getDriftTrend(deviceId) {
  return withFallback(
    () => request(`/devices/${encodeURIComponent(deviceId)}/drift`),
    () => ({ points: buildMockDriftTrend() }),
  );
}

export function getExplainability(deviceId) {
  return withFallback(
    () => request(`/devices/${encodeURIComponent(deviceId)}/explainability`),
    () => ({ insights: buildMockExplainability(deviceId) }),
  );
}

export function getAlerts() {
  return withFallback(() => request('/alerts'), () => ({ alerts: mockAlerts }));
}

export function getAnomalyDistribution() {
  return withFallback(
    () => request('/anomalies/distribution'),
    () => ({ distribution: buildMockDistribution() }),
  );
}

export function triggerAnalysis() {
  return request('/analyze', { method: 'POST' });
}

export function loginAdminWithPassword(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function sendLoginOtp(email) {
  return request('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyLoginOtp(email, otp) {
  return request('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function syncMlPipelineToDatabase() {
  try {
    await triggerAnalysis();
    return { ok: true, message: '' };
  } catch (error) {
    if (ENABLE_API_FALLBACK) {
      return {
        ok: true,
        message: '',
      };
    }

    return {
      ok: false,
      message: error?.message || 'ML pipeline sync failed.',
    };
  }
}
