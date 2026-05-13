import { useState, useEffect, useRef } from 'react'
import { getGymLogs, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
  unknown:     '#888888',
}

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function getPhaseOnDate(phases, date) {
  for (const p of phases) {
    const start = parseDate(p.start_date)
    const end = p.end_date ? parseDate(p.end_date) : new Date('2099-01-01')
    if (date >= start && date < end) return p.phase_type
  }
  return 'unknown'
}

function volume(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * parseInt(log.reps)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function ExerciseChart({ name, logs, phases }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const points = logs
    .map(log => {
      const vol = volume(log)
      if (!vol) return null
      const date = parseDate(log.start_date)
      const phase = getPhaseOnDate(phases, date)
      return { date, vol, phase, log }
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date)

  if (points.length < 1) return null

  const W = 320, H = 120
  const PAD = { top: 12, right: 12, bottom: 20, left: 42 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minDate = points[0].date.getTime()
  const maxDate = points[points.length - 1].date.getTime()
  const dateRange = maxDate - minDate || 1

  const vols = points.map(p => p.vol)
  const minVol = Math.min(...vols)
  const maxVol = Math.max(...vols)
  const volRange = maxVol - minVol || 1

  function xPos(date) {
    return PAD.left + ((date.getTime() - minDate) / dateRange) * chartW
  }
  function yPos(vol) {
    return PAD.top + chartH - ((vol - minVol) / volRange) * chartH
  }

  // Ticks Y
  const yTicks = Array.from({ length: 3 }, (_, i) => {
    const val = minVol + (volRange * i) / 2
    return { val, y: yPos(val) }
  })

  // Ticks X — primero y último
  const xTicks = [points[0], points[points.length - 1]]

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = e.clientX - rect.left
    let closest = null
    let minDist = Infinity
    points.forEach(p => {
      const px = xPos(p.date)
      const dist = Math.abs(mx - px)
      if (dist < minDist) { minDist = dist; closest = p }
    })
    if (closest && minDist < 30) {
      setTooltip({
        x: xPos(closest.date),
        y: yPos(closest.vol),
        vol: closest.vol,
        date: closest.date.toLocaleDateString('es-ES'),
        phase: closest.phase,
        weight: closest.log.weight,
        reps: closest.log.reps,
      })
    } else {
      setTooltip(null)
    }
  }

  return (
    <div className="bg-[#141414] border border-[#333333] p-4 mb-4 relative">
      <p className="text-[#888888] font-mono text-xs mb-1 tracking-widest uppercase">{name}</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>

        {/* Grid Y */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1f1f1f" strokeWidth="1" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fill="#555" fontSize="8" fontFamily="Courier New">
              {t.val >= 1000 ? `${(t.val/1000).toFixed(1)}k` : t.val.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Ticks X */}
        {xTicks.map((p, i) => (
          <text key={i} x={xPos(p.date)} y={H - 4} textAnchor={i === 0 ? 'start' : 'end'}
            fill="#555" fontSize="8" fontFamily="Courier New">
            {p.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </text>
        ))}

        {/* Líneas entre puntos del mismo color de fase */}
        {points.map((p, i) => {
          if (i === 0) return null
          const prev = points[i - 1]
          return (
            <line key={i}
              x1={xPos(prev.date)} y1={yPos(prev.vol)}
              x2={xPos(p.date)} y2={yPos(p.vol)}
              stroke={PHASE_COLORS[p.phase] || '#888888'}
              strokeWidth="1.5" strokeOpacity="0.5"
            />
          )
        })}

        {/* Puntos */}
        {points.map((p, i) => (
          <circle key={i}
            cx={xPos(p.date)} cy={yPos(p.vol)} r="4"
            fill={PHASE_COLORS[p.phase] || '#888888'}
            stroke="#0a0a0a" strokeWidth="1.5"
          />
        ))}

        {/* Tooltip crosshair */}
        {tooltip && (
          <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
            stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute top-8 right-4 bg-[#0a0a0a] border border-[#333333] px-3 py-2 font-mono text-xs pointer-events-none">
          <p className="text-[#888888]">{tooltip.date}</p>
          <p className="font-bold" style={{ color: PHASE_COLORS[tooltip.phase] }}>
            {tooltip.weight ? `${tooltip.weight} kg` : '—'}
            {tooltip.weight && tooltip.reps ? ` × ${tooltip.reps}` : ''}
          </p>
          <p className="text-[#555555]">vol: {tooltip.vol.toFixed(0)}</p>
        </div>
      )}

      {/* Leyenda de fases presentes */}
      <div className="flex gap-3 mt-2 flex-wrap">
        {[...new Set(points.map(p => p.phase))].map(phase => (
          <div key={phase} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
            <span className="text-[#555555] font-mono text-xs">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GymHistory({ onNavigate }) {
  const [gymLogs, setGymLogs] = useState([])
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [logsData, phasesData] = await Promise.all([getGymLogs(), getPhases()])
        setGymLogs(logsData)
        setPhases(phasesData)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#888888] font-mono text-sm">cargando...</p>
    </div>
  )

  // Agrupar logs por ejercicio
  const byExercise = {}
  gymLogs.forEach(log => {
    const key = log.exercise_type_id
    if (!byExercise[key]) byExercise[key] = { name: log.name, logs: [] }
    byExercise[key].logs.push(log)
  })

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// HISTORIAL GYM" />

        {Object.values(byExercise).length === 0 ? (
          <p className="text-[#888888] font-mono text-sm">sin datos</p>
        ) : (
          Object.values(byExercise).map(({ name, logs }) => (
            <ExerciseChart key={name} name={name} logs={logs} phases={phases} />
          ))
        )}

        <Separator className="mt-4 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}