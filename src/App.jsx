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
    const dur = 900
    const chars = '01アイウエオカキクケコ10█▓▒░⠿⣿'.split('')

    const rain = Array.from({length: 40}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 8 + Math.random() * 6,
    }))

    const strips = Array.from({length: 16}, () => ({
      y: Math.random() * H,
      h: 2 + Math.random() * 8,
      dx: (Math.random() - 0.5) * 30,
      alpha: 0.3 + Math.random() * 0.5,
    }))

    // grid dots scattered across screen
    const dots = Array.from({length: 60}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1.5,
    }))

    let raf
    function frame(now) {
      const t = Math.min((now - start) / dur, 1)
      const scanY = t * (H + 80) - 40
      ctx.clearRect(0, 0, W, H)

      // grid lines revealed by scan
      for (let gy = 0; gy < H; gy += 20) {
        if (gy > scanY) break
        const distToScan = scanY - gy
        const a = Math.max(0, 0.4 - distToScan / (H * 1.5))
        ctx.strokeStyle = `rgba(200,245,0,${a})`
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }
      for (let gx = 0; gx < W; gx += 40) {
        const a = 0.15
        ctx.strokeStyle = `rgba(200,245,0,${a})`
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, Math.min(scanY, H)); ctx.stroke()
      }

      // glowing dots in scanned area
      dots.forEach(d => {
        if (d.y < scanY) {
          const a = Math.max(0, 0.8 - (scanY - d.y) / H)
          ctx.fillStyle = `rgba(200,245,0,${a})`
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill()
        }
      })

      // chromatic aberration bands
      for (let i = 0; i < 8; i++) {
        const by = scanY - 2 - i * 3
        const a = (1 - i / 8) * 0.22
        ctx.fillStyle = `rgba(0,200,255,${a})`
        ctx.fillRect(-5, by, W, 2)
        ctx.fillStyle = `rgba(255,0,80,${a})`
        ctx.fillRect(5, by, W, 2)
      }

      // main beam glow
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 12)
      grad.addColorStop(0,    'rgba(200,245,0,0)')
      grad.addColorStop(0.35, 'rgba(200,245,0,0.12)')
      grad.addColorStop(0.7,  'rgba(200,245,0,0.65)')
      grad.addColorStop(0.88, 'rgba(255,255,255,0.95)')
      grad.addColorStop(1,    'rgba(200,245,0,0.25)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 60, W, 72)

      // main scan line
      ctx.fillStyle = 'rgba(220,255,100,1)'
      ctx.fillRect(0, scanY, W, 2)
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(0, scanY + 1.5, W, 1)
      ctx.fillStyle = 'rgba(200,245,0,0.4)'
      ctx.fillRect(0, scanY + 2.5, W, 1)

      // glitch strips near scan
      strips.forEach(s => {
        const dist = Math.abs(s.y - scanY)
        if (dist < 80) {
          const a = s.alpha * (1 - dist / 80)
          ctx.fillStyle = `rgba(200,245,0,${a * 0.4})`
          ctx.fillRect(s.dx, s.y, W, s.h)
          ctx.fillStyle = `rgba(0,200,255,${a * 0.2})`
          ctx.fillRect(s.dx + 4, s.y, W, s.h * 0.5)
          ctx.fillStyle = `rgba(255,0,80,${a * 0.2})`
          ctx.fillRect(s.dx - 4, s.y, W, s.h * 0.5)
        }
      })

      // data rain chars near scan
      rain.forEach(r => {
        const dist = Math.abs(r.y - scanY)
        if (dist < 120) {
          const a = (1 - dist / 120) * 0.95
          ctx.font = `${r.size}px Courier New`
          ctx.fillStyle = `rgba(200,245,0,${a})`
          ctx.fillText(r.char, r.x, r.y)
          if (Math.random() > 0.85) r.char = chars[Math.floor(Math.random() * chars.length)]
        }
      })

      // corner brackets glow
      const bSize = 16, bW = 2
      const ba = Math.min(t * 3, 1) * 0.6
      ctx.strokeStyle = `rgba(200,245,0,${ba})`
      ctx.lineWidth = bW
      ;[[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([x,y,sx,sy]) => {
        ctx.beginPath(); ctx.moveTo(x+sx*bSize,y); ctx.lineTo(x,y); ctx.lineTo(x,y+sy*bSize); ctx.stroke()
      })

      // edge glow
      const edgeA = 0.08 * (1 - Math.abs(t - 0.5) * 2)
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