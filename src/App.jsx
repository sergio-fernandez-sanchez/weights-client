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

export default function App() {
  const [auth, setAuth] = useState(isAuthenticated())
  const [page, setPage] = useState('home')

  if (!auth) return <Auth onLogin={() => setAuth(true)} />

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {page === 'home'          && <Home          onNavigate={setPage} onLogout={() => setAuth(false)} />}
      {page === 'phase'         && <Phase         onNavigate={setPage} />}
      {page === 'report'        && <Report        onNavigate={setPage} />}
      {page === 'data'          && <DataMenu      onNavigate={setPage} />}
      {page === 'weightHistory' && <WeightHistory onNavigate={setPage} />}
      {page === 'currentPhase'  && <CurrentPhase  onNavigate={setPage} />}
      {page === 'reports'       && <Reports       onNavigate={setPage} />}
    </div>
  )
}