import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, Clock, MapPin, RefreshCw, Filter } from 'lucide-react'
import { teamsAPI } from '../services/api'
import { PageHeader, LoadingSpinner, EmptyState } from '../components/SharedComponents'
import { getTeamStatusColor } from '../utils/helpers'

const TEAM_ICONS = {
  'NDRF': '🛡️', 'SDRF': '🚨', 'Medical': '🏥', 'Fire & Rescue': '🔥',
  'Police': '👮', 'Volunteers': '🤝', 'Air Support': '🚁',
}

const STATUS_FILTERS = ['ALL', 'AVAILABLE', 'DEPLOYED', 'BUSY']

export default function ResponseTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const load = useCallback(async () => {
    try {
      const data = await teamsAPI.getAll()
      setTeams(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = teams.filter(t => filter === 'ALL' || t.status === filter)
  const deployed = teams.filter(t => t.status === 'DEPLOYED').length
  const available = teams.filter(t => t.status === 'AVAILABLE').length

  if (loading) return <LoadingSpinner text="Loading response teams..." />

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Emergency Response Operations"
        subtitle="Demo response units — not real government teams"
        icon={Users}
      >
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Teams', val: teams.length, color: 'text-blue-400' },
          { label: 'Deployed', val: deployed, color: 'text-red-400' },
          { label: 'Available', val: available, color: 'text-green-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="glass-panel rounded-xl p-3 text-center">
            <div className="section-title mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((team, i) => {
          const statusCls = getTeamStatusColor(team.status)
          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel-hover rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{TEAM_ICONS[team.team_type] || '🚨'}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{team.team_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{team.team_id}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCls}`}>
                  {team.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span>{team.team_type}</span>
                  <span className="text-slate-600">·</span>
                  <span>{team.personnel_count} personnel</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span className="truncate">{team.location}</span>
                </div>
                {team.assigned_incident && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span>Assigned: </span>
                    <span className="font-mono text-red-400 font-semibold">{team.assigned_incident}</span>
                  </div>
                )}
                {team.eta_minutes && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    <span>ETA: <strong className="text-slate-300">{team.eta_minutes} min</strong></span>
                  </div>
                )}
              </div>

              {team.capabilities && team.capabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.capabilities.slice(0, 3).map(cap => (
                    <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="text-[10px] text-slate-700 text-center pt-2">
        These are demo response units for demonstration purposes only. Not affiliated with real NDRF, SDRF, or government emergency services.
      </div>
    </div>
  )
}
