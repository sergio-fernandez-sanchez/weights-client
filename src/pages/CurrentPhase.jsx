import { useState, useEffect, useRef } from 'react'
import { getPhases, getWeights, getGymLogs, getActiveGymLogs } from '../api/client'
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
  for (let i = 1; i < weeklyAvgs.length; i++) weeklyChanges.push(weeklyAvgs[i] - weeklyAvgs[i - 1])
  const avgChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length
  const variance = weeklyChanges.reduce((acc, v) => acc + Math.pow(v - avgChange, 2), 0) / weeklyChanges.length
  return { avgChange, stdDev: Math.sqrt(variance) }
}

function calcProgress(allLogs, exerciseTypeId, phaseStartDate, phaseEndDate) {
  const phaseEnd = phaseEndDate ? parseDate(phaseEndDate) : new Date()
  const history = allLogs
    .filter(l => l.exercise_type_id === exerciseTypeId && l.weight)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
  if (history.length < 2) return { phase: null, noData: true }

  // Para fases pasadas, current = último log antes del fin de la fase
  const logsUntilEnd = history.filter(l => parseDate(l.start_date) <= phaseEnd)
  if (logsUntilEnd.length < 1) return { phase: null, noData: true }
  const current = logsUntilEnd[logsUntilEnd.length - 1]

  const phaseStart = parseDate(phaseStartDate)
  const phaseHistory = logsUntilEnd.filter(l => parseDate(l.start_date) >= phaseStart)
  const beforePhase  = history.filter(l => parseDate(l.start_date) < phaseStart)

  let baseLog = null
  if (phaseHistory.length >= 2) baseLog = phaseHistory[0]
  else if (phaseHistory.length === 1 && beforePhase.length > 0) baseLog = beforePhase[beforePhase.length - 1]

  if (!baseLog || baseLog.id === current.id) return { phase: null, noData: true }

  const rmBase = oneRM(baseLog)
  const rmCurr = oneRM(current)
  if (!rmBase || !rmCurr) return { phase: null, noData: true }

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
  const [activeGymLogs, setActiveGymLogs] = useState([])
  const [phaseIndex, setPhaseIndex] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [phasesData, weightData, gymData, activeGymData] = await Promise.all([
          getPhases(), getWeights(), getGymLogs(), getActiveGymLogs()
        ])
        const sorted = [...phasesData].sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
        setPhases(sorted)
        setWeights(weightData)
        setGymLogs(gymData)
        setActiveGymLogs(activeGymData)
        setPhaseIndex(sorted.length - 1) // empezar en la fase más reciente
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

  if (!phases.length) return (
    <div className="min-h-screen px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// FASES" />
        <p className="text-[#888888] font-mono text-sm">no hay fases registradas</p>
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

  // Gym progress — para fases pasadas usar logs hasta el fin de la fase
  const logsForGym = isActive ? activeGymLogs : [...new Map(
    gymLogs
      .filter(l => parseDate(l.start_date) <= phaseEnd)
      .sort((a, b) => parseDate(b.start_date) - parseDate(a.start_date))
      .map(l => [l.exercise_type_id, l])
  ).values()]

  const gymProgress = logsForGym.map(log => {
    const p = calcProgress(gymLogs, log.exercise_type_id, phase.start_date, phase.end_date)
    return { name: log.name, progress: p }
  })
  const validPcts  = gymProgress.filter(e => !e.progress.noData && e.progress.phase !== null).map(e => e.progress.phase)
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
        <PageHeader title="// FASES" />

        {/* Navegador de fases */}
        <div className="flex items-center justify-between bg-[#141414] border border-[#333333] p-4 mb-4">
          <button
            onClick={() => setPhaseIndex(i => Math.max(0, i - 1))}
            disabled={phaseIndex === 0}
            className="text-[#888888] font-mono text-lg hover:text-[#c8f500] disabled:opacity-20 transition-colors px-2"
          >←</button>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold" style={{ color: phaseColor }}>
              {phase.phase_type.toUpperCase()}
            </p>
            <p className="text-[#888888] font-mono text-xs mt-1">
              {phaseStart.toLocaleDateString('es-ES')} — {phase.end_date ? parseDate(phase.end_date).toLocaleDateString('es-ES') : 'hoy'}
            </p>
          </div>
          <button
            onClick={() => setPhaseIndex(i => Math.min(phases.length - 1, i + 1))}
            disabled={phaseIndex === phases.length - 1}
            className="text-[#888888] font-mono text-lg hover:text-[#c8f500] disabled:opacity-20 transition-colors px-2"
          >→</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard label="PESO INICIO" value={startWeight ? `${parseFloat(startWeight).toFixed(2)} kg` : '—'} />
          <MetricCard label={isActive ? 'PESO ACTUAL' : 'PESO FINAL'} value={currentWeight ? `${parseFloat(currentWeight).toFixed(2)} kg` : '—'} />
          <MetricCard
            label="CAMBIO"
            value={gained ? `${gained > 0 ? '+' : ''}${gained} kg` : '—'}
            valueColor={gainedColor()}
          />
          <MetricCard label="DURACIÓN" value={`${daysElapsed} días`} />
          {isActive && weightGoal && (
            <MetricCard label="OBJETIVO" value={`${weightGoal.toFixed(2)} kg`} />
          )}
          {isActive && diff && (
            <MetricCard label="DIFERENCIA" value={`${diff > 0 ? '+' : ''}${diff} kg`} sub="para el objetivo" />
          )}

        </div>

        {/* Barra de progreso — solo fase activa */}
        {progress !== null && (
          <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
            <div className="flex justify-between mb-2">
              <p className="text-[#888888] font-mono text-xs">PROGRESO TEMPORAL</p>
              <p className="text-[#c8f500] font-mono text-xs">{Math.round(progress * 100)}%</p>
            </div>
            <div className="w-full bg-[#333333] h-2 mb-2">
              <div className="h-2 transition-all" style={{ width: `${progress * 100}%`, backgroundColor: phaseColor }} />
            </div>
            {daysLeft !== null && (
              <div className="flex justify-between">
                <p className="text-[#555555] font-mono text-xs">{Math.floor((today - phaseStart) / (1000 * 60 * 60 * 24))} días transcurridos</p>
                <p className="text-[#888888] font-mono text-xs">{daysLeft} días restantes</p>
              </div>
            )}
          </div>
        )}

        {/* Rendimiento gym */}
        <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
          <p className="text-[#888888] font-mono text-xs mb-1">RENDIMIENTO EN GYM</p>
          <p className="text-[#555555] font-mono text-xs mb-3">1RM estimado (Epley)</p>
          {gymProgress.length === 0 ? (
            <p className="text-[#555555] font-mono text-xs">sin datos suficientes</p>
          ) : (
            <>
              {avgStrength !== null && (
                <div className="flex items-end gap-3 mb-3">
                  <p className="font-mono text-3xl font-bold" style={{ color: progressColor(avgStrength) }}>
                    {avgStrength > 0 ? '+' : ''}{avgStrength.toFixed(1)}%
                  </p>
                  <p className="text-[#888888] font-mono text-xs mb-1">media fase</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                {gymProgress.map((ex, i) => {
                  const phasePct  = ex.progress.noData ? null : ex.progress.phase
                  const displayPct = phasePct ?? 0
                  return (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[#555555] font-mono text-xs uppercase truncate mr-2">{ex.name}</span>
                      <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: progressColor(displayPct) }}>
                        {phasePct !== null ? `${phasePct > 0 ? '+' : ''}${phasePct.toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Ritmo semanal */}
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
            {isActive && impliedWeeklyGoal && (
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
          <PhaseChart data={chartData} phaseColor={phaseColor} weightGoal={isActive ? weightGoal : null} />
        )}

        {/* Botón editar objetivos — solo fase activa */}
        {isActive && (
          <button
            onClick={() => onNavigate('editPhaseGoals', phase)}
            className="w-full h-10 bg-transparent border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors mb-4"
          >
            // EDITAR OBJETIVOS
          </button>
        )}

        <Separator className="mt-2 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}