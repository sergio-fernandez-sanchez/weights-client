import { useState, useEffect, useRef } from 'react'
import { getPhases, getWeights, getGymLogs } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import MetricCard from '../components/MetricCard'

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
  unknown:     '#888888',
}
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTENIMIENTO' }

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function PhaseChart({ data, phaseColor, weightGoal }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data.length) return null

  const W = 320, H = 160
  const PAD = { top: 16, right: 12, bottom: 20, left: 38 }
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
  const areaPoints = `${xPos(0)},${PAD.top + chartH} ${points} ${xPos(data.length - 1)},${PAD.top + chartH}`
  const goalY = weightGoal ? yPos(weightGoal) : null

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left - PAD.left
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / chartW) * (data.length - 1))))
    const d = data[idx]
    setTooltip({ x: xPos(idx), y: yPos(d.weight), weight: d.weight, date: parseDate(d.date).toLocaleDateString('es-ES') })
  }

  const gradId = `area-grad-${phaseColor.replace('#', '')}`

  return (
    <div className="glass-card rounded-sm p-4 mb-4 relative overflow-hidden">
      <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-3">EVOLUCIÓN EN ESTA FASE</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} onTouchEnd={() => setTooltip(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={phaseColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#444" fontSize="9" fontFamily="monospace">
              {t.val.toFixed(1)}
            </text>
          </g>
        ))}
        {goalY && (
          <line x1={PAD.left} y1={goalY} x2={W - PAD.right} y2={goalY}
            stroke={phaseColor} strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.4" />
        )}
        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        {/* Line */}
        <polyline points={points} fill="none" stroke={phaseColor} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {/* Data points */}
        {data.length <= 30 && data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d.weight)} r="2" fill={phaseColor} opacity="0.4" />
        ))}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
              stroke={phaseColor} strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="none" stroke={phaseColor} strokeWidth="2" />
            <circle cx={tooltip.x} cy={tooltip.y} r="2.5" fill={phaseColor} />
          </>
        )}
      </svg>
      {tooltip && (
        <div className="absolute top-10 right-4 glass-card-elevated rounded-sm px-3 py-2 font-sans text-xs pointer-events-none border-none shadow-lg">
          <p className="text-[#666666]">{tooltip.date}</p>
          <p className="font-bold text-sm" style={{ color: phaseColor }}>{tooltip.weight.toFixed(2)} kg</p>
        </div>
      )}
      {weightGoal && (
        <div className="flex items-center gap-2 mt-2">
          <span className="w-4 h-0 border-t border-dashed" style={{ borderColor: phaseColor, opacity: 0.5 }} />
          <p className="text-[#555555] font-sans text-[10px]">
            objetivo: {parseFloat(weightGoal).toFixed(2)} kg
          </p>
        </div>
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
  for (let i = 1; i < weeklyAvgs.length; i++) weeklyChanges.push(weeklyAvgs[i] - weeklyAvgs[i - 1])
  const avgChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length
  const variance = weeklyChanges.reduce((acc, v) => acc + Math.pow(v - avgChange, 2), 0) / weeklyChanges.length
  return { avgChange, stdDev: Math.sqrt(variance) }
}

function calcProgress(allLogs, exerciseTypeId, phaseStartDate, phaseEndDate) {
  const phaseEnd = phaseEndDate ? parseDate(phaseEndDate) : new Date()
  const phaseStart = parseDate(phaseStartDate)

  const history = allLogs
    .filter(l => l.exercise_type_id === exerciseTypeId && l.weight)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))

  if (history.length === 0) return { phase: 0, noData: false }

  // Logs within the phase period
  const phaseHistory = history.filter(l => {
    const d = parseDate(l.start_date)
    return d >= phaseStart && d <= phaseEnd
  })

  // Logs before the phase
  const beforePhase = history.filter(l => parseDate(l.start_date) < phaseStart)

  // If no logs during this phase: 0% change
  if (phaseHistory.length === 0) return { phase: 0, noData: false }

  // Current = last log in the phase
  const current = phaseHistory[phaseHistory.length - 1]

  // Base = first log in the phase, OR last log before the phase if only 1 log in phase
  let baseLog = null
  if (phaseHistory.length >= 2) {
    baseLog = phaseHistory[0]
  } else if (beforePhase.length > 0) {
    baseLog = beforePhase[beforePhase.length - 1]
  }

  // Only 1 log in phase and nothing before it: 0% (no comparison possible)
  if (!baseLog || baseLog.id === current.id) return { phase: 0, noData: false }

  const rmBase = oneRM(baseLog)
  const rmCurr = oneRM(current)
  if (!rmBase || !rmCurr) return { phase: 0, noData: false }

  return { phase: ((rmCurr - rmBase) / rmBase) * 100, noData: false }
}

function progressColor(pct) {
  if (pct > 2) return '#4caf50'
  if (pct < -2) return '#ff2d2d'
  return '#ff9f00'
}

export default function CurrentPhase({ onNavigate }) {
  const [phases, setPhases]         = useState([])
  const [weights, setWeights]       = useState([])
  const [gymLogs, setGymLogs]       = useState([])
  const [phaseIndex, setPhaseIndex] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [phasesData, weightData, gymData] = await Promise.all([
          getPhases(), getWeights(), getGymLogs()
        ])
        const sorted = [...phasesData].sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
        setPhases(sorted)
        setWeights(weightData)
        setGymLogs(gymData)
        setPhaseIndex(sorted.length - 1)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#555555] font-sans text-sm animate-pulse">cargando...</p>
    </div>
  )

  if (!phases.length) return (
    <div className="min-h-screen px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="FASES" />
        <p className="text-[#555555] font-sans text-sm">no hay fases registradas</p>
      </div>
    </div>
  )

  const phase    = phases[phaseIndex]
  const isActive = !phase.end_date
  const phaseColor = PHASE_COLORS[phase.phase_type] || '#888888'

  const phaseEnd   = phase.end_date ? parseDate(phase.end_date) : new Date()
  const phaseStart = parseDate(phase.start_date)

  const phaseWeights = weights
    .filter(w => {
      const d = parseDate(w.date)
      return d >= phaseStart && d <= phaseEnd
    })
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))

  const chartData    = phaseWeights.map(w => ({ date: w.date, weight: parseFloat(w.weight) }))
  const sortedDesc   = [...phaseWeights].sort((a, b) => parseDate(b.date) - parseDate(a.date))
  const currentWeight = sortedDesc[0]?.weight ?? null
  const startWeight   = phaseWeights[0]?.weight ?? null

  const weightGoal = phase.weight_goal ? parseFloat(phase.weight_goal) : null
  const dateGoal   = phase.date_goal ? parseDate(phase.date_goal) : null
  const today      = new Date()

  const daysElapsed = Math.floor((phaseEnd - phaseStart) / (1000 * 60 * 60 * 24))
  const daysLeft    = isActive && dateGoal ? Math.ceil((dateGoal - today) / (1000 * 60 * 60 * 24)) : null
  const totalDays   = isActive && dateGoal ? Math.floor((dateGoal - phaseStart) / (1000 * 60 * 60 * 24)) : null
  const totalWeeks  = totalDays ? totalDays / 7 : null
  const progress    = isActive && totalDays && totalDays > 0 ? Math.max(0, Math.min(1, Math.floor((today - phaseStart) / (1000 * 60 * 60 * 24)) / totalDays)) : null

  const diff   = currentWeight && weightGoal ? (weightGoal - parseFloat(currentWeight)).toFixed(2) : null
  const gained = currentWeight && startWeight ? (parseFloat(currentWeight) - parseFloat(startWeight)).toFixed(2) : null
  const impliedWeeklyGoal = isActive && weightGoal && startWeight && totalWeeks ? ((weightGoal - parseFloat(startWeight)) / totalWeeks) : null
  const weeklyStats = calcWeeklyStats(phaseWeights)

  // Get ALL unique exercises from the full gym history
  const allExercises = [...new Map(
    [...gymLogs]
      .filter(l => l.weight)
      .sort((a, b) => parseDate(b.start_date) - parseDate(a.start_date))
      .map(l => [l.exercise_type_id, l])
  ).values()]

  const gymProgress = allExercises.map(log => {
    const p = calcProgress(gymLogs, log.exercise_type_id, phase.start_date, phase.end_date)
    return { name: log.name, progress: p }
  })
  const validPcts  = gymProgress.filter(e => e.progress.phase !== 0).map(e => e.progress.phase)
  const avgStrength = validPcts.length > 0 ? validPcts.reduce((a, b) => a + b, 0) / validPcts.length : null

  function gainedColor() {
    if (!gained) return '#c8f500'
    const g = parseFloat(gained)
    if (phase.phase_type === 'bulk') return g > 0 ? '#4caf50' : '#f44336'
    if (phase.phase_type === 'cut')  return g < 0 ? '#4caf50' : '#f44336'
    return '#c8f500'
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
        <PageHeader title="FASES" />

        {/* Phase Banner */}
        <div className="relative glass-card-elevated rounded-sm mb-5 overflow-hidden">
          {/* Top + bottom accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: phaseColor }} />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30" style={{ backgroundColor: phaseColor }} />

          {/* Subtle vertical grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
               style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 20px, ${phaseColor} 20px, ${phaseColor} 21px)` }} />

          <div className="relative flex items-center justify-between p-5">
            <button
              onClick={() => setPhaseIndex(i => Math.max(0, i - 1))}
              disabled={phaseIndex === 0}
              className="w-8 h-8 flex items-center justify-center text-[#555555] font-sans text-lg hover:text-[#c8f500] disabled:opacity-20 transition-colors rounded-sm hover:bg-white/5"
            >←</button>

            <div className="text-center flex-1">
              <p className="font-mono text-2xl font-bold tracking-[0.3em] leading-none" style={{ color: phaseColor }}>
                {(PHASE_LABELS[phase.phase_type] || phase.phase_type).toUpperCase()}
              </p>
              <p className="text-[#555555] font-sans text-[10px] mt-2 tracking-wide">
                {phaseStart.toLocaleDateString('es-ES')} → {phase.end_date ? parseDate(phase.end_date).toLocaleDateString('es-ES') : 'hoy'}
              </p>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 mt-2 font-sans text-[10px] tracking-widest px-2 py-0.5 rounded-sm"
                  style={{ color: phaseColor, backgroundColor: `${phaseColor}10`, border: `1px solid ${phaseColor}20` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: phaseColor }} />
                  ACTIVA
                </span>
              )}
            </div>

            <button
              onClick={() => setPhaseIndex(i => Math.min(phases.length - 1, i + 1))}
              disabled={phaseIndex === phases.length - 1}
              className="w-8 h-8 flex items-center justify-center text-[#555555] font-sans text-lg hover:text-[#c8f500] disabled:opacity-20 transition-colors rounded-sm hover:bg-white/5"
            >→</button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <MetricCard label="PESO INICIO" value={startWeight ? `${parseFloat(startWeight).toFixed(2)} kg` : '—'} />
          <MetricCard label={isActive ? 'PESO ACTUAL' : 'PESO FINAL'} value={currentWeight ? `${parseFloat(currentWeight).toFixed(2)} kg` : '—'} />
          <MetricCard
            label="CAMBIO"
            value={gained ? `${gained > 0 ? '+' : ''}${gained} kg` : '—'}
            valueColor={gainedColor()}
          />
          <MetricCard label="DURACIÓN" value={`${daysElapsed} días`} valueColor="#888888" />
          {isActive && weightGoal && (
            <MetricCard label="OBJETIVO" value={`${weightGoal.toFixed(2)} kg`} />
          )}
          {isActive && diff && (
            <MetricCard label="DIFERENCIA" value={`${diff > 0 ? '+' : ''}${diff} kg`} sub="para el objetivo" />
          )}
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="glass-card rounded-sm p-4 mb-4">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em]">PROGRESO TEMPORAL</p>
              <p className="font-sans text-sm font-bold" style={{ color: phaseColor }}>{Math.round(progress * 100)}%</p>
            </div>

            <div className="relative h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: phaseColor,
                  boxShadow: `0 0 12px ${phaseColor}40`,
                }}
              />
            </div>

            {daysLeft !== null && (
              <div className="flex justify-between">
                <p className="text-[#444444] font-sans text-[10px]">{Math.floor((today - phaseStart) / (1000 * 60 * 60 * 24))}d transcurridos</p>
                <p className="font-sans text-[10px]" style={{ color: phaseColor, opacity: 0.7 }}>{daysLeft}d restantes</p>
              </div>
            )}
          </div>
        )}

        {/* Gym performance */}
        <div className="glass-card rounded-sm p-4 mb-4">
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-1">RENDIMIENTO EN GYM</p>
          <p className="text-[#333333] font-sans text-[10px] mb-3">1RM estimado (Epley)</p>
          {gymProgress.length === 0 ? (
            <p className="text-[#444444] font-sans text-xs">sin datos suficientes</p>
          ) : (
            <>
              {avgStrength !== null && (
                <div className="flex items-end gap-3 mb-4">
                  <p className="font-mono text-3xl font-bold" style={{ color: progressColor(avgStrength) }}>
                    {avgStrength > 0 ? '+' : ''}{avgStrength.toFixed(1)}%
                  </p>
                  <p className="text-[#555555] font-sans text-xs mb-1">media fase</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {gymProgress.map((ex, i) => {
                  const phasePct = ex.progress.phase
                  const color = progressColor(phasePct)
                  return (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-[#555555] font-sans text-xs uppercase truncate mr-3">{ex.name}</span>
                      <span className="font-sans text-xs font-bold flex-shrink-0" style={{ color }}>
                        {phasePct > 0 ? '+' : ''}{phasePct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Weekly stats */}
        {weeklyStats && (
          <div className="glass-card rounded-sm p-4 mb-4">
            <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-4">RITMO SEMANAL</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[#444444] font-sans text-[10px] tracking-widest mb-1">MEDIA SEMANAL</p>
                <p className="font-mono text-xl font-bold"
                  style={{ color: impliedWeeklyGoal ? weeklyRateColor(Math.abs(weeklyStats.avgChange), Math.abs(impliedWeeklyGoal)) : '#c8f500' }}>
                  {weeklyStats.avgChange > 0 ? '+' : ''}{weeklyStats.avgChange.toFixed(2)} kg
                </p>
                {impliedWeeklyGoal && (
                  <p className="text-[#444444] font-sans text-[10px] mt-1">
                    objetivo: {impliedWeeklyGoal > 0 ? '+' : ''}{impliedWeeklyGoal.toFixed(2)} kg
                  </p>
                )}
              </div>
              <div>
                <p className="text-[#444444] font-sans text-[10px] tracking-widest mb-1">CONSISTENCIA</p>
                <p className="font-mono text-xl font-bold" style={{ color: consistencyColor(weeklyStats.stdDev) }}>
                  σ {weeklyStats.stdDev.toFixed(2)}
                </p>
                <p className="font-sans text-[10px] mt-1" style={{ color: consistencyColor(weeklyStats.stdDev) }}>
                  {consistencyLabel(weeklyStats.stdDev)}
                </p>
              </div>
            </div>
            {isActive && impliedWeeklyGoal && (
              <div className="mt-4">
                <div className="flex justify-between mb-1.5">
                  <p className="text-[#444444] font-sans text-[10px] tracking-widest">RITMO VS OBJETIVO</p>
                  <p className="font-sans text-xs font-bold" style={{ color: weeklyRateColor(Math.abs(weeklyStats.avgChange), Math.abs(impliedWeeklyGoal)) }}>
                    {((Math.abs(weeklyStats.avgChange) / Math.abs(impliedWeeklyGoal)) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="relative h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all"
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

        {/* Weekly weight history — last 4 weeks */}
        {(() => {
          // Build weekly averages from phase weights (Mon-Sun)
          const byWeek = {}
          phaseWeights.forEach(w => {
            const d = parseDate(w.date)
            const monday = new Date(d)
            const day = d.getDay()
            monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
            monday.setHours(0, 0, 0, 0)
            const key = monday.toISOString().split('T')[0]
            if (!byWeek[key]) byWeek[key] = []
            byWeek[key].push(parseFloat(w.weight))
          })

          const weekKeys = Object.keys(byWeek).sort()
          if (weekKeys.length < 2) return null

          const weeklyAvgs = weekKeys.map(k => ({
            key: k,
            avg: byWeek[k].reduce((a, b) => a + b, 0) / byWeek[k].length,
            count: byWeek[k].length,
          }))

          // Calculate deltas between consecutive weeks
          const deltas = []
          for (let i = 1; i < weeklyAvgs.length; i++) {
            const delta = weeklyAvgs[i].avg - weeklyAvgs[i - 1].avg
            const monday = parseDate(weeklyAvgs[i].key)
            const sunday = new Date(monday)
            sunday.setDate(monday.getDate() + 6)
            deltas.push({
              label: `${monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} – ${sunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
              delta: parseFloat(delta.toFixed(2)),
              count: weeklyAvgs[i].count,
            })
          }

          // Take last 4
          const recent = deltas.slice(-4)
          if (recent.length === 0) return null

          const maxAbs = Math.max(...recent.map(d => Math.abs(d.delta)), 0.1)

          function barColor(d) {
            if (d > 0.2) return '#c8f500'
            if (d < -0.2) return '#ff2d2d'
            return '#ff9f00'
          }

          return (
            <div className="glass-card rounded-sm p-4 mb-4">
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-4">HISTORIAL SEMANAL</p>
              <div className="flex flex-col gap-3">
                {recent.map((w, i) => {
                  const color = barColor(w.delta)
                  const widthPct = Math.max(4, (Math.abs(w.delta) / maxAbs) * 100)
                  const isPositive = w.delta >= 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[#555555] font-sans text-[10px]">{w.label}</span>
                        <span className="font-mono text-xs font-bold" style={{ color }}>
                          {w.delta > 0 ? '+' : ''}{w.delta.toFixed(2)} kg
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}30`,
                            ...(isPositive ? { left: 0 } : { right: 0 }),
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {chartData.length > 1 && (
          <PhaseChart data={chartData} phaseColor={phaseColor} weightGoal={isActive ? weightGoal : null} />
        )}

        {isActive && (
          <button
            onClick={() => onNavigate('editPhaseGoals', phase)}
            className="w-full h-10 glass-card rounded-sm text-[#555555] font-sans text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-all duration-200 mb-4"
          >
            EDITAR OBJETIVOS
          </button>
        )}

        <Separator className="mt-2 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
      </div>
    </div>
  )
}