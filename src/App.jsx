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
    const dpr = window.devicePixelRatio || 1
    const W = window.innerWidth
    const H = window.innerHeight
    cvs.width  = W * dpr
    cvs.height = H * dpr
    cvs.style.width  = W + 'px'
    cvs.style.height = H + 'px'
    const ctx = cvs.getContext('2d')
    ctx.scale(dpr, dpr)

    const start = performance.now()
    const dur = 500

    // partículas emitidas desde la línea de scan
    const particles = []

    let raf
    function frame(now) {
      const t = Math.min((now - start) / dur, 1)
      const scanY = t * (H + 60) - 30
      ctx.clearRect(0, 0, W, H)

      // ── grid de cuadrados dinámico ──────────────────────────────────
      const cellSize = 28
      const cols = Math.ceil(W / cellSize)
      const rows = Math.ceil(H / cellSize)
      for (let row = 0; row < rows; row++) {
        const cellY = row * cellSize
        const distToScan = Math.abs(cellY - scanY)
        // intensidad según distancia al scan
        let a = 0.04 // base muy sutil
        if (distToScan < 200) {
          a = 0.04 + (1 - distToScan / 200) * 0.5
        }
        // pulso aleatorio en algunas celdas cerca del scan
        for (let col = 0; col < cols; col++) {
          const cellX = col * cellSize
          let cellA = a
          // celdas brillantes aleatorias dentro del rango del scanner
          if (distToScan < 100 && Math.random() > 0.92) {
            cellA = 0.9
            ctx.fillStyle = `rgba(200,245,0,0.15)`
            ctx.fillRect(cellX, cellY, cellSize, cellSize)
          }
          ctx.strokeStyle = `rgba(200,245,0,${cellA})`
          ctx.lineWidth = 0.5
          ctx.strokeRect(cellX, cellY, cellSize, cellSize)
        }
      }

      // ── aberración cromática suave ──────────────────────────────────
      for (let i = 0; i < 5; i++) {
        const by = scanY - 2 - i * 3
        const a = (1 - i / 5) * 0.2
        ctx.fillStyle = `rgba(0,200,255,${a})`
        ctx.fillRect(-4, by, W + 8, 1.5)
        ctx.fillStyle = `rgba(255,0,80,${a})`
        ctx.fillRect(4, by, W + 8, 1.5)
      }

      // ── beam glow ───────────────────────────────────────────────────
      const grad = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 10)
      grad.addColorStop(0,    'rgba(200,245,0,0)')
      grad.addColorStop(0.5,  'rgba(200,245,0,0.25)')
      grad.addColorStop(0.85, 'rgba(255,255,255,0.95)')
      grad.addColorStop(1,    'rgba(200,245,0,0.3)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 50, W, 60)

      // ── línea principal nítida ──────────────────────────────────────
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(0, scanY, W, 1)
      ctx.fillStyle = 'rgba(220,255,100,1)'
      ctx.fillRect(0, scanY + 1, W, 2)

      // ── partículas emitidas ─────────────────────────────────────────
      if (Math.random() > 0.4) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: Math.random() * W,
            y: scanY,
            vx: (Math.random() - 0.5) * 3,
            vy: 1 + Math.random() * 4,
            life: 1,
            decay: 0.04,
            size: 1 + Math.random() * 2,
            color: Math.random() > 0.4 ? '200,245,0' : '255,255,255',
          })
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= p.decay
        p.x += p.vx; p.y += p.vy
        p.vy += 0.1
        if (p.life > 0) {
          ctx.fillStyle = `rgba(${p.color},${p.life})`
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill()
        } else {
          particles.splice(i, 1)
        }
      }

      // ── edge glow lateral ───────────────────────────────────────────
      const edgeA = 0.15 * (1 - Math.abs(t - 0.5) * 2)
      const eg = ctx.createLinearGradient(0, 0, W, 0)
      eg.addColorStop(0,    `rgba(200,245,0,${edgeA})`)
      eg.addColorStop(0.06, 'rgba(200,245,0,0)')
      eg.addColorStop(0.94, 'rgba(200,245,0,0)')
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
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
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