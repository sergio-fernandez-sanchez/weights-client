import { readableOnLight } from '../utils/color'
import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, getWeeklyReports, getActivePhase, getWeights, getGymLogs, getBodyMeasurements, getProfile, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import Toast from '../components/Toast'
import { haptic } from '../utils/haptic'
import AnimatedNumber from '../components/AnimatedNumber'

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function getLastMondayISO() {
  const now = new Date()
  const day = now.getDay()
  const daysToThisMonday = day === 0 ? 6 : day - 1
  const lastMondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToThisMonday - 7)
  const y = lastMondayDate.getFullYear()
  const m = String(lastMondayDate.getMonth() + 1).padStart(2, '0')
  const d = String(lastMondayDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmtWeekFromISO(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const sunday = new Date(y, m - 1, d + 6)
  const fmt = date => `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}`
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

const PHASE_COLORS = { bulk: '#a4c400', cut: '#e23535', maintenance: '#e88c00' }
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTEN.' }

function barColor(d) {
  if (d > 0.1) return '#3a9d4e'   // gana más de 0.1 kg → verde
  if (d < -0.1) return '#d92020'  // pierde más de 0.1 kg → rojo
  return '#e88c00'                // entre -0.1 y +0.1 → naranja
}

// ── Body Silhouette with measurements ──────────────────────────────────────
const BODY_POINTS = [
  { key: 'shoulders_cm', label: 'HOM', y: 48, side: 'r' },
  { key: 'chest_cm',     label: 'PEC', y: 68, side: 'r' },
  { key: 'bicep_cm',     label: 'BÍC', y: 82, side: 'l' },
  { key: 'waist_cm',     label: 'CIN', y: 100, side: 'r' },
  { key: 'hip_cm',       label: 'CAD', y: 118, side: 'l' },
  { key: 'thigh_cm',     label: 'MUS', y: 148, side: 'r' },
  { key: 'neck_cm',      label: 'CUE', y: 33, side: 'l' },
]

function BodySilhouette({ current, previous }) {
  if (!current) return null
  const W = 130, H = 200

  function deltaArrow(key) {
    if (!previous || current[key] == null || previous[key] == null) return null
    const diff = parseFloat(current[key]) - parseFloat(previous[key])
    if (Math.abs(diff) < 0.1) return null
    return diff > 0
      ? { symbol: '↑', color: '#0a6fd6' }
      : { symbol: '↓', color: '#b87400' }
  }

  const BODY_POINTS = [
    { key: 'shoulders_cm', label: 'HOM', y: 48, side: 'r' },
    { key: 'chest_cm',     label: 'PEC', y: 68, side: 'r' },
    { key: 'bicep_cm',     label: 'BÍC', y: 82, side: 'l' },
    { key: 'waist_cm',     label: 'CIN', y: 100, side: 'r' },
    { key: 'hip_cm',       label: 'CAD', y: 118, side: 'l' },
    { key: 'thigh_cm',     label: 'MUS', y: 148, side: 'r' },
    { key: 'neck_cm',      label: 'CUE', y: 33, side: 'l' },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* Body silhouette — minimalist outline */}
      <g stroke="#d6d8e0" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Head */}
        <ellipse cx="65" cy="18" rx="10" ry="12" />
        {/* Neck */}
        <line x1="60" y1="30" x2="60" y2="38" />
        <line x1="70" y1="30" x2="70" y2="38" />
        {/* Shoulders */}
        <path d="M60,38 Q58,40 40,44" />
        <path d="M70,38 Q72,40 90,44" />
        {/* Arms left */}
        <path d="M40,44 Q36,60 30,80 Q28,86 32,90" />
        {/* Arms right */}
        <path d="M90,44 Q94,60 100,80 Q102,86 98,90" />
        {/* Torso */}
        <path d="M40,44 Q42,70 44,95 Q46,110 50,118" />
        <path d="M90,44 Q88,70 86,95 Q84,110 80,118" />
        {/* Hips */}
        <path d="M50,118 Q48,122 46,128" />
        <path d="M80,118 Q82,122 84,128" />
        {/* Legs */}
        <path d="M46,128 Q44,148 42,170 Q41,180 44,190" />
        <path d="M84,128 Q86,148 88,170 Q89,180 86,190" />
        {/* Inner legs */}
        <path d="M56,128 Q58,148 60,170 Q60,180 58,190" />
        <path d="M74,128 Q72,148 70,170 Q70,180 72,190" />
      </g>

      {/* Measurement lines and labels */}
      {BODY_POINTS.map(bp => {
        const val = current[bp.key]
        if (val == null) return null
        const delta = deltaArrow(bp.key)
        const isLeft = bp.side === 'l'
        const lineX1 = isLeft ? 25 : 105
        const lineX2 = isLeft ? 2 : 128
        const textX = isLeft ? 0 : 130
        const anchor = isLeft ? 'start' : 'end'

        return (
          <g key={bp.key}>
            <line x1={lineX1} y1={bp.y} x2={lineX2} y2={bp.y}
              stroke="rgba(70,80,115,0.25)" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx={lineX1} cy={bp.y} r="1.5" fill="#71727a" />
            <text x={textX} y={bp.y - 3} textAnchor={anchor}
              fill="#9a9ba2" fontSize="7.5" fontFamily="Inter, sans-serif">
              {bp.label}
            </text>
            <text x={textX} y={bp.y + 6} textAnchor={anchor}
              fill="#41434a" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              {parseFloat(val).toFixed(1)}
            </text>
            {delta && (
              <text x={textX + (isLeft ? 28 : -28)} y={bp.y + 6} textAnchor="middle"
                fill={delta.color} fontSize="7" fontFamily="Inter, sans-serif"
                className="bounce-arrow">
                {delta.symbol}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}


export default function Home({ onNavigate, onLogout }) {
  const [lastWeight, setLastWeight]         = useState(null)
  const [input, setInput]                   = useState('')
  const [msg, setMsg]                       = useState('')
  const [loading, setLoading]               = useState(false)
  const [todayLogged, setTodayLogged]       = useState(false)
  const [activeCalories, setActiveCalories] = useState(null)
  const [weekFilled, setWeekFilled]         = useState(null)
  const [activePhase, setActivePhase]       = useState(null)
  const [allWeights, setAllWeights]         = useState([])
  const [gymAvgStrength, setGymAvgStrength] = useState(null)
  const [refreshing, setRefreshing]         = useState(true)
  const [celebrating, setCelebrating]       = useState(false)
  const [bodyData, setBodyData]             = useState({ current: null, previous: null })
  const [userSex, setUserSex]               = useState(null)

  const lastMondayISO = getLastMondayISO()

  async function refreshAll() {
    setRefreshing(true)
    await Promise.all([
      fetchLastWeight(),
      fetchCalories(),
      fetchWeeklyStatus(),
      fetchExtraStats(),
    ])
    setRefreshing(false)
  }

  useEffect(() => { refreshAll() }, [])

  async function fetchLastWeight() {
    try {
      const data = await getLastWeight()
      if (data) {
        setLastWeight(data)
        const today = new Date()
        const todayISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
        setTodayLogged(data.date === todayISO)
      }
    } catch {}
  }

  async function fetchCalories() {
    try {
      const data = await getActiveCalories()
      if (data) setActiveCalories(data.calories)
    } catch {}
  }

  async function fetchWeeklyStatus() {
    try {
      const data = await getWeeklyReports()
      const found = Array.isArray(data) && data.some(r => r.week_start === lastMondayISO)
      setWeekFilled(found)
    } catch {
      setWeekFilled(false)
    }
  }

  async function fetchExtraStats() {
    try {
      const [phaseData, weightsData, gymData, bodyMeasurements, profileData] = await Promise.all([
        getActivePhase(), getWeights(), getGymLogs(), getBodyMeasurements().catch(() => []), getProfile().catch(() => null)
      ])
      setActivePhase(phaseData)
      setAllWeights(weightsData || [])

      if (profileData?.sex) setUserSex(profileData.sex)

      // Body measurements — last 2
      if (bodyMeasurements && bodyMeasurements.length > 0) {
        const sorted = [...bodyMeasurements].sort((a, b) => parseDate(a.date) - parseDate(b.date))
        setBodyData({
          current: sorted[sorted.length - 1],
          previous: sorted.length >= 2 ? sorted[sorted.length - 2] : null,
        })
      }

      // Gym avg strength
      if (phaseData && gymData && gymData.length > 0) {
        const phaseStart = parseDate(phaseData.start_date)
        const phaseEnd = new Date()
        const exerciseIds = [...new Set(gymData.filter(l => l.weight).map(l => l.exercise_type_id))]
        const pcts = []
        exerciseIds.forEach(exId => {
          const history = gymData.filter(l => l.exercise_type_id === exId && l.weight).sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
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
        if (pcts.length > 0) setGymAvgStrength(parseFloat((pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(1)))
      }
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input) return
    setLoading(true)
    setMsg('')
    try {
      const val = parseFloat(input.replace(',', '.'))
      await postWeight(val)
      setMsg(todayLogged ? '✓  peso actualizado' : '✓  peso añadido')
      haptic('success')
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 1000)
      setInput('')
      fetchLastWeight()
      fetchExtraStats()
    } catch {
      setMsg('✗  error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const phaseDays = activePhase
    ? Math.floor((new Date() - new Date(activePhase.start_date + 'T00:00:00')) / (1000*60*60*24))
    : null
  const phaseColor = activePhase ? readableOnLight(PHASE_COLORS[activePhase.phase_type] || '#71727a') : '#71727a'

  // Weekly deltas
  const weeklyDeltas = (() => {
    if (!allWeights || allWeights.length < 2) return []
    const byWeek = {}
    allWeights.forEach(w => {
      const d = parseDate(w.date)
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      monday.setHours(0, 0, 0, 0)
      const key = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`
      if (!byWeek[key]) byWeek[key] = []
      byWeek[key].push(parseFloat(w.weight))
    })
    const weekKeys = Object.keys(byWeek).sort()
    if (weekKeys.length < 2) return []
    const weeklyAvgs = weekKeys.map(k => ({
      key: k,
      avg: byWeek[k].reduce((a, b) => a + b, 0) / byWeek[k].length,
    }))
    const deltas = []
    for (let i = 1; i < weeklyAvgs.length; i++) {
      const delta = weeklyAvgs[i].avg - weeklyAvgs[i - 1].avg
      const monday = parseDate(weeklyAvgs[i].key)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const fmt = d => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
      deltas.push({
        label: `${fmt(monday)} – ${fmt(sunday)}`,
        delta: parseFloat(delta.toFixed(2)),
      })
    }
    return deltas.slice(-4)
  })()

  // Media de la semana en curso (lunes → hoy)
  const currentWeekAvg = (() => {
    if (!allWeights || allWeights.length === 0) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
    const weights = allWeights
      .filter(w => { const d = parseDate(w.date); return d >= monday && d <= today })
      .map(w => parseFloat(w.weight))
    if (weights.length === 0) return null
    return parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2))
  })()

  const maxDeltaAbs = weeklyDeltas.length > 0 ? Math.max(...weeklyDeltas.map(d => Math.abs(d.delta)), 0.1) : 1

  // Sparkline data
  const sparkData = (() => {
    const sorted = [...allWeights].sort((a, b) => parseDate(a.date) - parseDate(b.date))
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14)
    return sorted.filter(w => parseDate(w.date) >= cutoff).map(w => parseFloat(w.weight))
  })()

  const hasBody = bodyData.current && BODY_POINTS.some(bp => bodyData.current[bp.key] != null)

  // Progreso hacia el objetivo de peso de la fase: inicio → actual → objetivo.
  const goalRing = (() => {
    const goal = activePhase?.weight_goal ? parseFloat(activePhase.weight_goal) : null
    const curr = lastWeight ? parseFloat(lastWeight.weight) : null
    if (!activePhase || goal == null || curr == null) return null
    const start = parseDate(activePhase.start_date)
    const sorted = [...allWeights].sort((a, b) => parseDate(a.date) - parseDate(b.date))
    const inPhase = sorted.filter(w => parseDate(w.date) >= start)
    const startW = inPhase.length > 0 ? parseFloat(inPhase[0].weight)
                 : (sorted.length > 0 ? parseFloat(sorted[0].weight) : curr)
    const total = goal - startW
    const done = curr - startW
    let pct
    if (Math.abs(total) < 0.01) pct = (curr === goal ? 1 : 0)
    else pct = done / total
    pct = Math.max(0, Math.min(1, pct))
    return { goal, curr, startW, pct, remaining: parseFloat((goal - curr).toFixed(2)) }
  })()

  return (
    <PageWrapper>
      <PageHeader title="W E I G H T S" blink />

      {/* ── Status Card (anillo de progreso) ── */}
      <div className={`glass-card-elevated glass-sheen rounded-sm mb-5 animate-fade-in-up relative overflow-hidden ${celebrating ? "celebrate-pulse" : ""}`} style={{ animationDelay: '0.1s' }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${phaseColor}, transparent)`, opacity: 0.7 }} />
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden" style={{ zIndex: 2 }}>
            <div className="h-full w-full" style={{ background: `linear-gradient(90deg, transparent, ${phaseColor}, transparent)`, backgroundSize: '200% 100%', animation: 'shimmer 1.2s linear infinite' }} />
          </div>
        )}

        <div className="p-4">
          {/* ─ Header: etiqueta + fase ─ */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em]">
              {todayLogged ? 'HOY' : 'ÚLTIMO REGISTRO'}
            </p>
            {activePhase && (
              <span className="font-sans text-[10px] font-bold tracking-[0.15em] px-2.5 py-1 rounded-sm"
                style={{ color: phaseColor, backgroundColor: `${phaseColor}10`, border: `1px solid ${phaseColor}20` }}>
                {PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type.toUpperCase()} · día {phaseDays}
              </span>
            )}
          </div>

          {/* ─ Anillo (progreso al objetivo) + stats laterales ─ */}
          <div className="flex items-center gap-5">
            {/* Ring */}
            <div className="relative flex-shrink-0" style={{ width: 108, height: 108 }}>
              <svg viewBox="0 0 108 108" style={{ width: 108, height: 108, transform: 'rotate(-90deg)' }}>
                <circle cx="54" cy="54" r="47" fill="none" stroke="rgba(70,80,115,0.12)" strokeWidth="7" />
                {goalRing && (
                  <circle cx="54" cy="54" r="47" fill="none" stroke={phaseColor} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 47}
                    strokeDashoffset={(1 - goalRing.pct) * 2 * Math.PI * 47}
                    style={{ filter: `drop-shadow(0 0 4px ${phaseColor}66)`, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.32,0.72,0,1)' }} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {lastWeight ? (
                  <>
                    <span className="font-mono font-bold leading-none tracking-tight" style={{ color: phaseColor, fontSize: '22px' }}>
                      <AnimatedNumber value={parseFloat(lastWeight.weight)} decimals={2} />
                    </span>
                    <span className="font-mono text-[10px] text-[#9a9ba2] mt-0.5">kg</span>
                  </>
                ) : (
                  <span className="font-mono text-2xl font-bold text-[#9a9ba2]">—</span>
                )}
              </div>
            </div>

            {/* Side stats: sparkline + objetivo */}
              <div className="flex-1 min-w-0 flex flex-col gap-2.5">
              {/* Sparkline 14d */}
              {sparkData.length >= 3 ? (() => {
                const min = Math.min(...sparkData), max = Math.max(...sparkData)
                const range = max - min || 0.1
                const W = 120, H = 24
                const points = sparkData.map((w, i) => {
                  const x = (i / (sparkData.length - 1)) * W
                  const y = H - 2 - ((w - min) / range) * (H - 4)
                  return `${x},${y}`
                }).join(' ')
                return (
                  <div>
                    <p className="text-[#444444] font-sans text-[8px] tracking-[0.15em] mb-0.5">14 DÍAS</p>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '22px' }}>
                      <polyline points={points} fill="none" stroke={phaseColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                      <circle cx={W} cy={H - 2 - ((sparkData[sparkData.length - 1] - min) / range) * (H - 4)} r="2" fill={phaseColor} />
                    </svg>
                    <p className="text-[#444444] font-mono text-[8px] mt-0.5">{min.toFixed(1)}–{max.toFixed(1)} kg</p>
                  </div>
                )
              })() : (
                !todayLogged && lastWeight?.date && (
                  <p className="text-[#444444] font-sans text-[10px]">{parseDate(lastWeight.date).toLocaleDateString('es-ES')}</p>
                )
              )}

              {/* Media semana en curso */}
              {currentWeekAvg !== null && (
                <div>
                  <p className="text-[#444444] font-sans text-[8px] tracking-[0.15em]">ESTA SEMANA</p>
                  <p className="font-mono text-sm font-bold" style={{ color: phaseColor }}>{currentWeekAvg.toFixed(2)} <span className="text-[9px] opacity-50">kg</span></p>
                </div>
              )}

              {/* Objetivo / restante */}
              {goalRing ? (
                <div className="flex gap-4">
                  <div>
                    <p className="text-[#444444] font-sans text-[8px] tracking-[0.15em]">OBJETIVO</p>
                    <p className="font-mono text-sm font-bold" style={{ color: phaseColor }}>{goalRing.goal.toFixed(1)} <span className="text-[9px] opacity-50">kg</span></p>
                  </div>
                  <div>
                    <p className="text-[#444444] font-sans text-[8px] tracking-[0.15em]">RESTANTE</p>
                    <p className="font-mono text-sm font-bold text-[#71727a]">{goalRing.remaining > 0 ? '+' : ''}{goalRing.remaining} <span className="text-[9px] opacity-50">kg</span></p>
                  </div>
                </div>
              ) : (
                todayLogged && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: phaseColor }} />
                    <span className="font-sans text-[9px] tracking-[0.2em]" style={{ color: phaseColor }}>REGISTRADO HOY</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ─ Barras semanales (mini-columnas) ─ */}
          {weeklyDeltas.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[rgba(70,80,115,0.1)]">
              <div className="flex gap-2 items-end" style={{ height: 40 }}>
                {weeklyDeltas.map((w, i) => {
                  const color = barColor(w.delta)
                  const h = Math.max(6, (Math.abs(w.delta) / maxDeltaAbs) * 28)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div className="w-full rounded" style={{ height: `${h}px`, backgroundColor: color, opacity: 0.85, boxShadow: `0 0 6px ${color}33` }} />
                      <span className="font-mono text-[7px] font-bold" style={{ color }}>{w.delta > 0 ? '+' : ''}{w.delta.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
              {/* Intervalos debajo de cada barra */}
              <div className="flex gap-2 mt-1">
                {weeklyDeltas.map((w, i) => (
                  <span key={i} className="flex-1 text-center font-sans text-[6px] text-[#9a9ba2] leading-tight">{w.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─ Bottom stats strip: GYM FASE + CALORÍAS ─ */}
        {(gymAvgStrength !== null || activeCalories) && (
          <>
            <div className="mx-4 mt-0 mb-0 h-px bg-gradient-to-r from-[rgba(70,80,115,0.1)] via-[rgba(70,80,115,0.2)] to-[rgba(70,80,115,0.1)]" />
            <div className="flex">
              {gymAvgStrength !== null && (
                <div className="flex-1 px-4 py-2.5 border-r border-[rgba(70,80,115,0.1)]">
                  <p className="text-[#9a9ba2] font-sans text-[9px] tracking-[0.15em] mb-0.5">GYM FASE</p>
                  <p className="font-mono text-sm font-bold" style={{ color: gymAvgStrength > 2 ? '#5f8a00' : gymAvgStrength < -2 ? '#d92020' : '#b87400' }}>
                    {gymAvgStrength > 0 ? '+' : ''}{gymAvgStrength}%
                  </p>
                </div>
              )}
              {activeCalories && (
                <div className="flex-1 px-4 py-2.5">
                  <p className="text-[#9a9ba2] font-sans text-[9px] tracking-[0.15em] mb-0.5">CALORÍAS</p>
                  <p className="text-[#71727a] font-mono text-sm font-bold">{activeCalories} <span className="text-[10px] font-normal opacity-50">kcal</span></p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Weekly Report Banner ── */}
      {weekFilled !== null && (
        <button
          onClick={() => onNavigate('weeklyReport', { weekStart: lastMondayISO, from: 'home' })}
          className="w-full glass-card glass-sheen card-hover click-press rounded-sm p-3 mb-5 flex items-center justify-between group transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-sm flex items-center justify-center text-base font-sans border"
              style={{ borderColor: weekFilled ? '#5f8a00' : '#d92020', color: weekFilled ? '#5f8a00' : '#d92020', backgroundColor: weekFilled ? 'rgba(164,196,0,0.06)' : 'rgba(255,45,45,0.06)' }}>
              {weekFilled ? '✓' : '!'}
            </span>
            <div className="text-left">
              <p className="text-[#888888] font-sans text-[10px] tracking-[0.15em]">INFORME SEMANAL</p>
              <p className="text-[#e8e8e8] font-sans text-xs font-bold">{fmtWeekFromISO(lastMondayISO)}</p>
            </div>
          </div>
          <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors font-sans">›</span>
        </button>
      )}

      {/* ── Weight Input ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
            <span className="w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: phaseColor }} />
            {todayLogged ? 'ACTUALIZAR PESO' : 'PESO DE HOY'}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="00.00"
              required
              className="w-full input-frosted rounded-sm h-14 px-4 pr-12 font-mono text-xl font-bold text-[#e8e8e8] outline-none"
              style={{ '--accent-color': phaseColor }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] font-mono text-sm">kg</span>
          </div>
        </div>
        <Button type="submit" disabled={loading}>{loading ? '...' : todayLogged ? 'ACTUALIZAR PESO' : 'AÑADIR PESO'}</Button>
      </form>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-2 mb-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <button onClick={() => onNavigate('calories', activeCalories)}
          className="glass-card glass-sheen rounded-sm h-14 flex flex-col items-center justify-center group card-hover click-press">
          <span className="text-[#555555] font-sans text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">CALORÍAS</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">→</span>
        </button>
        <button onClick={() => onNavigate('gym')}
          className="glass-card glass-sheen rounded-sm h-14 flex flex-col items-center justify-center group card-hover click-press">
          <span className="text-[#555555] font-sans text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">GYM</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">→</span>
        </button>
      </div>

      <Separator className="my-5" />

      <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <Button variant="secondary" onClick={() => onNavigate('data')}>VER DATOS</Button>
        <Button variant="secondary" onClick={() => onNavigate('addMenu')}>AÑADIR</Button>
        <Button variant="secondary" onClick={() => onNavigate('profile')}>DATOS PERSONALES</Button>
      </div>

      <Separator className="my-5" />

      <button onClick={() => onNavigate('aiReport')}
        className="w-full h-14 glass-card glass-sheen card-hover click-press rounded-sm text-[#3c3e45] font-sans text-sm font-bold tracking-widest text-left px-5 flex items-center justify-between group mb-4">
        <span className="flex items-center gap-2 group-hover:text-[#5f8a00] transition-colors">
          <span className="text-[#5f8a00]">◆</span>
          GENERAR INFORME IA
        </span>
        <span className="text-[#a8a9b0] group-hover:text-[#5f8a00] transition-colors">›</span>
      </button>

      <Button variant="ghost" onClick={() => { logout(); onLogout() }}>CERRAR SESIÓN</Button>

      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] mt-4 select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>

      {msg && <Toast message={msg} type={msg.startsWith('✓') ? 'success' : 'error'} onDone={() => setMsg('')} />}
    </PageWrapper>
  )
}