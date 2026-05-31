import { useState, useEffect } from 'react'
import { getPhases, getWeights, getGymLogs } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'

const PHASE_COLORS = { bulk: '#a4c400', cut: '#e23535', maintenance: '#e88c00' }
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTEN.' }

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function calcPhaseStats(phase, weights, gymLogs) {
  const phaseStart = parseDate(phase.start_date)
  const phaseEnd = phase.end_date ? parseDate(phase.end_date) : new Date()
  const days = Math.max(1, Math.round((phaseEnd - phaseStart) / (1000 * 60 * 60 * 24)))
  const weeks = days / 7

  // Weight
  const phaseWeights = weights
    .filter(w => { const d = parseDate(w.date); return d >= phaseStart && d <= phaseEnd })
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))

  const startW = phaseWeights.length > 0 ? parseFloat(phaseWeights[0].weight) : null
  const endW = phaseWeights.length > 0 ? parseFloat(phaseWeights[phaseWeights.length - 1].weight) : null
  const delta = startW && endW ? parseFloat((endW - startW).toFixed(2)) : null
  const weeklyRate = delta !== null && weeks > 0 ? parseFloat((delta / weeks).toFixed(2)) : null

  // Gym — average 1RM change during phase
  const exerciseIds = [...new Set(gymLogs.filter(l => l.weight).map(l => l.exercise_type_id))]
  const pcts = []
  exerciseIds.forEach(exId => {
    const history = gymLogs
      .filter(l => l.exercise_type_id === exId && l.weight)
      .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
    const phaseHistory = history.filter(l => { const d = parseDate(l.start_date); return d >= phaseStart && d <= phaseEnd })
    const beforePhase = history.filter(l => parseDate(l.start_date) < phaseStart)
    if (phaseHistory.length === 0) return
    const current = phaseHistory[phaseHistory.length - 1]
    let baseLog = null
    if (phaseHistory.length >= 2) baseLog = phaseHistory[0]
    else if (beforePhase.length > 0) baseLog = beforePhase[beforePhase.length - 1]
    if (!baseLog || baseLog.id === current.id) return
    const rmBase = oneRM(baseLog), rmCurr = oneRM(current)
    if (!rmBase || !rmCurr) return
    pcts.push(((rmCurr - rmBase) / rmBase) * 100)
  })
  const gymPct = pcts.length > 0 ? parseFloat((pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(1)) : null

  return { days, weeks, startW, endW, delta, weeklyRate, gymPct, weightsCount: phaseWeights.length }
}

function PhaseCard({ phase, stats, maxDays, isActive }) {
  const color = PHASE_COLORS[phase.phase_type] || '#71727a'
  const label = PHASE_LABELS[phase.phase_type] || phase.phase_type
  const phaseStart = parseDate(phase.start_date)
  const barWidth = maxDays > 0 ? Math.max(8, (stats.days / maxDays) * 100) : 50

  function deltaColor(d) {
    if (d === null) return '#94959c'
    if (phase.phase_type === 'bulk') return d > 0 ? '#5f8a00' : d < -0.2 ? '#d92020' : '#b87400'
    if (phase.phase_type === 'cut') return d < 0 ? '#5f8a00' : d > 0.2 ? '#d92020' : '#b87400'
    return Math.abs(d) < 0.5 ? '#5f8a00' : '#b87400'
  }

  function gymColor(g) {
    if (g === null) return '#94959c'
    if (g > 2) return '#5f8a00'
    if (g < -2) return '#d92020'
    return '#b87400'
  }

  return (
    <div className="glass-card rounded-sm relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)`, opacity: isActive ? 0.8 : 0.4 }} />

      <div className="p-4 pb-3">
        {/* Header: phase type + dates */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-bold tracking-[0.12em] px-2 py-0.5 rounded-sm"
              style={{ color, backgroundColor: `${color}10`, border: `1px solid ${color}20` }}>
              {label}
            </span>
            {isActive && (
              <span className="flex items-center gap-1 text-[9px] tracking-widest" style={{ color }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                ACTIVA
              </span>
            )}
          </div>
          <span className="text-[#444444] font-mono text-[11px] font-bold">{stats.days}d</span>
        </div>

        {/* Duration bar */}
        <div className="relative h-1 bg-[#141414] rounded-full overflow-hidden mb-3">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.5 }} />
        </div>

        {/* Date */}
        <p className="text-[#333333] font-sans text-[10px] mb-3">
          {phaseStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })} → {phase.end_date ? parseDate(phase.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'hoy'}
        </p>
      </div>

      {/* Stats strip */}
      <div className="flex border-t border-[#ffffff06]">
        {/* Weight delta */}
        <div className="flex-1 px-4 py-2.5 border-r border-[#ffffff06]">
          <p className="text-[#333333] font-sans text-[9px] tracking-[0.1em] mb-0.5">Δ PESO</p>
          <p className="font-mono text-sm font-bold" style={{ color: deltaColor(stats.delta) }}>
            {stats.delta !== null ? `${stats.delta > 0 ? '+' : ''}${stats.delta} kg` : '—'}
          </p>
        </div>
        {/* Weekly rate */}
        <div className="flex-1 px-4 py-2.5 border-r border-[#ffffff06]">
          <p className="text-[#333333] font-sans text-[9px] tracking-[0.1em] mb-0.5">KG/SEM</p>
          <p className="font-mono text-sm font-bold" style={{ color: deltaColor(stats.weeklyRate) }}>
            {stats.weeklyRate !== null ? <>{stats.weeklyRate > 0 ? '+' : ''}{stats.weeklyRate} <span className="text-[10px] font-normal opacity-60">kg/sem</span></> : '—'}
          </p>
        </div>
        {/* Gym */}
        <div className="flex-1 px-4 py-2.5">
          <p className="text-[#333333] font-sans text-[9px] tracking-[0.1em] mb-0.5">GYM</p>
          <p className="font-mono text-sm font-bold" style={{ color: gymColor(stats.gymPct) }}>
            {stats.gymPct !== null ? `${stats.gymPct > 0 ? '+' : ''}${stats.gymPct}%` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PhaseComparison({ onNavigate }) {
  const [phases, setPhases] = useState([])
  const [weights, setWeights] = useState([])
  const [gymLogs, setGymLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [p, w, g] = await Promise.all([getPhases(), getWeights(), getGymLogs()])
        setPhases([...p].sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date)))
        setWeights(w)
        setGymLogs(g)
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

  if (phases.length === 0) return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('currentPhase')} />
        <PageHeader title="COMPARAR FASES" />
        <EmptyState message="SIN FASES REGISTRADAS" icon="◈" />
      </div>
    </div>
  )

  const allStats = phases.map(p => ({ phase: p, stats: calcPhaseStats(p, weights, gymLogs) }))
  const maxDays = Math.max(...allStats.map(s => s.stats.days))

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('currentPhase')} />
        <PageHeader title="COMPARAR FASES" sub={`${phases.length} fase${phases.length > 1 ? 's' : ''} registrada${phases.length > 1 ? 's' : ''}`} />

        {/* Timeline view — newest first */}
        <div className="flex flex-col gap-3 stagger">
          {[...allStats].reverse().map(({ phase, stats }, i) => (
            <PhaseCard key={i} phase={phase} stats={stats} maxDays={maxDays} isActive={!phase.end_date} />
          ))}
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}