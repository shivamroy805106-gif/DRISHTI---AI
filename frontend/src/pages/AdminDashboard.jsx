import { useState, useEffect, useCallback } from 'react'
import { Settings, Trash2, Edit, AlertTriangle, Shield, Clock, Plus, X } from 'lucide-react'
import { incidentsAPI, teamsAPI } from '../services/api'
import { PageHeader, LoadingSpinner } from '../components/SharedComponents'
import { formatTimeAgo } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('incidents')
  const [incidents, setIncidents] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    location: '', state: '', disaster_type: 'fire', description: '',
    latitude: '', longitude: '', affected_population: ''
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [incs, tms] = await Promise.all([
        incidentsAPI.getAll(),
        teamsAPI.getAll(),
      ])
      setIncidents(incs)
      setTeams(tms)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteIncident = async (id, incident_id) => {
    if (!window.confirm(`Are you sure you want to delete incident ${incident_id}?`)) return
    try {
      await incidentsAPI.delete(incident_id)
      toast.success('Incident deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete incident')
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        affected_population: parseInt(formData.affected_population) || 0
      }
      await incidentsAPI.create(payload)
      toast.success('Incident added successfully')
      setShowAddForm(false)
      setFormData({
        location: '', state: '', disaster_type: 'fire', description: '',
        latitude: '', longitude: '', affected_population: ''
      })
      loadData()
    } catch (err) {
      toast.error('Failed to add incident')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Panel"
        subtitle="Manage system data and configurations"
        icon={Settings}
      />

      <div className="flex gap-4 border-b border-white/10 pb-2">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'incidents' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('incidents')}
        >
          Manage Incidents
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'teams' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('teams')}
        >
          Manage Teams
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading admin data..." />
      ) : (
        <div className="glass-panel p-4 rounded-xl overflow-x-auto">
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-300">Active Incidents</h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                >
                  {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showAddForm ? 'Cancel' : 'Add Incident'}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddSubmit} className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Location (e.g. Jaipur, Rajasthan)" className="input-field" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    <input type="text" placeholder="State" className="input-field" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                    <select className="input-field bg-navy-900" required value={formData.disaster_type} onChange={e => setFormData({...formData, disaster_type: e.target.value})}>
                      <option value="flood">Flood</option>
                      <option value="fire">Fire</option>
                      <option value="cyclone">Cyclone</option>
                      <option value="landslide">Landslide</option>
                      <option value="earthquake">Earthquake</option>
                      <option value="drought">Drought</option>
                      <option value="accident">Accident</option>
                    </select>
                    <input type="number" placeholder="Affected Population" className="input-field" required value={formData.affected_population} onChange={e => setFormData({...formData, affected_population: e.target.value})} />
                    <input type="number" step="any" placeholder="Latitude" className="input-field" required value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                    <input type="number" step="any" placeholder="Longitude" className="input-field" required value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                  </div>
                  <textarea placeholder="Description" className="input-field w-full" rows="2" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors">
                    Save Incident
                  </button>
                </form>
              )}

            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-white/10 text-xs uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{inc.incident_id}</td>
                    <td className="px-4 py-3">{inc.location}</td>
                    <td className="px-4 py-3 capitalize">{inc.disaster_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        inc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">{inc.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteIncident(inc.id, inc.incident_id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="Delete Incident"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">No incidents found</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}

          {activeTab === 'teams' && (
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-white/10 text-xs uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3">Team ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{team.team_id}</td>
                    <td className="px-4 py-3 font-medium">{team.team_name}</td>
                    <td className="px-4 py-3">{team.team_type}</td>
                    <td className="px-4 py-3">{team.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        team.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' :
                        team.status === 'DEPLOYED' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {team.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">No teams found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
