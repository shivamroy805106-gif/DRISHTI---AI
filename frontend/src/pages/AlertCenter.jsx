import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, RefreshCw, Filter } from 'lucide-react'
import { alertsAPI } from '../services/api'
import { PageHeader, LoadingSpinner, EmptyState } from '../components/SharedComponents'
import { formatTimeAgo, getRiskColor } from '../utils/helpers'
import toast from 'react-hot-toast'

const SEVERITY_FILTER = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM']

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const load = useCallback(async () => {
    try {
      const data = await alertsAPI.getAll()
      setAlerts(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const acknowledge = async (alertId) => {
    try {
      await alertsAPI.acknowledge(alertId)
      setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, acknowledged: true } : a))
      toast.success('Alert acknowledged')
    } catch {}
  }

  const filtered = alerts.filter(a => filter === 'ALL' || a.severity === filter)
  const unread = alerts.filter(a => !a.acknowledged).length

  if (loading) return <LoadingSpinner text="Loading alerts..." />

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Alert Center"
        subtitle="Real-time disaster risk alerts and escalation notifications"
        icon={Bell}
      >
        {unread > 0 && (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 font-bold">
            {unread} unread
          </span>
        )}
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {SEVERITY_FILTER.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts" message="All clear — no active alerts matching your filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert, i) => {
            const riskColor = getRiskColor(alert.severity)
            const isCritical = alert.severity === 'CRITICAL' && !alert.acknowledged

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-panel rounded-xl p-4 border transition-all ${
                  isCritical ? 'alert-critical' : ''
                } ${alert.acknowledged ? 'opacity-60' : ''}`}
                style={{ borderColor: alert.acknowledged ? 'transparent' : `${riskColor.hex}30` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {!alert.acknowledged && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: riskColor.hex }} />
                      )}
                      <span className={`text-[10px] font-bold uppercase ${
                        alert.severity === 'CRITICAL' ? 'text-red-400' :
                        alert.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'
                      }`}>
                        {alert.severity} ALERT
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">{alert.incident_id}</span>
                      <span className="text-[10px] text-slate-600">{alert.alert_type?.replace('_', ' ')}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mb-1">{alert.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed mb-2">{alert.message}</div>

                    {alert.previous_risk > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Risk escalation:</span>
                        <span className="font-mono text-slate-400">{alert.previous_risk?.toFixed(0)}</span>
                        <span className="text-slate-600">→</span>
                        <span className="font-mono font-bold" style={{ color: riskColor.hex }}>
                          {alert.current_risk?.toFixed(0)}
                        </span>
                      </div>
                    )}
                    {alert.change_reason && (
                      <div className="text-[11px] text-slate-500 italic mt-1">
                        Reason: {alert.change_reason}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-600 mt-2">{formatTimeAgo(alert.created_at)}</div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge(alert.alert_id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
                      >
                        <Check className="w-3 h-3" />
                        ACK
                      </button>
                    )}
                    <a
                      href="/app/map"
                      className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all text-center"
                    >
                      VIEW MAP
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
