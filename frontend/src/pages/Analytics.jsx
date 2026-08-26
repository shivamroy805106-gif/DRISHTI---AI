import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react'
import { analyticsAPI } from '../services/api'
import { LoadingSpinner, PageHeader } from '../components/SharedComponents'
import { DISASTER_COLORS } from '../utils/helpers'

const DAYS_OPTIONS = [
  { label: 'Today', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
]

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-panel rounded-lg px-3 py-2 text-xs border" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}: </span>
            <span className="font-bold text-white">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  const load = async (d = days) => {
    setLoading(true)
    try {
      const res = await analyticsAPI.get(d)
      setData(res)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(days) }, [days])

  if (loading) return <LoadingSpinner text="Loading analytics..." />
  if (!data) return null

  const byType = Object.entries(data.incidents_by_type || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
    color: DISASTER_COLORS[name] || '#64748b',
  }))

  const byState = Object.entries(data.incidents_by_state || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))

  const summary = data.summary || {}

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Analytics & Intelligence"
        subtitle="Disaster trends, risk patterns, and response analytics"
        icon={BarChart3}
      >
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          {DAYS_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                days === value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => load(days)} className="btn-ghost">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </PageHeader>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Incidents', val: summary.total_incidents, color: 'text-blue-400' },
          { label: 'Critical', val: summary.critical_incidents, color: 'text-red-400' },
          { label: 'Total Affected', val: summary.total_affected?.toLocaleString(), color: 'text-amber-400' },
          { label: 'AI Confidence', val: `${summary.ai_confidence?.toFixed(0)}%`, color: 'text-purple-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="glass-panel rounded-xl p-4 text-center">
            <div className="section-title mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-4"
        >
          <div className="section-title mb-4">AVERAGE RISK SCORE TREND</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.risk_trend || []}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Area type="monotone" dataKey="avg_risk" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2} name="Avg Risk" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* By Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-xl p-4"
        >
          <div className="section-title mb-4">INCIDENTS BY TYPE</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {byType.map((entry, index) => (
                    <Cell key={index} fill={entry.color} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CUSTOM_TOOLTIP />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {byType.map(({ name, value, color }) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-slate-400">{name}</span>
                  <span className="ml-auto font-bold text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* By State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-xl p-4"
        >
          <div className="section-title mb-4">CRITICAL INCIDENTS BY STATE</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byState} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Incidents" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Incidents by day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-xl p-4"
        >
          <div className="section-title mb-4">INCIDENT TYPES OVER TIME</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(data.incidents_by_day || []).slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="flood" stackId="a" fill={DISASTER_COLORS.flood} name="Flood" />
              <Bar dataKey="fire" stackId="a" fill={DISASTER_COLORS.fire} name="Fire" />
              <Bar dataKey="cyclone" stackId="a" fill={DISASTER_COLORS.cyclone} name="Cyclone" />
              <Bar dataKey="landslide" stackId="a" fill={DISASTER_COLORS.landslide} name="Landslide" />
              <Bar dataKey="other" stackId="a" fill="#64748b" name="Other" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
