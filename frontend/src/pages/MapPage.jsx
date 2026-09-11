import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import { Map, Filter, RefreshCw, ZoomIn } from 'lucide-react'
import { incidentsAPI } from '../services/api'
import { IncidentDetailPanel, LoadingSpinner, PageHeader } from '../components/SharedComponents'
import { getRiskColor, DISASTER_ICONS, formatNumber, formatTimeAgo, INDIA_BOUNDS } from '../utils/helpers'
import 'leaflet/dist/leaflet.css'

const FILTER_TYPES = ['all', 'flood', 'fire', 'cyclone', 'landslide', 'earthquake', 'accident', 'drought', 'critical']
const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
}

function PulsingMarker({ incident, onClick }) {
  const color = SEVERITY_COLORS[incident.risk_category] || '#94a3b8'
  const isCritical = incident.risk_category === 'CRITICAL'
  const radius = isCritical ? 14 : incident.risk_category === 'HIGH' ? 11 : 9

  return (
    <CircleMarker
      center={[incident.latitude, incident.longitude]}
      radius={radius}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: isCritical ? 3 : 2,
        opacity: 1,
      }}
      eventHandlers={{ click: () => onClick(incident) }}
    >
      <Popup>
        <div className="text-slate-200 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{DISASTER_ICONS[incident.disaster_type] || '⚠️'}</span>
            <div>
              <div className="font-bold text-sm">{incident.location}</div>
              <div className="text-xs opacity-60 font-mono">{incident.incident_id}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div>
              <span className="opacity-50">Risk: </span>
              <span className="font-bold" style={{ color }}>{incident.risk_score?.toFixed(0)}/100</span>
            </div>
            <div>
              <span className="opacity-50">Category: </span>
              <span className="font-bold" style={{ color }}>{incident.risk_category}</span>
            </div>
            <div>
              <span className="opacity-50">Affected: </span>
              <span>{formatNumber(incident.affected_population)}</span>
            </div>
            <div>
              <span className="opacity-50">Status: </span>
              <span>{incident.status}</span>
            </div>
          </div>
          <button
            className="mt-2 w-full text-[11px] py-1 rounded bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 transition-colors"
            onClick={(e) => { e.stopPropagation(); onClick(incident) }}
          >
            View Details →
          </button>
        </div>
      </Popup>
    </CircleMarker>
  )
}

function MapBounds({ incidents }) {
  const map = useMap()
  useEffect(() => {
    if (incidents.length > 0) {
      map.setView(INDIA_BOUNDS.center, INDIA_BOUNDS.zoom)
    }
  }, [])
  return null
}

export default function MapPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [filter, setFilter] = useState('all')

  const loadIncidents = useCallback(async () => {
    try {
      const data = await incidentsAPI.getAll()
      setIncidents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadIncidents() }, [loadIncidents])

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'all') return true
    if (filter === 'critical') return inc.risk_category === 'CRITICAL'
    return inc.disaster_type === filter
  }).filter(inc => inc.latitude && inc.longitude)

  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.risk_category === 'CRITICAL').length,
    high: incidents.filter(i => i.risk_category === 'HIGH').length,
    medium: incidents.filter(i => i.risk_category === 'MEDIUM').length,
  }

  return (
    <div className="space-y-4 h-full">
      <PageHeader
        title="Live India Risk Map"
        subtitle="Real-time incident visualization with AI risk scoring"
        icon={Map}
      >
        <button onClick={loadIncidents} className="btn-ghost">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {FILTER_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            {type === 'all' ? `All (${incidents.length})` : type}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-xs">
        {[
          { label: 'CRITICAL', val: stats.critical, color: '#ef4444' },
          { label: 'HIGH', val: stats.high, color: '#f97316' },
          { label: 'MEDIUM', val: stats.medium, color: '#eab308' },
          { label: 'Shown', val: filteredIncidents.length, color: '#94a3b8' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-slate-500">{label}:</span>
            <span className="font-bold" style={{ color }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        <div className="lg:col-span-3 glass-panel rounded-xl overflow-hidden relative">
          {loading ? (
            <LoadingSpinner text="Loading map..." />
          ) : (
            <MapContainer
              center={INDIA_BOUNDS.center}
              zoom={INDIA_BOUNDS.zoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
              <MapBounds incidents={filteredIncidents} />
              {filteredIncidents.map(inc => (
                <PulsingMarker
                  key={inc.id}
                  incident={inc}
                  onClick={setSelectedIncident}
                />
              ))}
            </MapContainer>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 glass-panel rounded-xl p-3 text-xs z-[1000]">
            <div className="font-semibold text-slate-400 mb-2 uppercase tracking-wide text-[10px]">Risk Level</div>
            {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2 mb-1 last:mb-0">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-slate-400">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incident list sidebar */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-4 overflow-y-auto">
          <div className="section-title mb-3">INCIDENTS ({filteredIncidents.length})</div>
          <div className="space-y-2">
            {filteredIncidents.map(inc => {
              const color = getRiskColor(inc.risk_category).hex
              return (
                <motion.div
                  key={inc.id}
                  whileHover={{ x: 2 }}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                    selectedIncident?.id === inc.id
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                  onClick={() => setSelectedIncident(inc)}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-slate-500 text-[10px]">{inc.incident_id}</span>
                    <span className="font-bold font-mono" style={{ color }}>{inc.risk_score?.toFixed(0)}</span>
                  </div>
                  <div className="text-slate-300 font-medium truncate">{inc.location}</div>
                  <div className="text-slate-600 text-[10px] mt-0.5 capitalize">
                    {DISASTER_ICONS[inc.disaster_type]} {inc.disaster_type} · {formatTimeAgo(inc.detected_at)}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Incident detail panel */}
      {selectedIncident && (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  )
}
