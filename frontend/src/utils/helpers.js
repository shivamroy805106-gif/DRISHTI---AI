/**
 * DRISHTI-AI — Utility Functions
 */

export const RISK_COLORS = {
  CRITICAL: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', hex: '#ef4444', glow: 'shadow-red-500/30' },
  HIGH:     { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', hex: '#f97316', glow: 'shadow-orange-500/30' },
  MEDIUM:   { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', hex: '#eab308', glow: 'shadow-yellow-500/30' },
  LOW:      { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', hex: '#22c55e', glow: 'shadow-green-500/30' },
}

export const DISASTER_ICONS = {
  flood: '🌊',
  fire: '🔥',
  cyclone: '🌀',
  landslide: '⛰️',
  earthquake: '🏔️',
  drought: '☀️',
  accident: '⚡',
  heatwave: '🌡️',
  unknown: '⚠️',
}

export const DISASTER_COLORS = {
  flood: '#3b82f6',
  fire: '#ef4444',
  cyclone: '#8b5cf6',
  landslide: '#d97706',
  earthquake: '#ec4899',
  drought: '#f59e0b',
  accident: '#64748b',
  heatwave: '#f97316',
}

export function getRiskColor(category) {
  return RISK_COLORS[category?.toUpperCase()] || RISK_COLORS.LOW
}

export function getRiskBadgeClass(category) {
  const map = {
    CRITICAL: 'risk-badge-critical',
    HIGH: 'risk-badge-high',
    MEDIUM: 'risk-badge-medium',
    LOW: 'risk-badge-low',
  }
  return map[category?.toUpperCase()] || 'risk-badge-low'
}

export function formatNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n?.toLocaleString() || '0'
}

export function formatTimeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'))
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'))
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch {
    return dateStr
  }
}

export function getPriorityColor(priority) {
  const map = {
    P1: { text: 'text-red-400', bg: 'bg-red-500/20', label: 'P1 — IMMEDIATE' },
    P2: { text: 'text-orange-400', bg: 'bg-orange-500/20', label: 'P2 — URGENT' },
    P3: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'P3 — MONITOR' },
  }
  return map[priority] || map.P3
}

export function getStatusColor(status) {
  const map = {
    ACTIVE: 'text-red-400',
    MONITORING: 'text-yellow-400',
    RESOLVED: 'text-green-400',
    CLOSED: 'text-slate-400',
  }
  return map[status?.toUpperCase()] || 'text-slate-400'
}

export function getTeamStatusColor(status) {
  const map = {
    AVAILABLE: 'text-green-400 bg-green-500/10 border-green-500/20',
    DEPLOYED: 'text-red-400 bg-red-500/10 border-red-500/20',
    BUSY: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  }
  return map[status?.toUpperCase()] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'
}

export function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export const INDIA_BOUNDS = {
  center: [20.5937, 78.9629],
  zoom: 5,
  minZoom: 4,
  maxZoom: 14,
}

export function featureLabel(key) {
  const labels = {
    rainfall: 'Rainfall',
    river_level: 'River Level',
    population_density: 'Population Density',
    affected_population: 'Affected Population',
    historical_disaster_freq: 'Historical Risk',
    infrastructure_vulnerability: 'Infrastructure Vulnerability',
    weather_severity: 'Weather Severity',
    distance_to_hospital: 'Distance to Hospital',
    road_accessibility: 'Road Accessibility',
  }
  return labels[key] || key
}
