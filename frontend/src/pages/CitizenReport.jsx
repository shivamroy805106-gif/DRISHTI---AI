import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Send, Loader2, CheckCircle, Upload, MapPin } from 'lucide-react'
import { reportsAPI } from '../services/api'
import { RiskIndicator, PageHeader } from '../components/SharedComponents'
import { getRiskColor, DISASTER_ICONS } from '../utils/helpers'
import toast from 'react-hot-toast'

const DISASTER_TYPES = ['flood', 'fire', 'cyclone', 'landslide', 'earthquake', 'drought', 'accident', 'heatwave', 'other']

const defaultForm = {
  name: '',
  phone: '',
  disaster_type: 'flood',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
}

export default function CitizenReport() {
  const [form, setForm] = useState(defaultForm)
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (form.description.length < 10) e.description = 'Description must be at least 10 characters'
    if (!form.location) e.location = 'Location is required'
    if (!form.disaster_type) e.disaster_type = 'Disaster type is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (image) fd.append('image', image)

      const res = await reportsAPI.submit(fd)
      setResult(res)
      setForm(defaultForm)
      setImage(null)
      toast.success('Emergency report submitted!')
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = result ? getRiskColor(result.risk_category) : null

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Report Emergency"
        subtitle="Submit a citizen emergency report — AI will analyze and classify it automatically"
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div className="section-title">REPORTER INFORMATION (Optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Name</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Your name (optional)"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Phone</label>
                <input
                  type="tel"
                  className="input-dark"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div className="section-title">INCIDENT DETAILS</div>

            <div>
              <label className="text-xs text-slate-500 mb-2 block">Disaster Type *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {DISASTER_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, disaster_type: type }))}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize transition-all border ${
                      form.disaster_type === type
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                        : 'border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/15'
                    }`}
                  >
                    {DISASTER_ICONS[type] || '⚠️'} {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Description *</label>
              <textarea
                className={`input-dark h-28 resize-none ${errors.description ? 'border-red-500/50' : ''}`}
                placeholder="Describe what you observed in detail. Include water levels, fire extent, number of people affected, injuries, damage to property..."
                value={form.description}
                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(e => ({ ...e, description: '' })) }}
                maxLength={2000}
              />
              {errors.description && <span className="text-xs text-red-400">{errors.description}</span>}
              <div className="text-[10px] text-slate-600 mt-1 text-right">{form.description.length}/2000</div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Location *</label>
              <input
                type="text"
                className={`input-dark ${errors.location ? 'border-red-500/50' : ''}`}
                placeholder="Village/Town, District, State"
                value={form.location}
                onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setErrors(e => ({ ...e, location: '' })) }}
                maxLength={200}
              />
              {errors.location && <span className="text-xs text-red-400">{errors.location}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Latitude (Optional)</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-dark"
                  placeholder="e.g. 24.8879"
                  value={form.latitude}
                  onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Longitude (Optional)</label>
                <input
                  type="number"
                  step="0.0001"
                  className="input-dark"
                  placeholder="e.g. 85.5443"
                  value={form.longitude}
                  onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Photo Evidence (Optional)</label>
              <div className="relative border border-dashed border-white/10 hover:border-blue-500/30 rounded-lg p-4 text-center cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => setImage(e.target.files[0])}
                />
                {image ? (
                  <div className="text-xs text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {image.name}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                    Click or drag to upload image (JPG, PNG, WebP · max 10MB)
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Submitting & Analyzing...' : 'SUBMIT EMERGENCY REPORT'}
          </button>
        </form>

        {/* Result / Info */}
        <div className="space-y-4">
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-xl p-5"
                style={{ borderColor: `${riskColor.hex}30` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-green-400">Report Received & Analyzed</span>
                </div>
                <div className="flex items-center gap-5 mb-4">
                  <RiskIndicator score={Math.round(result.risk_score || 0)} size={90} />
                  <div className="space-y-2 text-xs">
                    {[
                      ['Report ID', result.report_id],
                      ['AI Classification', result.ai_classification],
                      ['Priority', result.priority],
                      ['Status', result.status],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <span className="text-slate-500">{label}: </span>
                        <span className="font-bold text-slate-200">{val}</span>
                      </div>
                    ))}
                    {result.incident_id && (
                      <div>
                        <span className="text-slate-500">Linked Incident: </span>
                        <span className="font-bold text-blue-400 font-mono">{result.incident_id}</span>
                      </div>
                    )}
                  </div>
                </div>
                {result.status === 'CLUSTERED' && (
                  <div className="text-xs p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    🤖 AI detected this report matches an existing incident cluster. Report consolidated.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info panel */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div className="section-title">HOW IT WORKS</div>
            {[
              ['1', 'Submit Report', 'Your report is received securely by DRISHTI-AI'],
              ['2', 'AI Analysis', 'NLP engine extracts hazard type, severity, and affected population'],
              ['3', 'Risk Scoring', 'ML model generates a 0-100 risk score with explanation'],
              ['4', 'Deduplication', 'AI checks for duplicate reports and clusters similar incidents'],
              ['5', 'Response', 'Priority engine triggers appropriate emergency response recommendations'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {num}
                </span>
                <div className="text-xs">
                  <div className="font-semibold text-slate-300">{title}</div>
                  <div className="text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-xl p-4 text-[10px] text-slate-600">
            <strong className="text-slate-500">Privacy Note:</strong> Name and phone are optional. Report data is used only for emergency response coordination. This is a demo system — do not submit real emergency reports here.
          </div>
        </div>
      </div>
    </div>
  )
}
