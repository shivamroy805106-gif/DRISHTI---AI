import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowRight, Play, Activity, Radio, Map, Brain } from 'lucide-react'

const FEATURES = [
  { icon: Radio, title: 'AI/NLP Analysis', desc: 'Natural language incident analysis with hazard classification' },
  { icon: Brain, title: 'ML Risk Scoring', desc: 'RandomForest model generates 0-100 risk scores with explanations' },
  { icon: Map, title: 'Live Risk Map', desc: 'Interactive India map with color-coded incident markers' },
  { icon: Activity, title: 'Priority Engine', desc: 'P1/P2/P3 triage across active incidents nationwide' },
]

export default function Landing({ onEnter }) {
  const navigate = useNavigate()

  const enter = () => {
    onEnter?.()
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.06) 0%, transparent 60%), #0a0d1a' }}
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-blue-500/5 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full border border-cyan-500/5 animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-6">
        {/* Government emblem style */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 relative">
            <Shield className="w-10 h-10 text-blue-400" />
            <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 border border-blue-500" style={{ animationDuration: '3s' }} />
          </div>
          <div className="text-[11px] font-mono text-slate-600 uppercase tracking-[0.4em] mb-2">
            Smart India Hackathon 2024
          </div>
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-6xl font-black tracking-tight mb-2">
            <span className="gradient-text">DRISHTI</span>
            <span className="text-white">-AI</span>
          </h1>
          <div className="text-slate-500 text-sm font-mono uppercase tracking-widest mb-4">
            Disaster Risk Intelligence & Safety Tracking Hub
          </div>
          <p className="text-xl text-slate-300 font-medium mb-2">
            "See the Risk. Predict the Threat. Save Lives."
          </p>
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Turning disaster data into actionable intelligence. AI/ML-powered emergency response platform for India's disaster management authorities.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-4 mt-8"
        >
          <button
            onClick={enter}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40"
          >
            ENTER COMMAND CENTER
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={enter}
            className="flex items-center gap-2 px-6 py-3 border border-blue-500/30 hover:border-blue-500/60 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 text-sm"
          >
            <Play className="w-4 h-4 text-blue-400" />
            VIEW DEMO
          </button>
        </motion.div>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-xs text-slate-600 font-mono"
        >
          Demo credentials: admin / drishti2024 (authentication optional for MVP)
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 w-full"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel rounded-xl p-4 text-left">
              <Icon className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-slate-200 mb-1">{title}</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-8 mt-8 text-center"
        >
          {[['12+', 'Active Incidents'], ['94%', 'AI Confidence'], ['24.8K', 'People Monitored'], ['12', 'Response Teams']].map(([val, label]) => (
            <div key={label}>
              <div className="text-xl font-bold gradient-text">{val}</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Disclaimer footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-700 px-4">
        DRISHTI-AI is a decision-support prototype. Risk predictions and recommendations are AI-generated and should be validated by authorized emergency-management personnel before real-world deployment. Demo data is synthetic.
      </div>
    </div>
  )
}
