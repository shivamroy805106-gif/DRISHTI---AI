import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, BarChart3, AlertTriangle, Users,
  Radio, FlaskConical, Bell, FileText, Shield, Maximize,
  Minimize, Activity, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import { useState } from 'react'
import { useDemoMode } from '../hooks/useDemoMode'
import DrishtiAssistant from './DrishtiAssistant'

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/app/map', icon: Map, label: 'Live Risk Map' },
  { to: '/app/alerts', icon: Bell, label: 'Alert Center', badge: true },
  { to: '/app/analysis', icon: Radio, label: 'AI Analysis' },
  { to: '/app/simulator', icon: FlaskConical, label: 'What-If Simulator' },
  { to: '/app/report', icon: FileText, label: 'Report Emergency' },
  { to: '/app/teams', icon: Users, label: 'Response Teams' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Layout({ children, presentationMode, setPresentationMode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { demoMode, setDemoMode } = useDemoMode()

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2 }}
        className="relative flex flex-col border-r"
        style={{
          background: 'rgba(10, 13, 26, 0.98)',
          borderColor: 'rgba(59, 130, 246, 0.1)',
          minWidth: collapsed ? 64 : 220,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-sm font-bold text-white leading-none">DRISHTI-AI</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">Intelligence Hub</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item mb-0.5 ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {badge && !collapsed && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="border-t px-2 py-3 space-y-1.5" style={{ borderColor: 'rgba(59, 130, 246, 0.1)' }}>
          {/* Demo mode toggle */}
          {!collapsed && (
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                demoMode
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              DEMO MODE
              <span className={`ml-auto w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            </button>
          )}

          {/* Presentation mode */}
          <button
            onClick={() => setPresentationMode(!presentationMode)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title="Presentation Mode"
          >
            {presentationMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            {!collapsed && 'Presentation'}
          </button>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>

        {/* Live status dot */}
        <div className={`absolute top-4 right-3 flex items-center gap-1 ${collapsed ? 'hidden' : ''}`}>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b"
          style={{
            background: 'rgba(10, 13, 26, 0.9)',
            borderColor: 'rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">LIVE DISASTER INTELLIGENCE COMMAND CENTER</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-slate-600">
              IST {new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })}
            </span>
            {demoMode && (
              <span className="demo-badge">
                <Zap className="w-2.5 h-2.5" />
                DEMO DATA
              </span>
            )}
            {presentationMode && (
              <span className="text-[10px] font-mono text-blue-400 border border-blue-500/30 rounded px-2 py-0.5 uppercase">
                Presentation Mode
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className={`${presentationMode ? 'p-6' : 'p-5'} min-h-full`}>
            {children}
          </div>
        </main>
      </div>

      {/* AI Assistant (floating) */}
      <DrishtiAssistant />
    </div>
  )
}
