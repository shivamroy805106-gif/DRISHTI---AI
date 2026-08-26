/**
 * DRISHTI-AI — Shared UI Components
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, TrendingUp, X, ChevronRight, Clock, Users, MapPin } from 'lucide-react'
import {
  getRiskColor, getRiskBadgeClass, formatNumber, formatTimeAgo,
  getPriorityColor, DISASTER_ICONS, featureLabel, getStatusColor
} from '../utils/helpers'


// ── AnimatedCounter ──────────────────────────────────────────────────────────
export function AnimatedCounter({ target, duration = 1500, prefix = '', suffix = '', className = '' }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    startRef.current = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setDisplay(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return (
    <span className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  )
}


// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, suffix = '', color = 'text-blue-400', animate = true, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="section-title">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${color} opacity-70`} />}
      </div>
      <div className={`text-2xl font-bold ${color} font-mono`}>
        {animate
          ? <AnimatedCounter target={typeof value === 'number' ? value : 0} suffix={suffix} />
          : <span>{value}{suffix}</span>
        }
      </div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </motion.div>
  )
}


// ── RiskIndicator (circular) ──────────────────────────────────────────────────
export function RiskIndicator({ score, size = 120, strokeWidth = 8 }) {
  const category =
    score >= 76 ? 'CRITICAL'
    : score >= 51 ? 'HIGH'
    : score >= 26 ? 'MEDIUM'
    : 'LOW'
  const color = getRiskColor(category).hex
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white font-mono">{score}</span>
        <span className="text-[9px] uppercase tracking-widest" style={{ color }}>{category}</span>
      </div>
    </div>
  )
}


// ── FeatureBar (for XAI explanations) ────────────────────────────────────────
export function FeatureBar({ label, value, maxVal = 30, color = '#3b82f6' }) {
  const pct = Math.min(100, (value / maxVal) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>+{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}


// ── IncidentCard ──────────────────────────────────────────────────────────────
export function IncidentCard({ incident, onClick, compact = false }) {
  const riskColor = getRiskColor(incident.risk_category)
  const badgeClass = getRiskBadgeClass(incident.risk_category)
  const pri = getPriorityColor(incident.priority)
  const statusColor = getStatusColor(incident.status)

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`glass-panel-hover rounded-xl p-3.5 cursor-pointer ${
        incident.risk_category === 'CRITICAL' ? 'alert-critical' : ''
      }`}
      onClick={() => onClick?.(incident)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="text-xl flex-shrink-0 mt-0.5">
            {DISASTER_ICONS[incident.disaster_type] || '⚠️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500">{incident.incident_id}</span>
              <span className={badgeClass}>{incident.risk_category}</span>
              <span className={`text-[10px] font-semibold ${pri.text}`}>{incident.priority}</span>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{incident.location}</div>
            {!compact && (
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatNumber(incident.affected_population)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(incident.detected_at)}
                </span>
                <span className={`font-semibold ${statusColor}`}>{incident.status}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-lg font-bold font-mono" style={{ color: riskColor.hex }}>
            {incident.risk_score?.toFixed(0)}
          </span>
          <span className="text-[9px] text-slate-600">/100</span>
        </div>
      </div>
      {!compact && incident.description && (
        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{incident.description}</p>
      )}
    </motion.div>
  )
}


// ── Incident Detail Panel ─────────────────────────────────────────────────────
export function IncidentDetailPanel({ incident, onClose }) {
  if (!incident) return null
  const riskColor = getRiskColor(incident.risk_category)
  const contributions = incident.feature_contributions || {}
  const topContribs = Object.entries(contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxContrib = topContribs[0]?.[1] || 30

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        className="fixed right-4 top-20 bottom-4 w-96 glass-panel rounded-xl overflow-y-auto z-50"
        style={{ borderColor: `${riskColor.hex}30` }}
      >
        {/* Header */}
        <div className="sticky top-0 p-4 border-b flex items-start justify-between"
          style={{ background: 'rgba(15,22,41,0.98)', borderColor: 'rgba(59,130,246,0.1)' }}>
          <div>
            <div className="text-xs font-mono text-slate-500">{incident.incident_id}</div>
            <div className="text-base font-bold text-white mt-0.5">{incident.location}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`risk-badge risk-badge-${incident.risk_category?.toLowerCase()}`}>
                {DISASTER_ICONS[incident.disaster_type]} {incident.disaster_type}
              </span>
              <span className={`text-xs font-semibold ${getStatusColor(incident.status)}`}>
                {incident.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Risk indicator */}
          <div className="flex items-center justify-center py-3">
            <RiskIndicator score={Math.round(incident.risk_score || 0)} size={110} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Risk Score', `${incident.risk_score?.toFixed(0)}/100`],
              ['Probability', `${incident.probability?.toFixed(0)}%`],
              ['Affected', formatNumber(incident.affected_population)],
              ['Priority', incident.priority],
              ['Rainfall', `${incident.rainfall?.toFixed(0)}%`],
              ['River Level', `${incident.river_level?.toFixed(0)}%`],
            ].map(([label, val]) => (
              <div key={label} className="bg-white/3 rounded-lg p-2">
                <div className="text-slate-500">{label}</div>
                <div className="font-semibold text-slate-200 mt-0.5">{val}</div>
              </div>
            ))}
          </div>

          {/* AI Explanation */}
          <div>
            <div className="section-title mb-2">WHY IS THIS HIGH RISK?</div>
            <div className="space-y-2">
              {topContribs.map(([key, val]) => (
                <FeatureBar
                  key={key}
                  label={featureLabel(key)}
                  value={val}
                  maxVal={maxContrib}
                  color={riskColor.hex}
                />
              ))}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-2 font-mono text-right">
              TOTAL RISK: {incident.risk_score?.toFixed(0)}/100
            </div>
          </div>

          {/* AI Explanation text */}
          {incident.ai_explanation && (
            <div>
              <div className="section-title mb-2">AI EXPLANATION</div>
              <div className="text-xs text-slate-400 leading-relaxed bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                {incident.ai_explanation}
              </div>
              <div className="text-[10px] text-slate-600 mt-1.5 italic">
                AI-generated analysis based on available incident and environmental data.
              </div>
            </div>
          )}

          {/* Recommended actions */}
          {incident.recommended_actions?.length > 0 && (
            <div>
              <div className="section-title mb-2">RECOMMENDED ACTIONS</div>
              <div className="space-y-1.5">
                {incident.recommended_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <span className="text-slate-300">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}


// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm text-slate-500">{text}</span>
    </div>
  )
}


// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = AlertTriangle, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <Icon className="w-12 h-12 text-slate-700" />
      <div className="text-slate-400 font-semibold">{title}</div>
      {message && <div className="text-sm text-slate-600 max-w-xs">{message}</div>}
    </div>
  )
}


// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-blue-400" style={{ width: 18, height: 18 }} />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
