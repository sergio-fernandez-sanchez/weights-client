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
    const dur = 1300
    const chars = '01アイウエオカキクケコサシスセソタチツテト10█▓▒░⠿⣿◢◣◤◥▲▼◆▶'.split('')
    const hexChars = '0123456789ABCDEF'.split('')

    // ── matrix rain columns ──────────────────────────────────────────────
    const colCount = Math.floor(W / 14)
    const columns = Array.from({length: colCount}, (_, i) => ({
      x: i * 14 + 4,
      trail: Array.from({length: 8 + Math.floor(Math.random() * 12)}, () => chars[Math.floor(Math.random() * chars.length)]),
      headY: -Math.random() * H,
      speed: 4 + Math.random() * 8,
      brightness: 0.4 + Math.random() * 0.6,
    }))

    // ── glitch strips ─────────────────────────────────────────────────────
    const strips = Array.from({length: 24}, () => ({
      y: Math.random() * H,
      h: 2 + Math.random() * 10,
      dx: (Math.random() - 0.5) * 50,
      alpha: 0.3 + Math.random() * 0.6,
      flickerSeed: Math.random(),
    }))

    // ── floating data nodes ───────────────────────────────────────────────
    const nodes = Array.from({length: 18}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2 + Math.random() * 3,
      pulseOffset: Math.random() * Math.PI * 2,
      connections: [],
    }))
    // Crear conexiones entre nodos cercanos
    nodes.forEach((n, i) => {
      nodes.forEach((m, j) => {
        if (i !== j) {
          const d = Math.hypot(n.x - m.x, n.y - m.y)
          if (d < 200 && n.connections.length < 3) n.connections.push(j)
        }
      })
    })

    // ── particles emitted from scan line ──────────────────────────────────
    const particles = []

    // ── hex codes that appear momentarily ─────────────────────────────────
    const hexBlocks = Array.from({length: 12}, () => ({
      x: Math.random() * (W - 60),
      y: Math.random() * H,
      text: Array.from({length: 4}, () => hexChars[Math.floor(Math.random() * 16)]).join(''),
      lifetime: Math.random() * 0.4,
      birth: Math.random() * 0.8,
    }))

    // ── circular pulse origins ────────────────────────────────────────────
    const pulses = [
      { x: W * 0.5, y: H * 0.5, t: 0.1, max: 1.0 },
      { x: W * 0.3, y: H * 0.7, t: 0.4, max: 0.6 },
      { x: W * 0.7, y: H * 0.3, t: 0.6, max: 0.7 },
    ]

    let raf
    function frame(now) {
      const t = Math.min((now - start) / dur, 1)
      const scanY = t * (H + 100) - 50
      ctx.clearRect(0, 0, W, H)

      // ── BACKGROUND VEIL ───────────────────────────────────────────────
      const veilA = 0.25 * (1 - Math.abs(t - 0.5) * 1.6)
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, veilA)})`
      ctx.fillRect(0, 0, W, H)

      // ── HEX GRID BACKGROUND ──────────────────────────────────────────
      const gridA = 0.18 * Math.sin(t * Math.PI)
      ctx.strokeStyle = `rgba(200,245,0,${gridA})`
      ctx.lineWidth = 0.5
      for (let gy = 0; gy < H; gy += 24) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }
      for (let gx = 0; gx < W; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
      }

      // ── MATRIX RAIN ───────────────────────────────────────────────────
      const rainA = Math.sin(t * Math.PI) * 0.9
      columns.forEach(col => {
        col.headY += col.speed
        if (col.headY - col.trail.length * 14 > H) {
          col.headY = -Math.random() * 100
          col.trail = col.trail.map(() => chars[Math.floor(Math.random() * chars.length)])
        }
        col.trail.forEach((ch, i) => {
          const cy = col.headY - i * 14
          if (cy < -14 || cy > H) return
          let a = (1 - i / col.trail.length) * col.brightness * rainA
          let color = '200,245,0'
          if (i === 0) { a = 1 * rainA; color = '255,255,255' }
          else if (i === 1) { a = 0.95 * rainA; color = '220,255,150' }
          ctx.font = '12px Courier New'
          ctx.fillStyle = `rgba(${color},${a})`
          ctx.fillText(ch, col.x, cy)
          if (Math.random() > 0.94) col.trail[i] = chars[Math.floor(Math.random() * chars.length)]
        })
      })

      // ── NODE NETWORK ──────────────────────────────────────────────────
      const netA = Math.sin(t * Math.PI) * 0.7
      // connections
      ctx.strokeStyle = `rgba(0,200,255,${0.3 * netA})`
      ctx.lineWidth = 0.5
      nodes.forEach((n, i) => {
        n.connections.forEach(j => {
          const m = nodes[j]
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke()
        })
      })
      // nodes themselves
      nodes.forEach(n => {
        const pulse = 0.5 + 0.5 * Math.sin(now / 200 + n.pulseOffset)
        const a = netA * (0.5 + pulse * 0.5)
        ctx.fillStyle = `rgba(200,245,0,${a})`
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (0.7 + pulse * 0.5), 0, Math.PI * 2); ctx.fill()
        // glow halo
        ctx.fillStyle = `rgba(200,245,0,${a * 0.15})`
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 4 * pulse, 0, Math.PI * 2); ctx.fill()
      })

      // ── PULSE RINGS ───────────────────────────────────────────────────
      pulses.forEach(p => {
        if (t > p.t && t < p.t + 0.4) {
          const local = (t - p.t) / 0.4
          const radius = local * Math.max(W, H) * p.max
          const a = (1 - local) * 0.5
          ctx.strokeStyle = `rgba(200,245,0,${a})`
          ctx.lineWidth = 2 * (1 - local)
          ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.stroke()
          ctx.strokeStyle = `rgba(0,200,255,${a * 0.6})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(p.x, p.y, radius * 1.1, 0, Math.PI * 2); ctx.stroke()
        }
      })

      // ── HEX BLOCKS ────────────────────────────────────────────────────
      hexBlocks.forEach(hb => {
        if (t > hb.birth && t < hb.birth + hb.lifetime) {
          const local = (t - hb.birth) / hb.lifetime
          const a = Math.sin(local * Math.PI) * 0.7
          ctx.font = 'bold 11px Courier New'
          ctx.fillStyle = `rgba(0,200,255,${a})`
          ctx.fillText('0x' + hb.text, hb.x, hb.y)
        }
      })

      // ── CHROMATIC ABERRATION BANDS ────────────────────────────────────
      for (let i = 0; i < 12; i++) {
        const by = scanY - 2 - i * 4
        const a = (1 - i / 12) * 0.28
        ctx.fillStyle = `rgba(0,200,255,${a})`
        ctx.fillRect(-8, by, W + 16, 2)
        ctx.fillStyle = `rgba(255,0,80,${a})`
        ctx.fillRect(8, by, W + 16, 2)
      }

      // ── MAIN BEAM GLOW ────────────────────────────────────────────────
      const grad = ctx.createLinearGradient(0, scanY - 80, 0, scanY + 20)
      grad.addColorStop(0,    'rgba(200,245,0,0)')
      grad.addColorStop(0.3,  'rgba(200,245,0,0.18)')
      grad.addColorStop(0.65, 'rgba(200,245,0,0.7)')
      grad.addColorStop(0.85, 'rgba(255,255,255,1)')
      grad.addColorStop(1,    'rgba(200,245,0,0.3)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 80, W, 100)

      // ── MAIN SCAN LINE (sharp, bright, double) ────────────────────────
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(0, scanY, W, 1)
      ctx.fillStyle = 'rgba(220,255,100,1)'
      ctx.fillRect(0, scanY + 1, W, 3)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(0, scanY + 4, W, 1)
      ctx.fillStyle = 'rgba(200,245,0,0.5)'
      ctx.fillRect(0, scanY + 5, W, 2)

      // ── PARTICLE SHOWER (emitted from scan line) ──────────────────────
      if (Math.random() > 0.3) {
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: Math.random() * W,
            y: scanY,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 6,
            life: 1,
            decay: 0.02 + Math.random() * 0.025,
            size: 1 + Math.random() * 2.5,
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

      // ── GLITCH STRIPS (near scan) ─────────────────────────────────────
      strips.forEach(s => {
        const dist = Math.abs(s.y - scanY)
        if (dist < 100) {
          const flicker = 0.5 + 0.5 * Math.sin(now / 30 + s.flickerSeed * 10)
          const a = s.alpha * (1 - dist / 100) * flicker
          ctx.fillStyle = `rgba(200,245,0,${a * 0.45})`
          ctx.fillRect(s.dx, s.y, W, s.h)
          ctx.fillStyle = `rgba(0,200,255,${a * 0.3})`
          ctx.fillRect(s.dx + 6, s.y, W, s.h * 0.5)
          ctx.fillStyle = `rgba(255,0,80,${a * 0.3})`
          ctx.fillRect(s.dx - 6, s.y, W, s.h * 0.5)
        }
      })

      // ── CORNER BRACKETS (animated) ────────────────────────────────────
      const bSize = 24
      const bA = Math.min(t * 4, 1, (1 - t) * 4) * 0.85
      const bOffset = Math.sin(t * Math.PI * 4) * 2
      ctx.strokeStyle = `rgba(200,245,0,${bA})`
      ctx.lineWidth = 2
      ;[[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([x,y,sx,sy]) => {
        ctx.beginPath()
        ctx.moveTo(x + sx * (bSize + bOffset), y)
        ctx.lineTo(x, y)
        ctx.lineTo(x, y + sy * (bSize + bOffset))
        ctx.stroke()
      })
      // smaller inner brackets
      const bSize2 = 12
      ctx.strokeStyle = `rgba(0,200,255,${bA * 0.5})`
      ctx.lineWidth = 1
      ;[[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([x,y,sx,sy]) => {
        const ox = sx * 8, oy = sy * 8
        ctx.beginPath()
        ctx.moveTo(x + ox + sx * bSize2, y + oy)
        ctx.lineTo(x + ox, y + oy)
        ctx.lineTo(x + ox, y + oy + sy * bSize2)
        ctx.stroke()
      })

      // ── HUD TEXT (top corners) ────────────────────────────────────────
      const hudA = Math.min(t * 4, 1, (1 - t) * 4) * 0.7
      ctx.font = 'bold 10px Courier New'
      ctx.fillStyle = `rgba(200,245,0,${hudA})`
      ctx.fillText('▶ SCANNING', 40, 30)
      ctx.fillText(`${Math.floor(t * 100).toString().padStart(3, '0')}%`, W - 80, 30)
      ctx.fillStyle = `rgba(0,200,255,${hudA * 0.6})`
      ctx.font = '9px Courier New'
      ctx.fillText('SYS:OK', 40, H - 30)
      ctx.fillText('0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0'), W - 100, H - 30)

      // ── EDGE GLOW ─────────────────────────────────────────────────────
      const edgeA = 0.15 * (1 - Math.abs(t - 0.5) * 2)
      const eg = ctx.createLinearGradient(0, 0, W, 0)
      eg.addColorStop(0,    `rgba(200,245,0,${edgeA})`)
      eg.addColorStop(0.05, 'rgba(200,245,0,0)')
      eg.addColorStop(0.95, 'rgba(200,245,0,0)')
      eg.addColorStop(1,    `rgba(200,245,0,${edgeA})`)
      ctx.fillStyle = eg
      ctx.fillRect(0, 0, W, H)
      // vertical edges
      const eg2 = ctx.createLinearGradient(0, 0, 0, H)
      eg2.addColorStop(0,    `rgba(200,245,0,${edgeA})`)
      eg2.addColorStop(0.05, 'rgba(200,245,0,0)')
      eg2.addColorStop(0.95, 'rgba(200,245,0,0)')
      eg2.addColorStop(1,    `rgba(200,245,0,${edgeA})`)
      ctx.fillStyle = eg2
      ctx.fillRect(0, 0, W, H)

      // ── CRT SCANLINES OVERLAY (subtle) ────────────────────────────────
      for (let i = 0; i < H; i += 3) {
        const distToScan = Math.abs(i - scanY)
        if (distToScan < 80) {
          const a = (1 - distToScan / 80) * 0.08
          ctx.fillStyle = `rgba(0,0,0,${a})`
          ctx.fillRect(0, i, W, 1)
        }
      }

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