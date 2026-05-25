import { useState, useEffect, useRef } from 'react'
import { isAuthenticated } from './api/client'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Phase from './pages/Phase'
import DataMenu from './pages/DataMenu'
import WeightHistory from './pages/WeightHistory'
import CurrentPhase from './pages/CurrentPhase'
import AiReport from './pages/AiReport'
import EditPhaseGoals from './pages/EditPhaseGoals'
import Calories from './pages/Calories'
import Gym from './pages/Gym'
import GymHistory from './pages/GymHistory'
import CaloriesHistory from './pages/CaloriesHistory'
import Profile from './pages/Profile'
import WeeklyReport from './pages/WeeklyReport'
import NewReport from './pages/NewReport'
import NewBioimpedanceReport from './pages/NewBioimpedanceReport'
import NewDexaReport from './pages/NewDexaReport'
import NewBodyMeasurement from './pages/NewBodyMeasurement'
import BioimpedanceReports from './pages/BioimpedanceReports'
import DexaReports from './pages/DexaReports'
import BodyMeasurements from './pages/BodyMeasurements'
import ParticleBackground from './components/ParticleBackground'

// ── Transición entre páginas ────────────────────────────────────────────────
// Fade out la página actual, línea horizontal verde que cruza, fade in la nueva
function PageTransition({ phase, onMidpoint, onDone }) {
  const lineRef = useRef(null)

  useEffect(() => {
    if (phase === 'out') {
      // Fade out dura 180ms, luego notificamos el midpoint
      const timer = setTimeout(() => {
        onMidpoint()
      }, 180)
      return () => clearTimeout(timer)
    }
    if (phase === 'in') {
      // Fade in dura 280ms, luego terminamos
      const timer = setTimeout(() => {
        onDone()
      }, 280)
      return () => clearTimeout(timer)
    }
  }, [phase])

  return (
    <>
      {/* Línea horizontal que cruza durante la transición */}
      <div
        className="fixed left-0 right-0 h-[2px] pointer-events-none"
        style={{
          top: '50%',
          zIndex: 9999,
          background: 'linear-gradient(90deg, transparent 0%, #c8f500 30%, #ffffff 50%, #c8f500 70%, transparent 100%)',
          opacity: phase === 'out' ? 1 : 0,
          transform: phase === 'out' ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease',
          transformOrigin: 'left',
          boxShadow: '0 0 20px rgba(200, 245, 0, 0.6), 0 0 40px rgba(200, 245, 0, 0.3)',
        }}
      />
      {/* Flash sutil verde */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9998,
          background: 'radial-gradient(ellipse at center, rgba(200, 245, 0, 0.04) 0%, transparent 70%)',
          opacity: phase === 'out' ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      />
    </>
  )
}

function renderPage(page, pageData, navigate, handleLogout) {
  switch (page) {
    case 'home':                return <Home                 onNavigate={navigate} onLogout={handleLogout} />
    case 'phase':               return <Phase                onNavigate={navigate} />
    case 'data':                return <DataMenu             onNavigate={navigate} />
    case 'weightHistory':       return <WeightHistory        onNavigate={navigate} />
    case 'currentPhase':        return <CurrentPhase         onNavigate={navigate} />
    case 'aiReport':            return <AiReport             onNavigate={navigate} />
    case 'editPhaseGoals':      return <EditPhaseGoals       onNavigate={navigate} phase={pageData} />
    case 'calories':            return <Calories             onNavigate={navigate} currentCalories={pageData} />
    case 'gym':                 return <Gym                  onNavigate={navigate} />
    case 'gymHistory':          return <GymHistory           onNavigate={navigate} />
    case 'caloriesHistory':     return <CaloriesHistory      onNavigate={navigate} />
    case 'profile':             return <Profile              onNavigate={navigate} />
    case 'weeklyReport':        return <WeeklyReport         onNavigate={navigate} initialWeekStart={pageData} />
    case 'newReport':           return <NewReport            onNavigate={navigate} />
    case 'newBioimpedance':     return <NewBioimpedanceReport onNavigate={navigate} />
    case 'newDexa':             return <NewDexaReport        onNavigate={navigate} />
    case 'newBodyMeasurement':  return <NewBodyMeasurement   onNavigate={navigate} />
    case 'bioimpedanceReports': return <BioimpedanceReports  onNavigate={navigate} />
    case 'dexaReports':         return <DexaReports          onNavigate={navigate} />
    case 'bodyMeasurements':    return <BodyMeasurements     onNavigate={navigate} />
    default:                    return <Home                 onNavigate={navigate} onLogout={handleLogout} />
  }
}

export default function App() {
  const [auth, setAuth]           = useState(isAuthenticated())
  const [page, setPage]           = useState('home')
  const [pageData, setPageData]   = useState(null)
  const [nextPage, setNextPage]   = useState(null)
  const [nextData, setNextData]   = useState(null)
  // 'idle' | 'out' | 'in'
  const [transitionPhase, setTransitionPhase] = useState('idle')

  function navigate(newPage, data = null) {
    if (transitionPhase !== 'idle') return
    window.history.pushState({ page: newPage, data }, '', '')
    setNextPage(newPage)
    setNextData(data)
    setTransitionPhase('out')
  }

  function handleMidpoint() {
    // Swap pages at the midpoint (screen is faded out)
    setPage(nextPage)
    setPageData(nextData)
    setNextPage(null)
    setNextData(null)
    // Scroll to top
    window.scrollTo(0, 0)
    // Start fade in
    setTransitionPhase('in')
  }

  function handleTransitionDone() {
    setTransitionPhase('idle')
  }

  function handleLogout() {
    setAuth(false)
    window.history.replaceState({ page: 'home', data: null }, '', '')
  }

  useEffect(() => {
    window.history.replaceState({ page: 'home', data: null }, '', '')
    function handlePopState(e) {
      if (e.state) { setPage(e.state.page); setPageData(e.state.data) }
      else { setPage('home'); setPageData(null) }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Page container opacity based on transition phase
  const pageStyle = {
    opacity: transitionPhase === 'out' ? 0 : 1,
    transform: transitionPhase === 'out' ? 'translateY(-6px)' : transitionPhase === 'in' ? 'translateY(0)' : 'translateY(0)',
    transition: transitionPhase === 'out'
      ? 'opacity 180ms ease-out, transform 180ms ease-out'
      : transitionPhase === 'in'
        ? 'opacity 280ms ease-out, transform 280ms cubic-bezier(0.16, 1, 0.3, 1)'
        : 'none',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        {!auth ? (
          <Auth onLogin={() => { setAuth(true); window.history.replaceState({ page: 'home', data: null }, '', '') }} />
        ) : (
          <>
            <div style={pageStyle}>
              {renderPage(page, pageData, navigate, handleLogout)}
            </div>
            {transitionPhase !== 'idle' && (
              <PageTransition
                phase={transitionPhase}
                onMidpoint={handleMidpoint}
                onDone={handleTransitionDone}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}