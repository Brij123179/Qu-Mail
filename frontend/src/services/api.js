import axios from 'axios';

const API_BASE = '/api/v1';

export const api = {
  getStats: () => axios.get(`${API_BASE}/dashboard/stats`).then((res) => res.data),
  getInbox: (user) => axios.get(`${API_BASE}/email/inbox/${encodeURIComponent(user)}`).then((res) => res.data),
  sendEmail: (data) => axios.post(`${API_BASE}/email/send`, data).then((res) => res.data),
  getKeyBank: (limit = 50) => axios.get(`${API_BASE}/keys/bank/list?limit=${limit}`).then((res) => res.data),
  getAuditLogs: (limit = 40) => axios.get(`${API_BASE}/audit/logs?limit=${limit}`).then((res) => res.data),
  executeReplayAttack: (keyId) => axios.post(`${API_BASE}/keys/simulate-attack/replay`, { key_id: keyId }).then((res) => res.data),
  testTamperAttack: (msgId) => axios.post(`${API_BASE}/attack/tamper?msg_id=${msgId}`).then((res) => res.data),
  testHarvestAttack: (msgId) => axios.post(`${API_BASE}/attack/harvest-sim?msg_id=${msgId}`).then((res) => res.data),
  getTransportConfig: () => axios.get(`${API_BASE}/config/transport`).then((res) => res.data),
  updateTransportConfig: (config) => axios.post(`${API_BASE}/config/transport`, config).then((res) => res.data),
  getKeyEntropy: () => axios.get(`${API_BASE}/keys/entropy`).then((res) => res.data),
  exportAuditReportUrl: (format = 'html') => `${API_BASE}/audit/export?format=${format}`,
};
