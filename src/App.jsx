import { useState, useEffect, useRef, useCallback } from 'react'
import { isAuthenticated } from './api/client'
import { PhaseProvider, usePhase } from './context/PhaseContext'
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
import WeeklyReportHistory from './pages/WeeklyReportHistory'
import NewReport from './pages/NewReport'
import NewBioimpedanceReport from './pages/NewBioimpedanceReport'
import NewDexaReport from './pages/NewDexaReport'
import NewBodyMeasurement from './pages/NewBodyMeasurement'
import BioimpedanceReports from './pages/BioimpedanceReports'
import DexaReports from './pages/DexaReports'
import BodyMeasurements from './pages/BodyMeasurements'
import PhaseComparison from './pages/PhaseComparison'
import MonthlySummary from './pages/MonthlySummary'
import ParticleBackground from './components/ParticleBackground'

function GlitchTransition({ onMidpoint, onDone, color }) {
  const overlayRef = useRef(null)
  const midpointFired = useRef(false)

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    const SLICES = 6
    const STEP_DUR = 80
    let step = 0

    const slices = Array.from({ length: SLICES }, () => {
      const div = document.createElement('div')
      div.style.cssText = 'position:absolute;left:0;right:0;pointer-events:none;'
      el.appendChild(div)
      return div
    })

    function tick() {
      step++
      if (step <= 3) {
        const pageEl = el.parentElement.querySelector('[data-page-content]')
        if (pageEl) {
          const offset = (Math.random() - 0.5) * 24
          pageEl.style.transform = `translateX(${offset}px)`
          pageEl.style.opacity = step === 3 ? '0.4' : String(1 - step * 0.15)
        }
        slices.forEach((s, i) => {
          const top = (i / SLICES) * 100
          const h = (1 / SLICES) * 100
          const xShift = (Math.random() - 0.5) * 40
          const isAccent = Math.random() > 0.5
          s.style.top = `${top}%`
          s.style.height = `${h}%`
          s.style.transform = `translateX(${xShift}px)`
          s.style.background = isAccent
            ? `${color}${Math.floor((0.03 + Math.random() * 0.08) * 255).toString(16).padStart(2, '0')}`
            : `rgba(255,255,255,${0.01 + Math.random() * 0.03})`
          s.style.borderTop = Math.random() > 0.7 ? `1px solid ${color}25` : 'none'
        })
      } else if (step === 4) {
        if (!midpointFired.current) {
          midpointFired.current = true
          const pageEl = el.parentElement.querySelector('[data-page-content]')
          if (pageEl) { pageEl.style.transform = ''; pageEl.style.opacity = '0' }
          onMidpoint()
        }
        slices.forEach(s => {
          s.style.transform = 'translateX(0)'
          s.style.background = `${color}0a`
          s.style.borderTop = 'none'
        })
      } else if (step === 5) {
        const pageEl = el.parentElement.querySelector('[data-page-content]')
        if (pageEl) {
          pageEl.style.transition = 'opacity 200ms ease-out, transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
          pageEl.style.opacity = '1'
          pageEl.style.transform = 'translateY(0)'
        }
        slices.forEach(s => { s.style.background = 'transparent'; s.style.borderTop = 'none' })
      } else {
        slices.forEach(s => s.remove())
        const pageEl = el.parentElement.querySelector('[data-page-content]')
        if (pageEl) { pageEl.style.transition = ''; pageEl.style.transform = ''; pageEl.style.opacity = '' }
        onDone()
        return
      }
      setTimeout(tick, STEP_DUR)
    }

    const raf = requestAnimationFrame(() => tick())
    return () => cancelAnimationFrame(raf)
  }, [])

  return <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />
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
    case 'weeklyReportHistory': return <WeeklyReportHistory  onNavigate={navigate} />
    case 'newReport':           return <NewReport            onNavigate={navigate} />
    case 'newBioimpedance':     return <NewBioimpedanceReport onNavigate={navigate} />
    case 'newDexa':             return <NewDexaReport        onNavigate={navigate} />
    case 'newBodyMeasurement':  return <NewBodyMeasurement   onNavigate={navigate} />
    case 'bioimpedanceReports': return <BioimpedanceReports  onNavigate={navigate} />
    case 'dexaReports':         return <DexaReports          onNavigate={navigate} />
    case 'bodyMeasurements':    return <BodyMeasurements     onNavigate={navigate} />
    case 'phaseComparison':     return <PhaseComparison      onNavigate={navigate} />
    case 'monthlySummary':      return <MonthlySummary       onNavigate={navigate} />
    default:                    return <Home                 onNavigate={navigate} onLogout={handleLogout} />
  }
}

function AppInner() {
  const [auth, setAuth]           = useState(isAuthenticated())
  const [page, setPage]           = useState('home')
  const [pageData, setPageData]   = useState(null)
  const [nextPage, setNextPage]   = useState(null)
  const [nextData, setNextData]   = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const { phaseColor, refreshPhase } = usePhase()

  function navigate(newPage, data = null) {
    if (transitioning) return
    window.history.pushState({ page: newPage, data }, '', '')
    setNextPage(newPage)
    setNextData(data)
    setTransitioning(true)
  }

  const handleMidpoint = useCallback(() => {
    setPage(nextPage)
    setPageData(nextData)
    setNextPage(null)
    setNextData(null)
    window.scrollTo(0, 0)
  }, [nextPage, nextData])

  const handleDone = useCallback(() => { setTransitioning(false) }, [])

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        {!auth ? (
          <Auth onLogin={() => { setAuth(true); refreshPhase(); window.history.replaceState({ page: 'home', data: null }, '', '') }} />
        ) : (
          <>
            <div data-page-content>
              {renderPage(page, pageData, navigate, handleLogout)}
            </div>
            {transitioning && (
              <GlitchTransition onMidpoint={handleMidpoint} onDone={handleDone} color={phaseColor} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <PhaseProvider>
      <AppInner />
    </PhaseProvider>
  )
}