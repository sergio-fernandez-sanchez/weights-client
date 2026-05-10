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
import ParticleBackground from './components/ParticleBackground'

export default function App() {
  const [auth, setAuth] = useState(isAuthenticated())
  const [page, setPage] = useState('home')

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        {!auth ? (
          <Auth onLogin={() => setAuth(true)} />
        ) : (
          <div key={page} className="animate-fade-in">
            {page === 'home'          && <Home          onNavigate={setPage} onLogout={() => setAuth(false)} />}
            {page === 'phase'         && <Phase         onNavigate={setPage} />}
            {page === 'report'        && <Report        onNavigate={setPage} />}
            {page === 'data'          && <DataMenu      onNavigate={setPage} />}
            {page === 'weightHistory' && <WeightHistory onNavigate={setPage} />}
            {page === 'currentPhase'  && <CurrentPhase  onNavigate={setPage} />}
            {page === 'reports'       && <Reports       onNavigate={setPage} />}
            {page === 'aiReport'      && <AiReport      onNavigate={setPage} />}
          </div>
        )}
      </div>
    </div>
  )
}