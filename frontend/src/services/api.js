const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const API_BASE_URL = envUrl ? `${envUrl.replace(/\/$/, '')}/api` : '/api';

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body !== undefined && !(options.body instanceof FormData) && !headers['Content-Type']) {
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
  return request('/dashboard/summary');
}

export function getDevices() {
  return request('/devices');
}

export function getDeviceById(deviceId) {
  return request(`/devices/${encodeURIComponent(deviceId)}`);
}

export function getTrustTrend(deviceId) {
  return request(`/devices/${encodeURIComponent(deviceId)}/trust-trend`);
}

export function getDriftTrend(deviceId) {
  return request(`/devices/${encodeURIComponent(deviceId)}/drift`);
}

export function getExplainability(deviceId) {
  return request(`/devices/${encodeURIComponent(deviceId)}/explainability`);
}

export function getAlerts() {
  return request('/alerts');
}

export function getAnomalyDistribution() {
  return request('/anomalies/distribution');
}

export function triggerAnalysis(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/analyze', {
    method: 'POST',
    body: formData,
  });
}

export function loginAdminWithPassword(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerUserApi(email, password, role) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
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

export function requestPasswordResetApi(email) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function syncMlPipelineToDatabase() {
  try {
    await triggerAnalysis();
    return { ok: true, message: '' };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'ML pipeline sync failed.',
    };
  }
}
