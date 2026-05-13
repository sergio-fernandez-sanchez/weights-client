import { useState, useEffect, useRef } from 'react'
import { getActivePhase, getWeights, getGymLogs } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const PHASE_COLORS = {
  bulk:        '#4a9eff',
  cut:         '#ff6b35',
  maintenance: '#c8f500',
}

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function volume(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * parseInt(log.reps)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function MetricCard({ label, value, sub, valueColor = '#c8f500' }) {
  return (
    <div className="bg-[#141414] border border-[#333333] p-4">
      <p className="text-[#888888] font-mono text-xs mb-1">{label}</p>
      <p className="font-mono text-xl font-bold" style={{ color: valueColor }}>{value}</p>
      {sub && <p className="text-[#888888] font-mono text-xs mt-1">{sub}</p>}
    </div>
  )
}

function PhaseChart({ data, phaseColor, weightGoal }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data.length) return null

  const W = 320, H = 140
  const PAD = { top: 10, right: 10, bottom: 16, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const weights = data.map(d => d.weight)
  const allVals = weightGoal ? [...weights, weightGoal] : weights
  const minW = Math.min(...allVals), maxW = Math.max(...allVals)
  const range = maxW - minW || 1

  function xPos(i) { return PAD.left + (i / Math.max(data.length - 1, 1)) * chartW }
  function yPos(w) { return PAD.top + chartH - ((w - minW) / range) * chartH }

  const ticks = Array.from({ length: 4 }, (_, i) => {
    const val = minW + (range * i) / 3
    return { val, y: yPos(val) }
  })

  const points = data.map((d, i) => `${xPos(i)},${yPos(d.weight)}`).join(' ')
  const goalY = weightGoal ? yPos(weightGoal) : null

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left - PAD.left
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / chartW) * (data.length - 1))))
    const d = data[idx]
    setTooltip({ x: xPos(idx), y: yPos(d.weight), weight: d.weight, date: parseDate(d.date).toLocaleDateString('es-ES') })
  }

  return (
    <div className="bg-[#141414] border border-[#333333] p-4 mb-4 relative">
      <p className="text-[#888888] font-mono text-xs mb-3">EVOLUCIÓN EN ESTA FASE</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1f1f1f" strokeWidth="1" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fill="#666" fontSize="9" fontFamily="Courier New">
              {t.val.toFixed(1)}
            </text>
          </g>
        ))}
        {goalY && (
          <line x1={PAD.left} y1={goalY} x2={W - PAD.right} y2={goalY}
            stroke={phaseColor} strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.5" />
        )}
        <polyline points={points} fill="none" stroke={phaseColor} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
              stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={phaseColor} />
          </>
        )}
      </svg>
      {tooltip && (
        <div className="absolute top-10 right-4 bg-[#0a0a0a] border border-[#333333] px-3 py-2 font-mono text-xs pointer-events-none">
          <p className="text-[#888888]">{tooltip.date}</p>
          <p className="font-bold" style={{ color: phaseColor }}>{tooltip.weight.toFixed(2)} kg</p>
        </div>
      )}
      {weightGoal && (
        <p className="text-[#888888] font-mono text-xs mt-1 opacity-60">
          — — objetivo: {parseFloat(weightGoal).toFixed(2)} kg
        </p>
      )}
    </div>
  )
}

function calcWeeklyStats(phaseWeights) {
  if (phaseWeights.length < 2) return null

  const byWeek = {}
  phaseWeights.forEach(w => {
    const d = parseDate(w.date)
    const monday = new Date(d)
    monday.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
    const key = monday.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = []
    byWeek[key].push(parseFloat(w.weight))
  })

  const weekKeys = Object.keys(byWeek).sort()
  if (weekKeys.length < 2) return null

  const weeklyAvgs = weekKeys.map(k => {
    const vals = byWeek[k]
    return vals.reduce((a, b) => a + b, 0) / vals.length
  })

  const weeklyChanges = []
  for (let i = 1; i < weeklyAvgs.length; i++) {
    weeklyChanges.push(weeklyAvgs[i] - weeklyAvgs[i - 1])
  }

  const avgChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length
  const variance = weeklyChanges.reduce((acc, v) => acc + Math.pow(v - avgChange, 2), 0) / weeklyChanges.length
  const stdDev = Math.sqrt(variance)

  return { avgChange, stdDev, weeks: weeklyChanges.length }
}

function calcStrengthProgress(gymLogs, phaseStartDate) {
  if (!gymLogs.length || !phaseStartDate) return null

  const phaseStart = parseDate(phaseStartDate)

  // Agrupar por ejercicio
  const byExercise = {}
  gymLogs.forEach(log => {
    if (!log.weight) return
    const eid = log.exercise_type_id
    if (!byExercise[eid]) byExercise[eid] = []
    byExercise[eid].push(log)
  })

  const changes = []

  Object.values(byExercise).forEach(logs => {
    const sorted = logs.sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
    const current = sorted[sorted.length - 1]

    // Misma lógica que calcProgress en Gym.jsx
    const phaseHistory = sorted.filter(l => parseDate(l.start_date) >= phaseStart)
    const beforePhase  = sorted.filter(l => parseDate(l.start_date) < phaseStart)

    let baseLog = null
    if (phaseHistory.length >= 2) {
      baseLog = phaseHistory[0]
    } else if (phaseHistory.length === 1 && beforePhase.length > 0) {
      baseLog = beforePhase[beforePhase.length - 1]
    }

    if (!baseLog || baseLog.id === current.id) {
      changes.push({ name: current.name, pct: 0, noData: true })
      return
    }

    const volBase    = volume(baseLog)
    const volCurrent = volume(current)

    if (!volBase || !volCurrent) {
      changes.push({ name: current.name, pct: 0, noData: true })
      return
    }

    const pct = ((volCurrent - volBase) / volBase) * 100
    changes.push({ name: current.name, pct, noData: false })
  })

  if (!changes.length) return null

  const validChanges = changes.filter(c => !c.noData)
  const avg = validChanges.length > 0
    ? validChanges.reduce((a, b) => a + b.pct, 0) / validChanges.length
    : 0

  return { avg, exercises: changes }
}

export default function CurrentPhase({ onNavigate }) {
  const [phase, setPhase] = useState(null)
  const [weights, setWeights] = useState([])
  const [gymLogs, setGymLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [phaseData, weightData, gymData] = await Promise.all([
          getActivePhase(), getWeights(), getGymLogs()
        ])
        setPhase(phaseData)
        setWeights(weightData)
        setGymLogs(gymData)
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

  if (!phase) return (
    <div className="min-h-screen px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// FASE ACTUAL" />
        <p className="text-[#888888] font-mono text-sm">no hay fase activa</p>
      </div>
    </div>
  )

  const phaseColor = PHASE_COLORS[phase.phase_type] || '#c8f500'

  const phaseWeights = weights
    .filter(w => parseDate(w.date) >= parseDate(phase.start_date))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))

  const chartData = phaseWeights.map(w => ({ date: w.date, weight: parseFloat(w.weight) }))
  const sortedDesc = [...phaseWeights].sort((a, b) => parseDate(b.date) - parseDate(a.date))
  const currentWeight = sortedDesc[0]?.weight ?? null
  const startWeight = phaseWeights[0]?.weight ?? null

  const weightGoal = phase.weight_goal ? parseFloat(phase.weight_goal) : null
  const dateGoal = phase.date_goal ? parseDate(phase.date_goal) : null
  const startDate = parseDate(phase.start_date)
  const today = new Date()

  const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  const daysLeft = dateGoal ? Math.ceil((dateGoal - today) / (1000 * 60 * 60 * 24)) : null
  const totalDays = dateGoal ? Math.floor((dateGoal - startDate) / (1000 * 60 * 60 * 24)) : null
  const totalWeeks = totalDays ? totalDays / 7 : null
  const progress = totalDays && totalDays > 0 ? Math.max(0, Math.min(1, daysElapsed / totalDays)) : null

  const diff = currentWeight && weightGoal ? (weightGoal - parseFloat(currentWeight)).toFixed(2) : null
  const gained = currentWeight && startWeight ? (parseFloat(currentWeight) - parseFloat(startWeight)).toFixed(2) : null

  const impliedWeeklyGoal = weightGoal && startWeight && totalWeeks
    ? ((weightGoal - parseFloat(startWeight)) / totalWeeks) : null

  const weeklyStats = calcWeeklyStats(phaseWeights)
  const strengthProgress = calcStrengthProgress(gymLogs, phase.start_date)

  function gainedColor() {
    if (!gained) return '#c8f500'
    const g = parseFloat(gained)
    if (phase.phase_type === 'bulk') return g > 0 ? '#4caf50' : '#f44336'
    if (phase.phase_type === 'cut')  return g < 0 ? '#4caf50' : '#f44336'
    return '#c8f500'
  }

  function strengthColor(pct) {
    if (phase.phase_type === 'cut') {
      if (pct >= -3) return '#4caf50'
      if (pct >= -8) return '#ff9f00'
      return '#f44336'
    }
    if (pct > 2) return '#4caf50'
    if (pct >= 0) return '#ff9f00'
    return '#f44336'
  }

  function weeklyRateColor(actual, goal) {
    if (!goal) return '#c8f500'
    const ratio = actual / goal
    if (ratio >= 0.7 && ratio <= 1.3) return '#4caf50'
    if (ratio >= 0.4 && ratio <= 1.6) return '#ff9f00'
    return '#f44336'
  }

  function consistencyColor(std) {
    if (std < 0.3) return '#4caf50'
    if (std < 0.6) return '#ff9f00'
    return '#f44336'
  }

  function consistencyLabel(std) {
    if (std < 0.3) return 'muy consistente'
    if (std < 0.6) return 'moderado'
    return 'irregular'
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// FASE ACTUAL" />

        <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
          <p className="text-[#888888] font-mono text-xs mb-1">TIPO DE FASE</p>
          <p className="font-mono text-3xl font-bold" style={{ color: phaseColor }}>
            {phase.phase_type.toUpperCase()}
          </p>
          <p className="text-[#888888] font-mono text-xs mt-1">
            desde {startDate.toLocaleDateString('es-ES')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard label="PESO ACTUAL" value={currentWeight ? `${parseFloat(currentWeight).toFixed(2)} kg` : '—'} />
          <MetricCard label="PESO OBJETIVO" value={weightGoal ? `${weightGoal.toFixed(2)} kg` : '—'} />
          <MetricCard label="DIFERENCIA" value={diff ? `${diff > 0 ? '+' : ''}${diff} kg` : '—'} sub="para el objetivo" />
          <MetricCard
            label="DESDE INICIO"
            value={gained ? `${gained > 0 ? '+' : ''}${gained} kg` : '—'}
            sub={startWeight ? `inicio: ${parseFloat(startWeight).toFixed(2)} kg` : ''}
            valueColor={gainedColor()}
          />
          <MetricCard label="DÍAS EN FASE" value={`${daysElapsed} días`} />
          <MetricCard
            label="DÍAS RESTANTES"
            value={daysLeft !== null ? `${daysLeft} días` : '—'}
            sub={dateGoal ? dateGoal.toLocaleDateString('es-ES') : ''}
          />
        </div>

        {progress !== null && (
          <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
            <div className="flex justify-between mb-2">
              <p className="text-[#888888] font-mono text-xs">PROGRESO TEMPORAL</p>
              <p className="text-[#c8f500] font-mono text-xs">{Math.round(progress * 100)}%</p>
            </div>
            <div className="w-full bg-[#333333] h-2">
              <div className="h-2 transition-all" style={{ width: `${progress * 100}%`, backgroundColor: phaseColor }} />
            </div>
          </div>
        )}

        <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
          <p className="text-[#888888] font-mono text-xs mb-3">RENDIMIENTO EN GYM</p>
          {!strengthProgress ? (
            <p className="text-[#555555] font-mono text-xs">sin datos suficientes</p>
          ) : (
            <>
              <div className="flex items-end gap-3 mb-3">
                <p className="font-mono text-3xl font-bold" style={{ color: strengthColor(strengthProgress.avg) }}>
                  {strengthProgress.avg > 0 ? '+' : ''}{strengthProgress.avg.toFixed(1)}%
                </p>
                <p className="text-[#888888] font-mono text-xs mb-1">volumen medio</p>
              </div>
              <div className="flex flex-col gap-1">
                {strengthProgress.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[#555555] font-mono text-xs uppercase truncate mr-2">{ex.name}</span>
                    <span className="font-mono text-xs font-bold flex-shrink-0"
                      style={{ color: strengthColor(ex.noData ? 0 : ex.pct) }}>
                      {ex.noData ? '0.0%' : `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {weeklyStats && (
          <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
            <p className="text-[#888888] font-mono text-xs mb-3">RITMO SEMANAL</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[#888888] font-mono text-xs mb-1">MEDIA SEMANAL</p>
                <p className="font-mono text-xl font-bold"
                  style={{ color: impliedWeeklyGoal ? weeklyRateColor(Math.abs(weeklyStats.avgChange), Math.abs(impliedWeeklyGoal)) : '#c8f500' }}>
                  {weeklyStats.avgChange > 0 ? '+' : ''}{weeklyStats.avgChange.toFixed(2)} kg
                </p>
                {impliedWeeklyGoal && (
                  <p className="text-[#888888] font-mono text-xs mt-1">
                    objetivo: {impliedWeeklyGoal > 0 ? '+' : ''}{impliedWeeklyGoal.toFixed(2)} kg
                  </p>
                )}
              </div>
              <div>
                <p className="text-[#888888] font-mono text-xs mb-1">CONSISTENCIA</p>
                <p className="font-mono text-xl font-bold" style={{ color: consistencyColor(weeklyStats.stdDev) }}>
                  σ {weeklyStats.stdDev.toFixed(2)}
                </p>
                <p className="font-mono text-xs mt-1" style={{ color: consistencyColor(weeklyStats.stdDev) }}>
                  {consistencyLabel(weeklyStats.stdDev)}
                </p>
              </div>
            </div>
            {impliedWeeklyGoal && (
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <p className="text-[#888888] font-mono text-xs">RITMO VS OBJETIVO</p>
                  <p className="font-mono text-xs" style={{ color: weeklyRateColor(Math.abs(weeklyStats.avgChange), Math.abs(impliedWeeklyGoal)) }}>
                    {((Math.abs(weeklyStats.avgChange) / Math.abs(impliedWeeklyGoal)) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-full bg-[#333333] h-1.5">
                  <div className="h-1.5 transition-all"
                    style={{
                      width: `${Math.min(100, (Math.abs(weeklyStats.avgChange) / Math.abs(impliedWeeklyGoal)) * 100)}%`,
                      backgroundColor: weeklyRateColor(Math.abs(weeklyStats.avgChange), Math.abs(impliedWeeklyGoal))
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {chartData.length > 1 && (
          <PhaseChart data={chartData} phaseColor={phaseColor} weightGoal={weightGoal} />
        )}

        <button
          onClick={() => onNavigate('editPhaseGoals', phase)}
          className="w-full h-10 bg-transparent border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors mb-4"
        >
          // EDITAR OBJETIVOS
        </button>

        <Separator className="mt-2 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}