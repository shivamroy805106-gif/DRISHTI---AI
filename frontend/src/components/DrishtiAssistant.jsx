import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react'
import { chatAPI } from '../services/api'

const QUICK_PROMPTS = [
  'Which incident needs immediate response?',
  'How many people are at risk?',
  'What if rainfall increases 30%?',
  'Show me all critical alerts',
]

export default function DrishtiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: '🛡️ **DRISHTI Intelligence** ready.\n\nI monitor active disaster incidents across India and can answer questions about risk levels, response priorities, and what-if scenarios.',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text = input) => {
    const msg = text.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }])
    setLoading(true)
    try {
      const response = await chatAPI.send(msg)
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: response.response, data: response.data }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: '⚠️ Unable to reach backend. Make sure the backend is running on port 8000.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const renderText = (text) => {
    // Simple markdown-like rendering
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <span key={i} dangerouslySetInnerHTML={{ __html: bold }} className="block" />
    })
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center z-50 hover:bg-blue-500 transition-colors ${open ? 'hidden' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open DRISHTI Intelligence Assistant"
      >
        <MessageSquare className="w-5 h-5 text-white" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-navy-900" />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 w-80 h-[480px] glass-panel rounded-2xl flex flex-col z-50 overflow-hidden shadow-2xl"
            style={{ borderColor: 'rgba(59,130,246,0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">DRISHTI Intelligence</div>
                <div className="text-[9px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                  Online
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-slate-500 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] text-xs leading-relaxed rounded-xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600/30 text-slate-200 rounded-br-sm'
                        : 'bg-white/5 text-slate-300 rounded-bl-sm'
                    }`}
                  >
                    {renderText(msg.text)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="bg-white/5 rounded-xl rounded-bl-sm px-3 py-2">
                    <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-3 pb-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="flex-shrink-0 text-[9px] text-slate-500 hover:text-slate-200 border border-white/5 hover:border-blue-500/30 rounded-full px-2 py-1 transition-all whitespace-nowrap"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
              <input
                className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                placeholder="Ask DRISHTI Intelligence..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center disabled:opacity-40 hover:bg-blue-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
