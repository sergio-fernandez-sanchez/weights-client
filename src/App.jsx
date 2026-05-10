import { useState } from 'react'
import { isAuthenticated } from './api/client'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Phase from './pages/Phase'
import Report from './pages/Report'
import DataMenu from './pages/DataMenu'
import WeightHistory from './pages/WeightHistory'
import CurrentPhase from './pages/CurrentPhase'
import Reports from './pages/Reports'
import AiReport from './pages/AiReport'
import EditPhaseGoals from './pages/EditPhaseGoals'
import ParticleBackground from './components/ParticleBackground'

export default function App() {
  const [auth, setAuth] = useState(isAuthenticated())
  const [page, setPage] = useState('home')
  const [pageData, setPageData] = useState(null)

  function navigate(newPage, data = null) {
    setPage(newPage)
    setPageData(data)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        {!auth ? (
          <Auth onLogin={() => setAuth(true)} />
        ) : (
          <div key={page} className="animate-fade-in">
            {page === 'home'            && <Home            onNavigate={navigate} onLogout={() => setAuth(false)} />}
            {page === 'phase'           && <Phase           onNavigate={navigate} />}
            {page === 'report'          && <Report          onNavigate={navigate} />}
            {page === 'data'            && <DataMenu        onNavigate={navigate} />}
            {page === 'weightHistory'   && <WeightHistory   onNavigate={navigate} />}
            {page === 'currentPhase'    && <CurrentPhase    onNavigate={navigate} />}
            {page === 'reports'         && <Reports         onNavigate={navigate} />}
            {page === 'aiReport'        && <AiReport        onNavigate={navigate} />}
            {page === 'editPhaseGoals'  && <EditPhaseGoals  onNavigate={navigate} phase={pageData} />}
          </div>
        )}
      </div>
    </div>
  )
}