import { useState, useEffect, useRef } from 'react'
import { getGymLogs, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'

const PHASE_COLORS = { bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00', unknown: '#888888' }

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function getPhaseOnDate(phases, date) {
  for (const p of phases) {
    const start = parseDate(p.start_date)
    const end = p.end_date ? parseDate(p.end_date) : new Date('2099-01-01')
    if (date >= start && date < end) return p.phase_type
  }
  return 'unknown'
}

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function ExerciseChart({ name, logs, phases }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const points = logs
    .filter(log => log.weight)
    .map(log => ({
      date: parseDate(log.start_date),
      weight: oneRM(log),
      reps: log.reps,
      rawWeight: parseFloat(log.weight),
      phase: getPhaseOnDate(phases, parseDate(log.start_date)),
    }))
    .sort((a, b) => a.date - b.date)

  if (points.length < 1) return null

  const W = 320, H = 140
  const PAD = { top: 12, right: 12, bottom: 20, left: 42 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minDate = points[0].date.getTime()
  const maxDate = points[points.length - 1].date.getTime()
  const dateRange = maxDate - minDate || 1

  const weights = points.map(p => p.weight)
  const minW = Math.min(...weights), maxW = Math.max(...weights)
  const range = maxW - minW || 1

  function xPos(d) { return PAD.left + ((d.getTime() - minDate) / dateRange) * chartW }
  function yPos(w) { return PAD.top + chartH - ((w - minW) / range) * chartH }

  const ticks = Array.from({ length: 3 }, (_, i) => {
    const val = minW + (range * i) / 2
    return { val, y: yPos(val) }
  })

  // Build segments by phase
  const segments = []
  let i = 0
  while (i < points.length) {
    const phase = points[i].phase
    let j = i + 1
    while (j < points.length && points[j].phase === phase) j++
    const seg = points.slice(i, Math.min(j + 1, points.length))
    const pts = seg.map(p => `${xPos(p.date)},${yPos(p.weight)}`).join(' ')
    const area = `${xPos(seg[0].date)},${PAD.top + chartH} ${pts} ${xPos(seg[seg.length - 1].date)},${PAD.top + chartH}`
    segments.push({ phase, points: pts, area, startIdx: i })
    i = j
  }

  function handleMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const scale = W / rect.width
    const mouseX = x * scale
    let closest = points[0], closestDist = Infinity
    points.forEach(p => {
      const d = Math.abs(xPos(p.date) - mouseX)
      if (d < closestDist) { closestDist = d; closest = p }
    })
    setTooltip({
      x: xPos(closest.date), y: yPos(closest.weight),
      weight: closest.weight, rawWeight: closest.rawWeight,
      reps: closest.reps,
      date: closest.date.toLocaleDateString('es-ES'),
      color: PHASE_COLORS[closest.phase] || '#888',
    })
  }

  const first = points[0], last = points[points.length - 1]
  const change = last.weight - first.weight
  const changePct = (change / first.weight) * 100

  return (
    <div className="glass-card rounded-sm p-3 mb-3 relative overflow-hidden">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[#e8e8e8] font-mono text-xs font-bold tracking-wide uppercase">{name}</p>
        {points.length >= 2 && (
          <span className="font-mono text-[11px] font-bold" style={{ color: change > 0 ? '#4caf50' : change < 0 ? '#ff2d2d' : '#888' }}>
            {change > 0 ? '+' : ''}{changePct.toFixed(1)}%
          </span>
        )}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMove} onTouchMove={handleMove}
        onMouseLeave={() => setTooltip(null)} onTouchEnd={() => setTooltip(null)}>
        <defs>
          {Object.entries(PHASE_COLORS).map(([phase, color]) => (
            <linearGradient key={phase} id={`gym-area-${phase}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#444" fontSize="9" fontFamily="monospace">{t.val.toFixed(0)}</text>
          </g>
        ))}
        {segments.map((seg, i) => (
          <g key={i}>
            <polygon points={seg.area} fill={`url(#gym-area-${seg.phase || 'unknown'})`} />
            <polyline points={seg.points} fill="none" stroke={PHASE_COLORS[seg.phase] || '#888'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {points.length <= 20 && points.map((p, i) => (
          <circle key={i} cx={xPos(p.date)} cy={yPos(p.weight)} r="2" fill={PHASE_COLORS[p.phase] || '#888'} opacity="0.5" />
        ))}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom} stroke={tooltip.color} strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="none" stroke={tooltip.color} strokeWidth="2" />
            <circle cx={tooltip.x} cy={tooltip.y} r="2.5" fill={tooltip.color} />
          </>
        )}
      </svg>
      {tooltip && (
        <div className="absolute top-3 right-3 glass-card-elevated rounded-sm px-3 py-2 font-mono text-xs pointer-events-none border-none shadow-lg">
          <p className="text-[#555555]">{tooltip.date}</p>
          <p className="font-bold text-sm" style={{ color: tooltip.color }}>1RM ~{tooltip.weight.toFixed(1)}</p>
          <p className="text-[#444444] text-[10px]">{tooltip.rawWeight}kg × {tooltip.reps || '—'}</p>
        </div>
      )}
    </div>
  )
}

export default function GymHistory({ onNavigate }) {
  const [logs, setLogs] = useState([])
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [logData, phaseData] = await Promise.all([getGymLogs(), getPhases()])
        setLogs(logData)
        setPhases(phaseData)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#555555] font-mono text-sm animate-pulse">cargando...</p>
    </div>
  )

  const byExercise = {}
  logs.forEach(log => {
    const key = log.exercise_type_id
    if (!byExercise[key]) byExercise[key] = { name: log.name, logs: [] }
    byExercise[key].logs.push(log)
  })

  const exercises = Object.entries(byExercise)
    .filter(([, data]) => data.logs.some(l => l.weight))
    .sort((a, b) => a[1].name.localeCompare(b[1].name))

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="HISTORIAL GYM" sub="evolución 1RM estimado por ejercicio" />

        {exercises.length === 0 ? (
          <EmptyState message="SIN DATOS DE EJERCICIOS" icon="◆" />
        ) : (
          <div className="stagger">
            {exercises.map(([id, data]) => (
              <ExerciseChart key={id} name={data.name} logs={data.logs} phases={phases} />
            ))}
          </div>
        )}

        <Separator className="mt-6 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
      </div>
    </div>
  )
}