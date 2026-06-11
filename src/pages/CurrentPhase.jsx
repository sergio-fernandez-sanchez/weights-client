import { readableOnLight } from '../utils/color'
import { SkeletonPage } from "../components/Skeleton"
import { useState, useEffect, useRef } from 'react'
import { getPhases, getWeights, getGymLogs } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import MetricCard from '../components/MetricCard'

const PHASE_COLORS = {
  bulk:        '#a4c400',
  cut:         '#e23535',
  maintenance: '#e88c00',
  unknown:     '#8a8c94',
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

function PhaseChart({ data, phaseColor, weightGoal, weeklyStats }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data.length) return null

  const W = 320, H = 160
  const PAD = { top: 16, right: 12, bottom: 20, left: 38 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const lastWeight = data[data.length - 1].weight
  const lastDate = parseDate(data[data.length - 1].date)

  // Projection: 8 weeks ahead from last data point
  const projectionWeeks = 8
  const projPoints = []
  if (weeklyStats && Math.abs(weeklyStats.avgChange) > 0.01) {
    for (let w = 0; w <= projectionWeeks; w++) {
      const projected = lastWeight + weeklyStats.avgChange * w
      const upper = projected + weeklyStats.stdDev * w
      const lower = projected - weeklyStats.stdDev * w
      projPoints.push({ week: w, projected, upper, lower })
    }
  }

  // Determine value range including goal and projections
  const weights = data.map(d => d.weight)
  const allVals = [...weights]
  if (weightGoal) allVals.push(weightGoal)
  if (projPoints.length > 0) {
    allVals.push(projPoints[projPoints.length - 1].upper)
    allVals.push(projPoints[projPoints.length - 1].lower)
  }
  const minW = Math.min(...allVals), maxW = Math.max(...allVals)
  const range = maxW - minW || 1

  // X positions: data takes first 70% of chart width, projection takes last 30%
  const hasProj = projPoints.length > 0
  const dataXRange = hasProj ? chartW * 0.7 : chartW
  const projXStart = PAD.left + dataXRange

  function xPos(i) { return PAD.left + (i / Math.max(data.length - 1, 1)) * dataXRange }
  function yPos(w) { return PAD.top + chartH - ((w - minW) / range) * chartH }
  function projX(week) { return projXStart + (week / projectionWeeks) * (chartW - dataXRange) }

  const ticks = Array.from({ length: 4 }, (_, i) => {
    const val = minW + (range * i) / 3
    return { val, y: yPos(val) }
  })

  const points = data.map((d, i) => `${xPos(i)},${yPos(d.weight)}`).join(' ')
  const areaPoints = `${xPos(0)},${PAD.top + chartH} ${points} ${xPos(data.length - 1)},${PAD.top + chartH}`
  const goalY = weightGoal ? yPos(weightGoal) : null

  // Projection paths
  const projLine = projPoints.map(p => `${projX(p.week)},${yPos(p.projected)}`).join(' ')
  const uncertaintyPath = projPoints.length > 0
    ? projPoints.map(p => `${projX(p.week)},${yPos(p.upper)}`).join(' ') + ' ' +
      [...projPoints].reverse().map(p => `${projX(p.week)},${yPos(p.lower)}`).join(' ')
    : ''

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left - PAD.left
    const scale = W / rect.width
    const mouseX = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const scaledX = mouseX * scale

    // Only tooltip on actual data, not projection
    if (scaledX < projXStart) {
      const idx = Math.max(0, Math.min(data.length - 1, Math.round(((scaledX - PAD.left) / dataXRange) * (data.length - 1))))
      const d = data[idx]
      setTooltip({ x: xPos(idx), y: yPos(d.weight), weight: d.weight, date: parseDate(d.date).toLocaleDateString('es-ES'), type: 'data' })
    } else if (hasProj) {
      const weekFrac = ((scaledX - projXStart) / (chartW - dataXRange)) * projectionWeeks
      const week = Math.max(0, Math.min(projectionWeeks, Math.round(weekFrac)))
      const p = projPoints[week]
      if (p) {
        const futureDate = new Date(lastDate)
        futureDate.setDate(futureDate.getDate() + week * 7)
        setTooltip({ x: projX(week), y: yPos(p.projected), weight: p.projected, upper: p.upper, lower: p.lower, date: futureDate.toLocaleDateString('es-ES'), type: 'projection' })
      }
    }
  }

  const gradId = `area-grad-${phaseColor.replace('#', '')}`
  const uncertId = `uncertainty-${phaseColor.replace('#', '')}`

  return (
    <div className="glass-card rounded-sm p-4 mb-4 relative overflow-hidden">
      <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-3">EVOLUCIÓN EN ESTA FASE</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full chart-reveal"
        onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={phaseColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={uncertId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor={phaseColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#d6d8e0" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#7a7c84" fontSize="9" fontFamily="'JetBrains Mono', monospace">{t.val.toFixed(1)}{i === ticks.length - 1 ? ' kg' : ''}</text>
          </g>
        ))}

        {/* Projection separator line */}
        {hasProj && (
          <line x1={projXStart} y1={PAD.top} x2={projXStart} y2={H - PAD.bottom}
            stroke="#d6d8e0" strokeWidth="1" strokeDasharray="2,4" />
        )}

        {/* Goal line */}
        {goalY && (
          <line x1={PAD.left} y1={goalY} x2={W - PAD.right} y2={goalY}
            stroke={phaseColor} strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.4" />
        )}

        {/* Uncertainty zone */}
        {uncertaintyPath && (
          <polygon points={uncertaintyPath} fill={`url(#${uncertId})`} />
        )}

        {/* Projection line */}
        {projLine && (
          <polyline points={projLine} fill="none" stroke={phaseColor} strokeWidth="1.5"
            strokeDasharray="4,3" strokeOpacity="0.5" strokeLinejoin="round" />
        )}

        {/* Actual data area */}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />

        {/* Actual data line */}
        <polyline points={points} fill="none" stroke={phaseColor} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {data.length <= 30 && data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d.weight)} r="2" fill={phaseColor} />
        ))}

        {/* Connection dot between data and projection */}
        {hasProj && (
          <circle cx={xPos(data.length - 1)} cy={yPos(lastWeight)} r="3" fill={phaseColor} stroke="#d6d8e0" strokeWidth="1.5" />
        )}

        {/* Tooltip */}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
              stroke={tooltip.type === 'projection' ? phaseColor : phaseColor} strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="none" stroke={phaseColor} strokeWidth="2" strokeOpacity={tooltip.type === 'projection' ? 0.5 : 1} />
            <circle cx={tooltip.x} cy={tooltip.y} r="2.5" fill={phaseColor} opacity={tooltip.type === 'projection' ? 0.5 : 1} />
          </>
        )}
      </svg>

      {/* Tooltip box */}
      {tooltip && (
        <div className="absolute top-10 right-4 glass-tooltip rounded-sm px-3 py-2 font-sans text-xs pointer-events-none">
          <p className="text-[#666666]">{tooltip.date}</p>
          <p className="font-bold text-sm" style={{ color: phaseColor, opacity: tooltip.type === 'projection' ? 0.7 : 1 }}>
            {tooltip.weight.toFixed(2)} kg {tooltip.type === 'projection' && <span className="text-[9px] font-normal opacity-50">proyección</span>}
          </p>
          {tooltip.type === 'projection' && tooltip.upper && (
            <p className="text-[#444444] text-[10px]">{tooltip.lower.toFixed(1)} – {tooltip.upper.toFixed(1)} kg</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {weightGoal && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t border-dashed" style={{ borderColor: phaseColor, opacity: 0.5 }} />
            <p className="text-[#555555] font-sans text-[10px]">objetivo: {parseFloat(weightGoal).toFixed(2)} kg</p>
          </div>
        )}
        {hasProj && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t border-dashed" style={{ borderColor: phaseColor, opacity: 0.3 }} />
            <p className="text-[#444444] font-sans text-[10px]">proyección ± σ</p>
          </div>
        )}
      </div>
    </div>
  )
}

function calcWeeklyStats(phaseWeights) {
  if (phaseWeights.length < 2) return null
  const sorted = [...phaseWeights].sort((a, b) => parseDate(a.date) - parseDate(b.date))

  // Agrupa por semana (lunes) para calcular medias y la desviación
  const byWeek = {}
  sorted.forEach(w => {
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
    return { key: k, avg: vals.reduce((a, b) => a + b, 0) / vals.length }
  })

  // Ritmo real = (media última semana - media primera semana) / semanas entre ellas
  const firstWeekAvg = weeklyAvgs[0].avg
  const lastWeekAvg  = weeklyAvgs[weeklyAvgs.length - 1].avg
  const firstDate    = parseDate(weeklyAvgs[0].key)
  const lastDate     = parseDate(weeklyAvgs[weeklyAvgs.length - 1].key)
  const weeksBetween = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 7)
  const avgChange    = weeksBetween > 0 ? (lastWeekAvg - firstWeekAvg) / weeksBetween : 0

  // Desviación estándar de los cambios semana a semana (para consistencia)
  const weeklyChanges = []
  for (let i = 1; i < weeklyAvgs.length; i++) {
    weeklyChanges.push(weeklyAvgs[i].avg - weeklyAvgs[i - 1].avg)
  }
  const variance = weeklyChanges.length > 0
    ? weeklyChanges.reduce((acc, v) => acc + Math.pow(v - avgChange, 2), 0) / weeklyChanges.length
    : 0

  return {
    avgChange,
    stdDev: Math.sqrt(variance),
    weeklyAvgs, // para el historial semanal
  }
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
  if (pct > 2) return '#3a9d4e'
  if (pct < -2) return '#d92020'
  return '#b87400'
}

export default function CurrentPhase({ onNavigate }) {
  const [phases, setPhases]         = useState([])
  const [weights, setWeights]       = useState([])
  const [gymLogs, setGymLogs]       = useState([])
  const [phaseIndex, setPhaseIndex] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [touchStart, setTouchStart]   = useState(null)

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
    <SkeletonPage />
  )

  if (!phases.length) return (
    <div className="min-h-screen px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton />
        <PageHeader title="FASES" />
        <p className="text-[#555555] font-sans text-sm">no hay fases registradas</p>
      </div>
    </div>
  )

  const phase    = phases[phaseIndex]
  const isActive = !phase.end_date
  const phaseColor = readableOnLight(PHASE_COLORS[phase.phase_type] || '#71727a')

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

  // Progreso hacia el objetivo de peso: inicio → actual → objetivo (con signo).
  const goalPct = (() => {
    if (currentWeight == null || startWeight == null || weightGoal == null) return null
    const total = weightGoal - parseFloat(startWeight)
    const done = parseFloat(currentWeight) - parseFloat(startWeight)
    if (Math.abs(total) < 0.01) return parseFloat(currentWeight) === weightGoal ? 1 : 0
    return Math.max(0, Math.min(1, done / total))
  })()
  const impliedWeeklyGoal = isActive && weightGoal && startWeight && totalWeeks ? ((weightGoal - parseFloat(startWeight)) / totalWeeks) : null
  const weeksLeft = daysLeft ? daysLeft / 7 : null
  const requiredWeeklyRate = isActive && currentWeight && weightGoal && weeksLeft && weeksLeft > 0
    ? (weightGoal - parseFloat(currentWeight)) / weeksLeft
    : null
  const weeklyStats = calcWeeklyStats(phaseWeights)

  // ETA: estimated arrival date based on current weekly rate
  const eta = (() => {
    if (!isActive || !weeklyStats || !currentWeight || !weightGoal) return null
    const remaining = weightGoal - parseFloat(currentWeight)
    // If already at or past goal
    if ((weeklyStats.avgChange > 0 && remaining <= 0) || (weeklyStats.avgChange < 0 && remaining >= 0)) {
      return { reached: true }
    }
    // If moving in wrong direction or no movement
    if (Math.abs(weeklyStats.avgChange) < 0.01) return { reachable: false, reason: 'sin cambio semanal' }
    if ((remaining > 0 && weeklyStats.avgChange < 0) || (remaining < 0 && weeklyStats.avgChange > 0)) {
      return { reachable: false, reason: 'dirección contraria' }
    }
    const weeksToGoal = remaining / weeklyStats.avgChange
    const etaDate = new Date()
    etaDate.setDate(etaDate.getDate() + Math.round(weeksToGoal * 7))
    // Compare with date goal
    let vsGoal = null
    if (dateGoal) {
      const diffDays = Math.round((etaDate - dateGoal) / (1000 * 60 * 60 * 24))
      const diffWeeks = Math.round(diffDays / 7)
      vsGoal = { diffDays, diffWeeks }
    }
    return { reachable: true, date: etaDate, vsGoal }
  })()

  // ETA: estimated arrival date based on current weekly rate
  const etaDate = (() => {
    if (!isActive || !weeklyStats || !currentWeight || !weightGoal) return null
    const remaining = weightGoal - parseFloat(currentWeight)
    if (Math.abs(weeklyStats.avgChange) < 0.01) return null // no movement
    // Check direction: if avgChange goes opposite direction to remaining, it'll never arrive
    if ((remaining > 0 && weeklyStats.avgChange <= 0) || (remaining < 0 && weeklyStats.avgChange >= 0)) return 'never'
    const weeksNeeded = remaining / weeklyStats.avgChange
    const eta = new Date()
    eta.setDate(eta.getDate() + Math.round(weeksNeeded * 7))
    return eta
  })()

  const etaDiffWeeks = (() => {
    if (!etaDate || etaDate === 'never' || !dateGoal) return null
    const diffMs = etaDate.getTime() - dateGoal.getTime()
    return parseFloat((diffMs / (1000 * 60 * 60 * 24 * 7)).toFixed(1))
  })()

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
    if (!gained) return '#5f8a00'
    const g = parseFloat(gained)
    if (g > 0) return '#3a9d4e'   // ganó peso → verde
    if (g < 0) return '#d92020'   // perdió peso → rojo
    return '#71727a'
  }

  function weeklyRateColor(actual, goal) {
    if (!goal) return '#5f8a00'
    const ratio = actual / goal
    if (ratio >= 0.7 && ratio <= 1.3) return '#3a9d4e'
    if (ratio >= 0.4 && ratio <= 1.6) return '#b87400'
    return '#d92020'
  }

  function consistencyColor(std) {
    if (std < 0.3) return '#3a9d4e'
    if (std < 0.6) return '#b87400'
    return '#d92020'
  }

  function consistencyLabel(std) {
    if (std < 0.3) return 'muy consistente'
    if (std < 0.6) return 'moderado'
    return 'irregular'
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton />
        <PageHeader title="FASES" />

        {/* Compare phases button — prominent */}
        <button
          onClick={() => onNavigate('phaseComparison')}
          className="w-full glass-card glass-sheen card-hover click-press rounded-sm p-3 mb-5 flex items-center justify-between group transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#252525] group-hover:border-[#c8f500] transition-colors"
              style={{ backgroundColor: `${phaseColor}08` }}>
              <span className="font-mono text-sm" style={{ color: phaseColor }}>◈</span>
            </span>
            <div className="text-left">
              <p className="text-[#999999] font-sans text-xs font-bold tracking-[0.1em] group-hover:text-[#c8f500] transition-colors">COMPARAR FASES</p>
              <p className="text-[#333333] font-sans text-[10px]">{phases.length} fase{phases.length !== 1 ? 's' : ''} registrada{phases.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors">›</span>
        </button>

        {/* Phase Banner */}
        <div className="relative glass-card-elevated rounded-sm mb-5 overflow-hidden"
          onTouchStart={e => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touchStart === null) return
            const diff = e.changedTouches[0].clientX - touchStart
            if (diff > 60 && phaseIndex > 0) setPhaseIndex(i => i - 1)
            if (diff < -60 && phaseIndex < phases.length - 1) setPhaseIndex(i => i + 1)
            setTouchStart(null)
          }}>
          {/* Top + bottom accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: phaseColor }} />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30" style={{ backgroundColor: phaseColor }} />

          {/* Subtle vertical grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
               style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 20px, ${phaseColor} 20px, ${phaseColor} 21px)` }} />

          <div className="relative flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={() => setPhaseIndex(i => Math.max(0, i - 1))}
              disabled={phaseIndex === 0}
              className="w-8 h-8 flex items-center justify-center text-[#80828a] font-sans text-lg hover:text-[#5f8a00] disabled:opacity-20 transition-colors rounded-sm click-press"
            >‹</button>

            <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold tracking-[0.14em] px-2.5 py-1 rounded-lg"
              style={{ color: phaseColor, backgroundColor: `${phaseColor}1a`, border: `1px solid ${phaseColor}33` }}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: phaseColor }} />}
              {(PHASE_LABELS[phase.phase_type] || phase.phase_type).toUpperCase()} · {isActive ? `día ${daysElapsed} · ACTIVA` : `${daysElapsed}d`}
            </span>

            <button
              onClick={() => setPhaseIndex(i => Math.min(phases.length - 1, i + 1))}
              disabled={phaseIndex === phases.length - 1}
              className="w-8 h-8 flex items-center justify-center text-[#80828a] font-sans text-lg hover:text-[#5f8a00] disabled:opacity-20 transition-colors rounded-sm click-press"
            >›</button>
          </div>

          {/* Ring + side stats */}
          <div className="relative flex items-center gap-5 px-5 pb-5 pt-1">
            <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
              <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(70,80,115,0.12)" strokeWidth="8" />
                {goalPct !== null && (
                  <circle cx="60" cy="60" r="52" fill="none" stroke={phaseColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={(1 - goalPct) * 2 * Math.PI * 52}
                    style={{ filter: `drop-shadow(0 0 5px ${phaseColor}73)`, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.32,0.72,0,1)' }} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {currentWeight != null ? (
                  <>
                    <span className="font-mono font-bold leading-none" style={{ color: phaseColor, fontSize: '26px' }}>{parseFloat(currentWeight).toFixed(1)}</span>
                    {weightGoal != null
                      ? <span className="font-mono text-[9px] text-[#8a8c94] mt-0.5">de {weightGoal.toFixed(1)} kg</span>
                      : <span className="font-mono text-[9px] text-[#8a8c94] mt-0.5">kg</span>}
                    {goalPct !== null && <span className="font-mono text-[9px] mt-0.5" style={{ color: phaseColor }}>{Math.round(goalPct * 100)}%</span>}
                  </>
                ) : (
                  <span className="font-mono text-2xl font-bold text-[#8a8c94]">—</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[8px] tracking-[0.15em] uppercase text-[#6c6e76]">inicio</span>
                <span className="font-mono text-[13px] font-semibold text-[#41434a]">{startWeight != null ? `${parseFloat(startWeight).toFixed(2)} kg` : '—'}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[8px] tracking-[0.15em] uppercase text-[#6c6e76]">cambio</span>
                <span className="font-mono text-[13px] font-bold" style={{ color: gainedColor() }}>{gained ? `${parseFloat(gained) > 0 ? '+' : ''}${gained} kg` : '—'}</span>
              </div>
              {isActive && diff && (
                <div className="flex justify-between items-baseline">
                  <span className="font-sans text-[8px] tracking-[0.15em] uppercase text-[#6c6e76]">restante</span>
                  <span className="font-mono text-[13px] font-bold text-[#b87400]">{diff > 0 ? '+' : ''}{diff} kg</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[8px] tracking-[0.15em] uppercase text-[#6c6e76]">{isActive ? 'duración' : 'final'}</span>
                <span className="font-mono text-[13px] font-semibold text-[#41434a]">{isActive ? `${daysElapsed} días` : (currentWeight != null ? `${parseFloat(currentWeight).toFixed(2)} kg` : '—')}</span>
              </div>
              <p className="font-sans text-[9px] text-[#8a8c94] mt-0.5">
                {phaseStart.toLocaleDateString('es-ES')} → {phase.end_date ? parseDate(phase.end_date).toLocaleDateString('es-ES') : 'hoy'}
              </p>
            </div>
          </div>
        </div>

        {/* Chips: ritmo actual / necesario / gym / eta */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {isActive && (
            <div className="glass-card glass-sheen rounded-sm p-3" style={{ borderLeft: `3px solid ${phaseColor}` }}>
              <p className="text-[#6c6e76] font-sans text-[8px] tracking-[0.15em] uppercase mb-1">Ritmo actual</p>
              <p className="font-mono text-base font-bold" style={{ color: weeklyStats ? (impliedWeeklyGoal ? weeklyRateColor(Math.abs(weeklyStats.avgChange), Math.abs(impliedWeeklyGoal)) : phaseColor) : '#94959c' }}>
                {weeklyStats ? `${weeklyStats.avgChange > 0 ? '+' : ''}${weeklyStats.avgChange.toFixed(2)}` : '—'} <span className="text-[9px] font-normal opacity-60">kg/sem</span>
              </p>
            </div>
          )}
          {isActive && (
            <div className="glass-card glass-sheen rounded-sm p-3" style={{ borderLeft: `3px solid ${phaseColor}` }}>
              <p className="text-[#6c6e76] font-sans text-[8px] tracking-[0.15em] uppercase mb-1">Ritmo necesario</p>
              <p className="font-mono text-base font-bold" style={{ color: impliedWeeklyGoal ? phaseColor : '#94959c' }}>
                {impliedWeeklyGoal ? `${impliedWeeklyGoal > 0 ? '+' : ''}${impliedWeeklyGoal.toFixed(2)}` : '—'} <span className="text-[9px] font-normal opacity-60">kg/sem</span>
              </p>
            </div>
          )}
          {avgStrength !== null && (
            <div className="glass-card glass-sheen rounded-sm p-3" style={{ borderLeft: `3px solid ${progressColor(avgStrength)}` }}>
              <p className="text-[#6c6e76] font-sans text-[8px] tracking-[0.15em] uppercase mb-1">Gym media fase</p>
              <p className="font-mono text-base font-bold" style={{ color: progressColor(avgStrength) }}>
                {avgStrength > 0 ? '+' : ''}{avgStrength.toFixed(1)}<span className="text-[9px] font-normal opacity-60">%</span>
              </p>
            </div>
          )}
          {isActive && weightGoal && (
            <div className="glass-card glass-sheen rounded-sm p-3" style={{ borderLeft: '3px solid #b87400' }}>
              <p className="text-[#6c6e76] font-sans text-[8px] tracking-[0.15em] uppercase mb-1">Llegada (ETA)</p>
              <p className="font-mono text-base font-bold text-[#41434a]">
                {etaDate === 'never' ? '∞' : etaDate ? etaDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
              </p>
            </div>
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

        {/* Weekly stats — diseño C: comparador visual */}
        {isActive && (
          <div className="glass-card rounded-sm p-4 mb-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-sm"
              style={{ background: `linear-gradient(90deg, ${phaseColor}, transparent)`, opacity: 0.7 }} />

            <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-4">RITMO SEMANAL</p>

            {/* Comparador: 3 barras sobre el mismo eje */}
            <div className="flex flex-col gap-2.5 mb-4">
              {/* Ritmo actual */}
              {(() => {
                const val = weeklyStats?.avgChange
                const color = val != null
                  ? (impliedWeeklyGoal ? weeklyRateColor(Math.abs(val), Math.abs(impliedWeeklyGoal)) : '#5f8a00')
                  : '#94959c'
                const maxVal = Math.max(
                  Math.abs(weeklyStats?.avgChange || 0),
                  Math.abs(impliedWeeklyGoal || 0),
                  Math.abs(requiredWeeklyRate || 0),
                  0.1
                )
                const pct = val != null ? Math.min(100, (Math.abs(val) / maxVal) * 100) : 0
                return (
                  <div className="flex gap-3 items-center">
                    <span className="font-sans text-[9px] text-[#8a8c94] tracking-[0.08em] w-[72px] text-right flex-shrink-0">ACTUAL</span>
                    <div className="flex-1 h-3 rounded-full bg-[rgba(70,80,115,0.1)] overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                    </div>
                    <span className="font-mono text-sm font-bold w-[48px] flex-shrink-0" style={{ color }}>
                      {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(2)}` : '—'}
                    </span>
                  </div>
                )
              })()}

              {/* Ritmo necesario (inicio → objetivo) */}
              {(() => {
                const val = impliedWeeklyGoal
                const color = phaseColor
                const maxVal = Math.max(
                  Math.abs(weeklyStats?.avgChange || 0),
                  Math.abs(impliedWeeklyGoal || 0),
                  Math.abs(requiredWeeklyRate || 0),
                  0.1
                )
                const pct = val != null ? Math.min(100, (Math.abs(val) / maxVal) * 100) : 0
                return (
                  <div className="flex gap-3 items-center">
                    <span className="font-sans text-[9px] text-[#8a8c94] tracking-[0.08em] w-[72px] text-right flex-shrink-0">NECESARIO</span>
                    <div className="flex-1 h-3 rounded-full bg-[rgba(70,80,115,0.1)] overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                    </div>
                    <span className="font-mono text-sm font-bold w-[48px] flex-shrink-0" style={{ color: val ? phaseColor : '#94959c' }}>
                      {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(2)}` : '—'}
                    </span>
                  </div>
                )
              })()}

              {/* Ritmo necesario restante (actual → objetivo) */}
              {(() => {
                const val = requiredWeeklyRate
                const color = '#3a9d4e'
                const maxVal = Math.max(
                  Math.abs(weeklyStats?.avgChange || 0),
                  Math.abs(impliedWeeklyGoal || 0),
                  Math.abs(requiredWeeklyRate || 0),
                  0.1
                )
                const pct = val != null ? Math.min(100, (Math.abs(val) / maxVal) * 100) : 0
                return (
                  <div className="flex gap-3 items-center">
                    <span className="font-sans text-[9px] text-[#8a8c94] tracking-[0.08em] w-[72px] text-right flex-shrink-0">RESTANTE</span>
                    <div className="flex-1 h-3 rounded-full bg-[rgba(70,80,115,0.1)] overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                    </div>
                    <span className="font-mono text-sm font-bold w-[48px] flex-shrink-0" style={{ color: val ? color : '#94959c' }}>
                      {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(2)}` : '—'}
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Leyenda kg/sem */}
            <p className="font-sans text-[8px] text-[#9a9ba2] tracking-[0.1em] text-right mb-3">kg/sem</p>

            <div className="h-px bg-gradient-to-r from-transparent via-[rgba(70,80,115,0.14)] to-transparent mb-3" />

            {/* Consistencia como semáforo */}
            {weeklyStats && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-[9px] text-[#8a8c94] tracking-[0.15em] uppercase mb-0.5">Consistencia</p>
                  <p className="font-sans text-[10px]" style={{ color: consistencyColor(weeklyStats.stdDev) }}>
                    σ {weeklyStats.stdDev.toFixed(2)} kg/sem
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: consistencyColor(weeklyStats.stdDev) === '#3a9d4e' ? '#3a9d4e' : 'rgba(70,80,115,0.15)', boxShadow: consistencyColor(weeklyStats.stdDev) === '#3a9d4e' ? '0 0 5px #3a9d4e' : 'none' }} />
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: consistencyColor(weeklyStats.stdDev) === '#b87400' ? '#b87400' : 'rgba(70,80,115,0.15)', boxShadow: consistencyColor(weeklyStats.stdDev) === '#b87400' ? '0 0 5px #b87400' : 'none' }} />
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: consistencyColor(weeklyStats.stdDev) === '#d92020' ? '#d92020' : 'rgba(70,80,115,0.15)', boxShadow: consistencyColor(weeklyStats.stdDev) === '#d92020' ? '0 0 5px #d92020' : 'none' }} />
                  </div>
                  <span className="font-mono text-sm font-bold" style={{ color: consistencyColor(weeklyStats.stdDev) }}>
                    {consistencyLabel(weeklyStats.stdDev).toUpperCase()}
                  </span>
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

          // Historial completo: media de cada semana + variación respecto a la anterior
          const allWeeks = weeklyAvgs.map((w, i) => {
            const monday = parseDate(w.key)
            const sunday = new Date(monday)
            sunday.setDate(monday.getDate() + 6)
            const delta = i > 0 ? parseFloat((w.avg - weeklyAvgs[i - 1].avg).toFixed(2)) : null
            return {
              label: `${monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
              avg: parseFloat(w.avg.toFixed(2)),
              delta,
            }
          })

          if (allWeeks.length === 0) return null

          const maxAbs = Math.max(...allWeeks.filter(w => w.delta !== null).map(w => Math.abs(w.delta)), 0.1)

          function barColor(d) {
            if (d > 0.1) return '#3a9d4e'
            if (d < -0.1) return '#d92020'
            return '#b87400'
          }

          return (
            <div className="glass-card rounded-sm p-4 mb-4">
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-4">HISTORIAL SEMANAL</p>
              <div className="flex flex-col gap-0">
                {/* Header */}
                <div className="flex items-center gap-2 pb-2 mb-1 border-b border-[rgba(70,80,115,0.1)]">
                  <span className="font-sans text-[8px] text-[#9a9ba2] tracking-[0.12em] w-[38px]">SEM</span>
                  <span className="font-sans text-[8px] text-[#9a9ba2] tracking-[0.12em] flex-1">VARIACIÓN</span>
                  <span className="font-sans text-[8px] text-[#9a9ba2] tracking-[0.12em] w-[52px] text-right">MEDIA</span>
                  <span className="font-sans text-[8px] text-[#9a9ba2] tracking-[0.12em] w-[44px] text-right">Δ</span>
                </div>
                {allWeeks.map((w, i) => {
                  const color = w.delta !== null ? barColor(w.delta) : '#8a8c94'
                  const widthPct = w.delta !== null ? Math.max(4, (Math.abs(w.delta) / maxAbs) * 100) : 0
                  const isPos = w.delta !== null && w.delta >= 0
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-[rgba(70,80,115,0.06)] last:border-0">
                      <span className="font-mono text-[9px] text-[#8a8c94] w-[38px] flex-shrink-0">{w.label}</span>
                      <div className="flex-1 relative h-[5px] bg-[rgba(70,80,115,0.1)] rounded-full overflow-hidden">
                        {w.delta !== null && (
                          <>
                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[rgba(70,80,115,0.2)]" />
                            <div className="absolute inset-y-0 rounded-full transition-all duration-500"
                              style={{
                                width: `${widthPct / 2}%`,
                                backgroundColor: color,
                                ...(isPos ? { left: '50%' } : { right: '50%' }),
                              }} />
                          </>
                        )}
                      </div>
                      <span className="font-mono text-[10px] font-semibold w-[52px] text-right flex-shrink-0" style={{ color: '#41434a' }}>
                        {w.avg.toFixed(2)} kg
                      </span>
                      <span className="font-mono text-[10px] font-bold w-[44px] text-right flex-shrink-0" style={{ color }}>
                        {w.delta !== null ? `${w.delta > 0 ? '+' : ''}${w.delta.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {chartData.length > 1 && (
          <PhaseChart data={chartData} phaseColor={phaseColor} weightGoal={isActive ? weightGoal : null} weeklyStats={isActive ? weeklyStats : null} />
        )}

        {isActive && (
          <button
            onClick={() => onNavigate('editPhaseGoals', phase)}
            className="w-full h-10 glass-card glass-sheen card-hover click-press rounded-sm text-[#6c6e76] font-sans text-xs transition-all duration-200 mb-4"
          >
            EDITAR OBJETIVOS
          </button>
        )}

        <Separator className="mt-2 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}