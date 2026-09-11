import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import Analytics from './pages/Analytics'
import CitizenReport from './pages/CitizenReport'
import IncidentAnalysis from './pages/IncidentAnalysis'
import Simulator from './pages/Simulator'
import ResponseTeams from './pages/ResponseTeams'
import AlertCenter from './pages/AlertCenter'
import AdminDashboard from './pages/AdminDashboard'
import { DemoContext } from './hooks/useDemoMode'

export default function App() {
  const [demoMode, setDemoMode] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  return (
    <DemoContext.Provider value={{ demoMode, setDemoMode, presentationMode, setPresentationMode }}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1629',
              color: '#f1f5f9',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f1629' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f1629' } },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing onEnter={() => setAuthenticated(true)} />} />
          <Route
            path="/app/*"
            element={
              <Layout presentationMode={presentationMode} setPresentationMode={setPresentationMode}>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="report" element={<CitizenReport />} />
                  <Route path="analysis" element={<IncidentAnalysis />} />
                  <Route path="simulator" element={<Simulator />} />
                  <Route path="teams" element={<ResponseTeams />} />
                  <Route path="alerts" element={<AlertCenter />} />
                  <Route path="admin" element={<AdminDashboard />} />
                </Routes>
              </Layout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DemoContext.Provider>
  )
}
