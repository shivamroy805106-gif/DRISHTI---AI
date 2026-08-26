import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Send, Loader2, AlertTriangle, CheckCircle, Brain } from 'lucide-react'
import { analysisAPI } from '../services/api'
import { RiskIndicator, FeatureBar, PageHeader } from '../components/SharedComponents'
import { getRiskColor, featureLabel, DISASTER_ICONS } from '../utils/helpers'
import toast from 'react-hot-toast'

const SAMPLE_TEXTS = [
  'Heavy rainfall in Nawada, Bihar for the last 6 hours. River water is rising rapidly and approximately 350 people are affected. The situation is critical.',
  'Forest fire spreading in Nashik forest range. Strong winds pushing fire towards residential areas. Around 200 families need evacuation.',
  'Landslide blocked NH-07 near Chamoli, Uttarakhand. Several vehicles are trapped. Continuous rainfall is increasing instability. 450 tourists stranded.',
  'Cyclone depression intensifying in Bay of Bengal near Puri coast. Fishermen warned. Wind speed 110 kmph. 12000 coastal residents at risk.',
]

export default function IncidentAnalysis() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!text.trim() || text.length < 10) {
      toast.error('Please enter at least 10 characters')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await analysisAPI.analyzeText(text)
      setResult(res)
      toast.success('AI analysis complete!')
    } catch {
      toast.error('Analysis failed. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = result ? getRiskColor(result.risk_category) : null
  const topContribs = result
    ? Object.entries(result.feature_contributions || {}).sort((a, b) => b[1] - a[1]).slice(0, 6)
    : []
  const maxContrib = topContribs[0]?.[1] || 30

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="AI Incident Analysis"
        subtitle="NLP-powered hazard classification and risk assessment from free-text reports"
        icon={Radio}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <div className="section-title mb-3">INCIDENT TEXT REPORT</div>
            <textarea
              className="input-dark w-full h-44 resize-none leading-relaxed"
              placeholder="Enter incident description in natural language...

Example: Heavy rainfall in village X for the last 6 hours. River water is rising rapidly and approximately 350 people are affected."
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={5000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-600">{text.length}/5000</span>
              <button
                onClick={analyze}
                disabled={loading || text.length < 10}
                className="btn-primary"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                {loading ? 'Analyzing...' : 'ANALYZE WITH AI'}
              </button>
            </div>
          </div>

          {/* Sample texts */}
          <div className="glass-panel rounded-xl p-4">
            <div className="section-title mb-3">SAMPLE REPORTS</div>
            <div className="space-y-2">
              {SAMPLE_TEXTS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setText(sample)}
                  className="w-full text-left text-xs text-slate-400 hover:text-slate-200 bg-white/3 hover:bg-white/5 rounded-lg p-3 transition-all border border-white/5 hover:border-blue-500/20 line-clamp-2"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* API info */}
          <div className="glass-panel rounded-xl p-4 text-xs text-slate-500">
            <div className="font-mono text-blue-400 mb-2">POST /api/analyze-incident</div>
            <div className="text-slate-600">
              Extracts hazard type, location, affected population, severity, and urgency from
              free-text using NLP keyword matching and ML risk scoring.
            </div>
          </div>
        </div>

        {/* Result panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Classification result */}
              <div className="glass-panel rounded-xl p-5" style={{ borderColor: `${riskColor.hex}25` }}>
                <div className="section-title mb-4">AI CLASSIFICATION RESULT</div>
                <div className="flex items-center gap-5">
                  <RiskIndicator score={Math.round(result.risk_score)} size={100} />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{DISASTER_ICONS[result.detected_hazard] || '⚠️'}</span>
                      <div>
                        <div className="text-sm font-bold text-white capitalize">{result.detected_hazard}</div>
                        <div className="text-[10px] text-slate-500">
                          Confidence: {result.hazard_confidence?.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-slate-500">Severity: </span><span className="font-bold" style={{ color: riskColor.hex }}>{result.severity}</span></div>
                      <div><span className="text-slate-500">Urgency: </span><span className="text-slate-300 capitalize">{result.urgency}</span></div>
                      <div><span className="text-slate-500">Affected: </span><span className="text-slate-300">{result.affected_population.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">Probability: </span><span className="text-slate-300">{result.probability}%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature contributions */}
              <div className="glass-panel rounded-xl p-5">
                <div className="section-title mb-3">WHY IS THIS HIGH RISK? (XAI)</div>
                <div className="space-y-2.5">
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
                <div className="flex justify-end mt-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    TOTAL RISK: {result.risk_score?.toFixed(0)}/100
                  </span>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="glass-panel rounded-xl p-4">
                <div className="section-title mb-2">AI EXPLANATION</div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.ai_explanation}</p>
                <p className="text-[10px] text-slate-600 mt-2 italic">
                  AI-generated analysis based on available incident and environmental data.
                </p>
              </div>

              {/* Recommendations */}
              <div className="glass-panel rounded-xl p-4">
                <div className="section-title mb-3">RECOMMENDED ACTIONS</div>
                <div className="space-y-1.5">
                  {result.recommended_actions?.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <span className="text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {!result && !loading && (
            <div className="glass-panel rounded-xl flex items-center justify-center h-64">
              <div className="text-center">
                <Brain className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <div className="text-slate-500 text-sm">Enter an incident description</div>
                <div className="text-xs text-slate-600 mt-1">AI will classify hazard, calculate risk, and generate recommendations</div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
