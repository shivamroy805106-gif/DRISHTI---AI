/**
 * DRISHTI-AI — Axios API Service Layer
 * All API calls go through this service for centralized error handling.
 */
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'API Error'
    if (error.response?.status !== 404) {
      toast.error(msg, { duration: 3000 })
    }
    return Promise.reject(error)
  }
)

// ── Incidents ──────────────────────────────────────────────────────────────
export const incidentsAPI = {
  getAll: (params = {}) => api.get('/api/incidents', { params }).then(r => r.data),
  getById: (id) => api.get(`/api/incidents/${id}`).then(r => r.data),
  create: (data) => api.post('/api/incidents', data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/api/incidents/${id}/status?status=${status}`).then(r => r.data),
}

// ── AI Analysis ────────────────────────────────────────────────────────────
export const analysisAPI = {
  analyzeText: (text, latitude, longitude) =>
    api.post('/api/analyze-incident', { text, latitude, longitude }).then(r => r.data),
  calculateRisk: (features) =>
    api.post('/api/calculate-risk', features).then(r => r.data),
  whatIf: (payload) =>
    api.post('/api/what-if', payload).then(r => r.data),
}

// ── Citizen Reports ────────────────────────────────────────────────────────
export const reportsAPI = {
  submit: (formData) =>
    api.post('/api/citizen-report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
  getAll: (params = {}) => api.get('/api/citizen-report', { params }).then(r => r.data),
  getStats: () => api.get('/api/citizen-report/stats').then(r => r.data),
}

// ── Alerts ────────────────────────────────────────────────────────────────
export const alertsAPI = {
  getAll: (params = {}) => api.get('/api/alerts', { params }).then(r => r.data),
  acknowledge: (id) => api.patch(`/api/alerts/${id}/acknowledge`).then(r => r.data),
}

// ── Response Teams ─────────────────────────────────────────────────────────
export const teamsAPI = {
  getAll: (params = {}) => api.get('/api/response-teams', { params }).then(r => r.data),
  assign: (teamId, incidentId, eta) =>
    api.patch(`/api/response-teams/${teamId}/assign?incident_id=${incidentId}&eta=${eta}`).then(r => r.data),
}

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  get: (days = 7) => api.get('/api/analytics', { params: { days } }).then(r => r.data),
}

// ── Chat ──────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (message) => api.post('/api/chat', { message }).then(r => r.data),
}

export default api
