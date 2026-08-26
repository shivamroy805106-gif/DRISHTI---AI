import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Shield, Users, Activity, Zap, Brain,
  Play, ChevronRight, RefreshCw, MapPin, Clock
} from 'lucide-react'
import { incidentsAPI, alertsAPI, teamsAPI } from '../services/api'
import {
  StatCard, IncidentCard, IncidentDetailPanel,
  LoadingSpinner, AnimatedCounter
} from '../components/SharedComponents'
import { getRiskColor, formatTimeAgo, DISASTER_ICONS } from '../utils/helpers'
import { useDemoMode } from '../hooks/useDemoMode'
import toast from 'react-hot-toast'

// Demo scenario steps
const DEMO_STEPS = [
  { id: 1, text: 'Heavy rainfall detected in Bihar — 92mm/hr', type: 'info' },
  { id: 2, text: 'River Phalgu level rising: +6cm/hr above danger mark', type: 'warning' },
  { id: 3, text: '47 citizen reports received — AI clustering in progress...', type: 'info' },
  { id: 4, text: 'AI: 47 reports consolidated into 1 incident cluster (BIH-FLD-024)', type: 'success' },
  { id: 5, text: 'ML model calculating risk score... Rainfall: +28, River: +24, Population: +17', type: 'info' },
  { id: 6, text: 'RISK SCORE: 91/100 → CRITICAL — Nawada, Bihar marked CRITICAL on map', type: 'critical' },
  { id: 7, text: 'XAI: "Heavy rainfall + rising river levels + high population density = Critical flood risk"', type: 'ai' },
  { id: 8, text: 'Priority Engine: BIH-FLD-024 → P1 IMMEDIATE — NDRF deployment triggered', type: 'warning' },
  { id: 9, text: 'Emergency Response Plan generated. NDRF-01 ETA: 45 minutes', type: 'success' },
  { id: 10, text: 'What-If: +50% rainfall → Score 97/100 — Situation would become CATASTROPHIC', type: 'critical' },
]

export default function Dashboard() {
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [demoLog, setDemoLog] = useState([])
  const { demoMode } = useDemoMode()

  const loadData = useCallback(async () => {
    try {
      const [incs, als, tms] = await Promise.all([
        incidentsAPI.getAll(),
        alertsAPI.getAll({ acknowledged: false }),
        teamsAPI.getAll(),
      ])
      setIncidents(incs)
      setAlerts(als)
      setTeams(tms)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const runLiveDemo = async () => {
    if (demoRunning) return
    setDemoRunning(true)
    setDemoLog([])
    setDemoStep(0)
    toast.success('🎬 Live Demo Started!', { duration: 2000 })

    for (let i = 0; i < DEMO_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 1200))
      setDemoStep(i + 1)
      setDemoLog(prev => [...prev, DEMO_STEPS[i]])
    }
    await new Promise(r => setTimeout(r, 1000))
    setDemoRunning(false)
    toast.success('✅ Demo scenario completed!', { duration: 3000 })
    loadData()
  }

  const critical = incidents.filter(i => i.risk_category === 'CRITICAL')
  const high = incidents.filter(i => i.risk_category === 'HIGH')
  const totalAffected = incidents.reduce((s, i) => s + (i.affected_population || 0), 0)
  const deployed = teams.filter(t => t.status === 'DEPLOYED').length
  const avgConf = incidents.length > 0
    ? Math.round(incidents.reduce((s, i) => s + (i.probability || 0), 0) / incidents.length)
    : 0

  if (loading) return <LoadingSpinner text="Loading Command Center..." />

  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            AI Disaster Intelligence <span className="gradient-text">Command Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono uppercase tracking-widest">
            Live · Synthetic Demo Data · AI-Generated Risk Scores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="btn-ghost"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={runLiveDemo}
            disabled={demoRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              demoRunning
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {demoRunning ? `Running Demo (${demoStep}/10)` : 'RUN LIVE DEMO'}
          </button>
        </div>
      </div>

      {/* Demo log */}
      {demoLog.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-panel rounded-xl p-4 space-y-1.5"
          style={{ borderColor: 'rgba(251,191,36,0.2)' }}
        >
          <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
            <Play className="w-3 h-3" />
            LIVE DEMO SCENARIO
          </div>
          {demoLog.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2 text-xs py-1 ${
                step.type === 'critical' ? 'text-red-400' :
                step.type === 'warning' ? 'text-amber-400' :
                step.type === 'success' ? 'text-green-400' :
                step.type === 'ai' ? 'text-blue-400' :
                'text-slate-400'
              }`}
            >
              <span className="font-bold flex-shrink-0">STEP {step.id}</span>
              <span>{step.text}</span>
            </motion.div>
          ))}
          {demoRunning && (
            <div className="text-xs text-slate-600 animate-pulse">Processing...</div>
          )}
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={AlertTriangle}
          label="Critical Zones"
          value={critical.length}
          color="text-red-400"
          sub="Immediate action"
        />
        <StatCard
          icon={Activity}
          label="High Risk Zones"
          value={high.length}
          color="text-orange-400"
          sub="Priority response"
        />
        <StatCard
          icon={Users}
          label="People at Risk"
          value={totalAffected}
          color="text-amber-400"
          sub="Total affected"
        />
        <StatCard
          icon={MapPin}
          label="Active Incidents"
          value={incidents.length}
          color="text-blue-400"
          sub="Tracked"
        />
        <StatCard
          icon={Shield}
          label="Response Teams"
          value={teams.length}
          color="text-cyan-400"
          sub={`${deployed} deployed`}
        />
        <StatCard
          icon={Brain}
          label="AI Confidence"
          value={avgConf}
          suffix="%"
          color="text-purple-400"
          sub="Model accuracy"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Incidents list */}
        <div className="col-span-12 lg:col-span-5">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">ACTIVE INCIDENTS ({incidents.length})</div>
              <a href="/app/map" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View Map <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {incidents.map(inc => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onClick={setSelectedIncident}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Alerts */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">CRITICAL ALERTS ({alerts.length})</div>
              <a href="/app/alerts" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                All Alerts <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {alerts.slice(0, 4).map(alert => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-lg p-3 border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-500/5 border-red-500/25 alert-critical'
                      : 'bg-orange-500/5 border-orange-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase ${
                          alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-600">{alert.incident_id}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 truncate">{alert.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{alert.message}</div>
                      {alert.previous_risk > 0 && (
                        <div className="text-[10px] text-slate-600 mt-1 font-mono">
                          Risk: {alert.previous_risk?.toFixed(0)} → <span className="text-red-400">{alert.current_risk?.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-slate-600 whitespace-nowrap">{formatTimeAgo(alert.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {alerts.length === 0 && (
                <div className="text-xs text-slate-600 text-center py-4">No active alerts</div>
              )}
            </div>
          </div>

          {/* Response Teams Status */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">RESPONSE TEAMS STATUS</div>
              <a href="/app/teams" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                All Teams <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {teams.slice(0, 8).map(team => (
                <div key={team.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/3 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      team.status === 'DEPLOYED' ? 'bg-red-500 animate-pulse' :
                      team.status === 'AVAILABLE' ? 'bg-green-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="text-slate-300 font-medium truncate">{team.team_name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {team.assigned_incident && (
                      <span className="text-[10px] font-mono text-slate-600">{team.assigned_incident}</span>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      team.status === 'DEPLOYED' ? 'text-red-400 bg-red-500/10' :
                      team.status === 'AVAILABLE' ? 'text-green-400 bg-green-500/10' :
                      'text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {team.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Table */}
          <div className="glass-panel rounded-xl p-4">
            <div className="section-title mb-3">PRIORITY RESPONSE QUEUE</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-600 border-b border-white/5">
                    <th className="text-left pb-2 font-medium">Priority</th>
                    <th className="text-left pb-2 font-medium">Incident</th>
                    <th className="text-left pb-2 font-medium hidden md:table-cell">Location</th>
                    <th className="text-right pb-2 font-medium">Risk</th>
                    <th className="text-right pb-2 font-medium hidden md:table-cell">Affected</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 6).map(inc => (
                    <tr
                      key={inc.id}
                      className="border-b border-white/3 hover:bg-white/2 cursor-pointer transition-colors"
                      onClick={() => setSelectedIncident(inc)}
                    >
                      <td className="py-2">
                        <span className={`font-bold text-[10px] ${
                          inc.priority === 'P1' ? 'text-red-400' :
                          inc.priority === 'P2' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`}>
                          {inc.priority}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-slate-400">{inc.incident_id}</td>
                      <td className="py-2 text-slate-300 hidden md:table-cell truncate max-w-[120px]">{inc.location}</td>
                      <td className="py-2 text-right">
                        <span style={{ color: getRiskColor(inc.risk_category).hex }} className="font-bold">
                          {inc.risk_score?.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-500 hidden md:table-cell">
                        {inc.affected_population?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Panel */}
      {selectedIncident && (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}

      {/* Disclaimer */}
      <div className="text-[10px] text-slate-700 text-center pt-2 border-t border-white/5">
        DRISHTI-AI is a decision-support prototype. Risk predictions are AI-generated and should be validated by authorized emergency-management personnel. Demo data is synthetic.
      </div>
    </div>
  )
}
