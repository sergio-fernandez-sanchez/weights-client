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

function ScanTransition({ onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const parent = cvs.parentElement
    const W = parent.offsetWidth
    const H = parent.offsetHeight
    cvs.width = W
    cvs.height = H
    const ctx = cvs.getContext('2d')
    const start = performance.now()
    const dur = 700
    const chars = '01アイウエオカキ10█▓▒░'.split('')
    const rain = Array.from({length: 25}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      char: chars[Math.floor(Math.random() * chars.length)],
    }))
    const strips = Array.from({length: 10}, () => ({
      y: Math.random() * H,
      h: 2 + Math.random() * 7,
      dx: (Math.random() - 0.5) * 28,
      alpha: 0.3 + Math.random() * 0.4,
    }))

    let raf
    function frame(now) {
      const t = Math.min((now - start) / dur, 1)
      const scanY = t * (H + 80) - 40
      ctx.clearRect(0, 0, W, H)

      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, 0, W, scanY - 30)

      for (let i = 0; i < 5; i++) {
        const by = scanY - 2 - i * 3
        const a = (1 - i / 5) * 0.12
        ctx.fillStyle = `rgba(0,200,255,${a})`
        ctx.fillRect(-3, by, W, 2)
        ctx.fillStyle = `rgba(255,0,80,${a})`
        ctx.fillRect(3, by, W, 2)
      }

      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 12)
      grad.addColorStop(0,    'rgba(200,245,0,0)')
      grad.addColorStop(0.4,  'rgba(200,245,0,0.07)')
      grad.addColorStop(0.75, 'rgba(200,245,0,0.5)')
      grad.addColorStop(0.85, 'rgba(255,255,255,0.85)')
      grad.addColorStop(1,    'rgba(200,245,0,0.15)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 40, W, 52)

      ctx.fillStyle = 'rgba(220,255,100,1)'
      ctx.fillRect(0, scanY, W, 1.5)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillRect(0, scanY + 1, W, 0.5)

      for (let gy = 0; gy < scanY; gy += 20) {
        const a = Math.max(0, 0.05 - (scanY - gy) / (H * 2))
        ctx.strokeStyle = `rgba(200,245,0,${a})`
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }

      strips.forEach(s => {
        const dist = Math.abs(s.y - scanY)
        if (dist < 80) {
          const a = s.alpha * (1 - dist / 80)
          ctx.fillStyle = `rgba(200,245,0,${a * 0.35})`
          ctx.fillRect(s.dx, s.y, W, s.h)
          ctx.fillStyle = `rgba(0,200,255,${a * 0.18})`
          ctx.fillRect(s.dx + 4, s.y, W, s.h * 0.5)
          ctx.fillStyle = `rgba(255,0,80,${a * 0.18})`
          ctx.fillRect(s.dx - 4, s.y, W, s.h * 0.5)
        }
      })

      ctx.font = '9px Courier New'
      rain.forEach(r => {
        const dist = Math.abs(r.y - scanY)
        if (dist < 100) {
          const a = (1 - dist / 100) * 0.55
          ctx.fillStyle = `rgba(200,245,0,${a})`
          ctx.fillText(r.char, r.x, r.y)
          if (Math.random() > 0.88) r.char = chars[Math.floor(Math.random() * chars.length)]
        }
      })

      const edgeA = 0.07 * (1 - Math.abs(t - 0.5) * 2)
      const eg = ctx.createLinearGradient(0, 0, W, 0)
      eg.addColorStop(0,    `rgba(200,245,0,${edgeA})`)
      eg.addColorStop(0.04, 'rgba(200,245,0,0)')
      eg.addColorStop(0.96, 'rgba(200,245,0,0)')
      eg.addColorStop(1,    `rgba(200,245,0,${edgeA})`)
      ctx.fillStyle = eg
      ctx.fillRect(0, 0, W, H)

      if (t < 1) {
        raf = requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, W, H)
        onDone()
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}
    />
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
  const [transitioning, setTransitioning] = useState(false)

  function navigate(newPage, data = null) {
    if (transitioning) return
    window.history.pushState({ page: newPage, data }, '', '')
    setNextPage(newPage)
    setNextData(data)
    setTransitioning(true)
  }

  function handleTransitionDone() {
    setPage(nextPage)
    setPageData(nextData)
    setTransitioning(false)
    setNextPage(null)
    setNextData(null)
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        {!auth ? (
          <Auth onLogin={() => { setAuth(true); window.history.replaceState({ page: 'home', data: null }, '', '') }} />
        ) : (
          <>
            {renderPage(page, pageData, navigate, handleLogout)}
            {transitioning && <ScanTransition onDone={handleTransitionDone} />}
          </>
        )}
      </div>
    </div>
  )
}