import { createContext, useContext, useState, useEffect } from 'react'

export const DemoContext = createContext({ demoMode: false, setDemoMode: () => {} })

export function useDemoMode() {
  return useContext(DemoContext)
}

export function useAutoRefresh(callback, interval = 30000, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(callback, interval)
    return () => clearInterval(id)
  }, [callback, interval, enabled])
}
