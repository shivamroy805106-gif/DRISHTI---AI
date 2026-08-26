import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, TrendingUp, AlertTriangle } from 'lucide-react'
import { analysisAPI } from '../services/api'
import { RiskIndicator, PageHeader } from '../components/SharedComponents'
import { getRiskColor, featureLabel } from '../utils/helpers'

const FEATURES_CONFIG = [
  { key: 'rainfall', label: 'Rainfall', icon: '🌧️', unit: '%' },
  { key: 'river_level', label: 'River Level', icon: '🌊', unit: '%' },
  { key: 'population_density', label: 'Population Exposure', icon: '👥', unit: '%' },
  { key: 'infrastructure_vulnerability', label: 'Infrastructure Vulnerability', icon: '🏗️', unit: '%' },
  { key: 'weather_severity', label: 'Weather Severity', icon: '⛈️', unit: '%' },
  { key: 'historical_disaster_freq', label: 'Historical Risk', icon: '📊', unit: '%' },
]

const DEFAULT_FEATURES = {
  rainfall: 50,
  river_level: 50,
  population_density: 55,
  affected_population: 50,
  historical_disaster_freq: 55,
  infrastructure_vulnerability: 50,
  weather_severity: 45,
  distance_to_hospital: 40,
  road_accessibility: 55,
}

// Bihar flood demo preset
const PRESETS = {
  baseline: { ...DEFAULT_FEATURES, label: 'Moderate Baseline' },
  biharFlood: {
    ...DEFAULT_FEATURES, rainfall: 92, river_level: 88, population_density: 78,
    historical_disaster_freq: 82, infrastructure_vulnerability: 76, weather_severity: 89,
    label: 'Bihar Flood (Current)'
  },
  cyclone: {
    ...DEFAULT_FEATURES, weather_severity: 95, rainfall: 75, population_density: 70,
    historical_disaster_freq: 85, label: 'Odisha Cyclone'
  },
  landslide: {
    ...DEFAULT_FEATURES, rainfall: 80, infrastructure_vulnerability: 82,
    historical_disaster_freq: 78, road_accessibility: 10, distance_to_hospital: 75,
    label: 'Uttarakhand Landslide'
  },
}

export default function Simulator() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoCalc, setAutoCalc] = useState(true)

  const calculate = useCallback(async (f = features) => {
    setLoading(true)
    try {
      const res = await analysisAPI.calculateRisk(f)
      setResult(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [features])

  const updateFeature = (key, value) => {
    const newFeatures = { ...features, [key]: value }
    setFeatures(newFeatures)
    if (autoCalc) calculate(newFeatures)
  }

  const loadPreset = (preset) => {
    setFeatures(preset)
    calculate(preset)
  }

  const riskColor = result ? getRiskColor(result.risk_category) : null

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="What-If Disaster Simulator"
        subtitle="Dynamically adjust environmental parameters and observe AI risk score changes in real-time"
        icon={FlaskConical}
      />

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => loadPreset(preset)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 hover:border-blue-500/40 text-slate-400 hover:text-white transition-all"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Sliders */}
        <div className="lg:col-span-3 glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">ENVIRONMENTAL PARAMETERS</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Auto-calculate</span>
              <button
                onClick={() => setAutoCalc(!autoCalc)}
                className={`w-8 h-4 rounded-full transition-all ${autoCalc ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${autoCalc ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="space-y-5">
            {FEATURES_CONFIG.map(({ key, label, icon, unit }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white">{features[key]?.toFixed(0)}</span>
                    <span className="text-xs text-slate-500">{unit}</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={features[key] || 0}
                    onChange={e => updateFeature(key, parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${
                        features[key] >= 76 ? '#ef4444' :
                        features[key] >= 51 ? '#f97316' :
                        features[key] >= 26 ? '#eab308' :
                        '#22c55e'
                      } 0%, ${
                        features[key] >= 76 ? '#ef4444' :
                        features[key] >= 51 ? '#f97316' :
                        features[key] >= 26 ? '#eab308' :
                        '#22c55e'
                      } ${features[key]}%, rgba(255,255,255,0.1) ${features[key]}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-700 mt-0.5">
                  <span>LOW</span><span>MEDIUM</span><span>HIGH</span><span>CRITICAL</span>
                </div>
              </div>
            ))}
          </div>

          {!autoCalc && (
            <button
              onClick={() => calculate()}
              disabled={loading}
              className="btn-primary w-full mt-4 justify-center"
            >
              {loading ? 'Calculating...' : 'CALCULATE RISK'}
            </button>
          )}
        </div>

        {/* Result panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Risk gauge */}
          <div className="glass-panel rounded-xl p-5 flex flex-col items-center">
            <div className="section-title mb-4 self-start">SIMULATED RISK</div>
            {result ? (
              <>
                <RiskIndicator score={Math.round(result.risk_score)} size={140} />
                <div className="mt-4 text-center">
                  <div className="text-lg font-bold" style={{ color: riskColor.hex }}>
                    {result.risk_category}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    Probability: {result.probability?.toFixed(0)}%
                  </div>
                </div>
                <div className="w-full mt-4 p-3 rounded-lg text-xs text-center"
                  style={{ background: `${riskColor.hex}10`, borderColor: `${riskColor.hex}20`, border: '1px solid' }}>
                  <div className="text-slate-400">Estimated People at Risk</div>
                  <div className="text-xl font-bold mt-0.5" style={{ color: riskColor.hex }}>
                    {Math.round((features.population_density / 100) * (features.rainfall / 100) * 50000).toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-slate-600">
                <FlaskConical className="w-12 h-12 mb-3" />
                <p className="text-sm">Adjust sliders to simulate</p>
              </div>
            )}
          </div>

          {/* Scenario comparison */}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel rounded-xl p-4 text-xs space-y-3"
            >
              <div className="section-title">RISK FACTOR BREAKDOWN</div>
              {result.top_features?.map(([feat, val]) => {
                const pct = Math.min(100, (val / result.risk_score) * 100)
                return (
                  <div key={feat}>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>{featureLabel(feat)}</span>
                      <span className="font-mono" style={{ color: riskColor.hex }}>+{val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: riskColor.hex, width: `${pct}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Warning */}
              {result.risk_score > 75 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-[11px]">
                    CRITICAL RISK detected. Immediate emergency response recommended under these conditions.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
