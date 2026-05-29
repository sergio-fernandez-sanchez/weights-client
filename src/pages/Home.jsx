import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, getWeeklyReports, getActivePhase, getWeights, getGymLogs, getBodyMeasurements, getProfile, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import Toast from '../components/Toast'
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

const PHASE_COLORS = { bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00' }
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTEN.' }

function barColor(d) {
  if (d > 0.2) return '#c8f500'
  if (d < -0.2) return '#ff2d2d'
  return '#ff9f00'
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

function BodySilhouette({ current, previous, sex }) {
  if (!current) return null
  const W = 130, H = 200
  const isFemale = sex === 'female'

  function deltaArrow(key) {
    if (!previous || current[key] == null || previous[key] == null) return null
    const diff = parseFloat(current[key]) - parseFloat(previous[key])
    if (Math.abs(diff) < 0.1) return null
    return diff > 0
      ? { symbol: '↑', color: '#4a9eff' }
      : { symbol: '↓', color: '#ff9f00' }
  }

  const BODY_POINTS = [
    { key: 'neck_cm',      label: 'CUE', y: 38, side: 'l' },
    { key: 'shoulders_cm', label: 'HOM', y: 52, side: 'r' },
    { key: 'chest_cm',     label: 'PEC', y: 70, side: 'r' },
    { key: 'bicep_cm',     label: 'BÍC', y: 78, side: 'l' },
    { key: 'waist_cm',     label: 'CIN', y: 98, side: 'r' },
    { key: 'hip_cm',       label: 'CAD', y: 116, side: 'l' },
    { key: 'thigh_cm',     label: 'MUS', y: 145, side: 'r' },
  ]

  // Athletic male silhouette — wider shoulders, V-taper, defined muscles
  const malePath = `
    M65,8 C60,8 56,12 56,17 C56,22 59,26 63,27
    L62,27 C61,29 60,31 60,33
    L60,36 C59,37 56,39 50,42
    C44,45 38,47 35,50
    L32,54 C30,58 28,68 27,76
    C26,82 27,86 30,88
    L33,88 C34,86 34,84 33,80
    L36,68 C38,62 40,58 42,54
    L43,51 C46,50 50,50 52,52
    L54,60 C55,68 55,80 54,92
    C53,100 52,106 50,112
    L48,120 C47,124 46,130 46,136
    C46,142 46,150 47,158
    C47,166 48,174 49,180
    L50,186 C51,190 53,192 56,192
    L60,192 C61,190 61,188 60,184
    L58,170 C57,160 57,150 58,140
    L60,130 C62,124 64,120 65,118
    L65,118
    C66,120 68,124 70,130
    L72,140 C73,150 73,160 72,170
    L70,184 C69,188 69,190 70,192
    L74,192 C77,192 79,190 80,186
    L81,180 C82,174 83,166 83,158
    C84,150 84,142 84,136
    C84,130 83,124 82,120
    L80,112 C78,106 77,100 76,92
    C75,80 75,68 76,60
    L78,52 C80,50 84,50 87,51
    L88,54 C90,58 92,62 94,68
    L97,80 C96,84 96,86 97,88
    L100,88 C103,86 104,82 103,76
    C102,68 100,58 98,54
    L95,50 C92,47 86,45 80,42
    C74,39 71,37 70,36
    L70,33 C70,31 69,29 68,27
    L67,27 C71,26 74,22 74,17
    C74,12 70,8 65,8 Z
  `

  // Athletic female silhouette — narrower shoulders, defined waist, wider hips
  const femalePath = `
    M65,8 C61,8 57,12 57,17 C57,22 60,26 63,27
    L62,27 C61,29 61,31 61,33
    L61,36 C60,37 58,39 54,42
    C50,44 46,46 43,48
    L40,50 C38,53 36,60 35,68
    C34,74 35,78 37,80
    L40,80 C41,78 41,76 40,73
    L42,64 C44,58 46,54 48,52
    L50,50 C53,49 56,50 58,53
    L59,58 C60,64 60,70 60,78
    C59,86 58,92 56,98
    C54,104 52,108 50,112
    L47,120 C46,126 45,132 45,140
    C45,148 45,156 46,164
    C46,172 47,178 48,182
    L49,188 C50,191 52,193 55,193
    L59,193 C60,191 60,189 59,186
    L58,174 C57,164 57,154 58,144
    L60,134 C62,128 64,124 65,122
    L65,122
    C66,124 68,128 70,134
    L72,144 C73,154 73,164 72,174
    L71,186 C70,189 70,191 71,193
    L75,193 C78,193 80,191 81,188
    L82,182 C83,178 84,172 84,164
    C85,156 85,148 85,140
    C85,132 84,126 83,120
    L80,112 C78,108 76,104 74,98
    C72,92 71,86 70,78
    C70,70 70,64 71,58
    L72,53 C74,50 77,49 80,50
    L82,52 C84,54 86,58 88,64
    L90,73 C89,76 89,78 90,80
    L93,80 C95,78 96,74 95,68
    C94,60 92,53 90,50
    L87,48 C84,46 80,44 76,42
    C72,39 70,37 69,36
    L69,33 C69,31 69,29 68,27
    L67,27 C70,26 73,22 73,17
    C73,12 69,8 65,8 Z
  `

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* Body silhouette */}
      <path
        d={isFemale ? femalePath : malePath}
        fill="#131313"
        stroke="#1e1e1e"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Muscle definition lines — subtle */}
      {!isFemale && (
        <g stroke="#1a1a1a" strokeWidth="0.5" fill="none" opacity="0.6">
          {/* Chest separation */}
          <path d="M65,55 C65,62 65,68 65,75" />
          {/* Abs */}
          <path d="M58,80 C60,80 62,80 65,80" />
          <path d="M65,80 C68,80 70,80 72,80" />
          <path d="M58,88 C60,88 62,88 65,88" />
          <path d="M65,88 C68,88 70,88 72,88" />
          <path d="M59,96 C61,96 63,96 65,96" />
          <path d="M65,96 C67,96 69,96 71,96" />
        </g>
      )}

      {/* Measurement lines and labels */}
      {BODY_POINTS.map(bp => {
        const val = current[bp.key]
        if (val == null) return null
        const delta = deltaArrow(bp.key)
        const isLeft = bp.side === 'l'
        const lineX1 = isLeft ? 28 : 102
        const lineX2 = isLeft ? 2 : 128
        const textX = isLeft ? 0 : 130
        const anchor = isLeft ? 'start' : 'end'

        return (
          <g key={bp.key}>
            <line x1={lineX1} y1={bp.y} x2={lineX2} y2={bp.y}
              stroke="#2a2a2a" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx={lineX1} cy={bp.y} r="1.5" fill="#333333" />
            <text x={textX} y={bp.y - 3} textAnchor={anchor}
              fill="#666666" fontSize="7.5" fontFamily="Inter, sans-serif">
              {bp.label}
            </text>
            <text x={textX} y={bp.y + 6} textAnchor={anchor}
              fill="#999999" fontSize="8" fontFamily="'Courier New', monospace" fontWeight="bold">
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
  const phaseColor = activePhase ? (PHASE_COLORS[activePhase.phase_type] || '#888') : '#888'

  // Weekly deltas
  const weeklyDeltas = (() => {
    if (!allWeights || allWeights.length < 2) return []
    const sorted = [...allWeights].sort((a, b) => parseDate(a.date) - parseDate(b.date))
    const byWeek = {}
    sorted.forEach(w => {
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
    if (weekKeys.length < 2) return []
    const weeklyAvgs = weekKeys.map(k => ({
      key: k,
      avg: byWeek[k].reduce((a, b) => a + b, 0) / byWeek[k].length,
    }))
    const deltas = []
    for (let i = 1; i < weeklyAvgs.length; i++) {
      const delta = weeklyAvgs[i].avg - weeklyAvgs[i - 1].avg
      const monday = parseDate(weeklyAvgs[i].key)
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      deltas.push({
        label: `${monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
        delta: parseFloat(delta.toFixed(2)),
      })
    }
    return deltas.slice(-4)
  })()
  const maxDeltaAbs = weeklyDeltas.length > 0 ? Math.max(...weeklyDeltas.map(d => Math.abs(d.delta)), 0.1) : 1

  // Sparkline data
  const sparkData = (() => {
    const sorted = [...allWeights].sort((a, b) => parseDate(a.date) - parseDate(b.date))
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14)
    return sorted.filter(w => parseDate(w.date) >= cutoff).map(w => parseFloat(w.weight))
  })()

  const hasBody = bodyData.current && BODY_POINTS.some(bp => bodyData.current[bp.key] != null)

  return (
    <PageWrapper>
      <PageHeader title="W E I G H T S" blink />

      {/* ── Status Card ── */}
      <div className={`glass-card-elevated rounded-sm mb-5 animate-fade-in-up relative overflow-hidden ${celebrating ? "celebrate-pulse" : ""}`} style={{ animationDelay: '0.1s' }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${phaseColor}, transparent)`, opacity: 0.7 }} />
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden" style={{ zIndex: 2 }}>
            <div className="h-full w-full" style={{ background: `linear-gradient(90deg, transparent, ${phaseColor}, transparent)`, backgroundSize: '200% 100%', animation: 'shimmer 1.2s linear infinite' }} />
          </div>
        )}

        {/* ─ Weight + Phase row ─ */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-1.5">
                {todayLogged ? 'HOY' : 'ÚLTIMO REGISTRO'}
              </p>
              {lastWeight ? (
                <p className="text-[#c8f500] font-mono text-4xl font-bold leading-none tracking-tight">
                  <AnimatedNumber value={parseFloat(lastWeight.weight)} decimals={2} /><span className="text-lg ml-1 opacity-50">kg</span>
                </p>
              ) : (
                <p className="text-[#333333] font-mono text-2xl font-bold">—</p>
              )}
              {!todayLogged && lastWeight?.date && (
                <p className="text-[#333333] font-sans text-[10px] mt-1.5">{parseDate(lastWeight.date).toLocaleDateString('es-ES')}</p>
              )}
            </div>
            {activePhase && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-sans text-[10px] font-bold tracking-[0.15em] px-2.5 py-1 rounded-sm"
                  style={{ color: phaseColor, backgroundColor: `${phaseColor}10`, border: `1px solid ${phaseColor}20` }}>
                  {PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type.toUpperCase()}
                </span>
                <span className="text-[#444444] font-sans text-[10px] tracking-wider">
                  día <span className="font-mono font-bold text-[#888888]">{phaseDays}</span>
                </span>
              </div>
            )}
          </div>
          {todayLogged && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8f500] animate-pulse" />
              <span className="text-[#c8f500] font-sans text-[9px] tracking-[0.2em]">REGISTRADO HOY</span>
            </div>
          )}
        </div>

        <div className="mx-4 mt-3 mb-0 h-px bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" />

        {/* ─ Two-column: Charts left, Body right ─ */}
        <div className="flex">
          {/* Left column: sparkline + weekly bars */}
          <div className={`${hasBody ? 'flex-1 min-w-0' : 'w-full'}`}>
            {/* Sparkline */}
            {sparkData.length >= 3 && (() => {
              const min = Math.min(...sparkData), max = Math.max(...sparkData)
              const range = max - min || 0.1
              const W = 160, H = 28
              const points = sparkData.map((w, i) => {
                const x = (i / (sparkData.length - 1)) * W
                const y = H - 2 - ((w - min) / range) * (H - 4)
                return `${x},${y}`
              }).join(' ')
              const area = `0,${H} ${points} ${W},${H}`
              return (
                <div className="px-4 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#333333] font-sans text-[8px] tracking-[0.15em]">14 DÍAS</p>
                    <p className="text-[#333333] font-mono text-[8px]">{min.toFixed(1)}–{max.toFixed(1)}</p>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '28px' }}>
                    <defs>
                      <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={phaseColor} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={area} fill="url(#spark-fill)" />
                    <polyline points={points} fill="none" stroke={phaseColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={W} cy={H - 2 - ((sparkData[sparkData.length - 1] - min) / range) * (H - 4)} r="2" fill={phaseColor} />
                  </svg>
                </div>
              )
            })()}

            {/* Weekly bars */}
            {weeklyDeltas.length > 0 && (
              <div className="px-4 pt-2 pb-2">
                <p className="text-[#333333] font-sans text-[8px] tracking-[0.15em] mb-2">SEMANAS</p>
                <div className="flex flex-col gap-1.5">
                  {weeklyDeltas.map((w, i) => {
                    const color = barColor(w.delta)
                    const widthPct = Math.max(6, (Math.abs(w.delta) / maxDeltaAbs) * 100)
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[#333333] font-sans text-[8px] w-[36px] flex-shrink-0">{w.label}</span>
                        <div className="flex-1 relative h-[5px] bg-[#141414] rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${widthPct}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}20` }} />
                        </div>
                        <span className="font-mono text-[9px] font-bold w-[38px] text-right flex-shrink-0" style={{ color }}>
                          {w.delta > 0 ? '+' : ''}{w.delta.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column: body silhouette */}
          {hasBody && (
            <div className="w-[140px] flex-shrink-0 pr-2 py-2">
              <BodySilhouette current={bodyData.current} previous={bodyData.previous} sex={userSex} />
            </div>
          )}
        </div>

        {/* ─ Bottom stats strip ─ */}
        {(gymAvgStrength !== null || activeCalories) && (
          <>
            <div className="mx-4 mt-0 mb-0 h-px bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" />
            <div className="flex">
              {gymAvgStrength !== null && (
                <div className="flex-1 px-4 py-2.5 border-r border-[#ffffff06]">
                  <p className="text-[#333333] font-sans text-[9px] tracking-[0.15em] mb-0.5">GYM FASE</p>
                  <p className="font-mono text-sm font-bold" style={{ color: gymAvgStrength > 2 ? '#c8f500' : gymAvgStrength < -2 ? '#ff2d2d' : '#ff9f00' }}>
                    {gymAvgStrength > 0 ? '+' : ''}{gymAvgStrength}%
                  </p>
                </div>
              )}
              {activeCalories && (
                <div className="flex-1 px-4 py-2.5">
                  <p className="text-[#333333] font-sans text-[9px] tracking-[0.15em] mb-0.5">CALORÍAS</p>
                  <p className="text-[#888888] font-mono text-sm font-bold">{activeCalories} <span className="text-[10px] font-normal opacity-50">kcal</span></p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Weekly Report Banner ── */}
      {weekFilled !== null && (
        <button
          onClick={() => onNavigate('weeklyReport', lastMondayISO)}
          className="w-full glass-card rounded-sm p-3 mb-5 flex items-center justify-between group hover:border-[#333333] transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-sm flex items-center justify-center text-base font-sans border"
              style={{ borderColor: weekFilled ? '#c8f500' : '#ff2d2d', color: weekFilled ? '#c8f500' : '#ff2d2d', backgroundColor: weekFilled ? 'rgba(200,245,0,0.06)' : 'rgba(255,45,45,0.06)' }}>
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
              className="w-full input-display rounded-sm h-14 px-4 pr-12 font-mono text-xl font-bold text-[#e8e8e8] outline-none"
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
          className="glass-card rounded-sm h-14 flex flex-col items-center justify-center group hover:border-[#333333] transition-all duration-300">
          <span className="text-[#555555] font-sans text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">CALORÍAS</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">→</span>
        </button>
        <button onClick={() => onNavigate('gym')}
          className="glass-card rounded-sm h-14 flex flex-col items-center justify-center group hover:border-[#333333] transition-all duration-300">
          <span className="text-[#555555] font-sans text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">GYM</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">→</span>
        </button>
      </div>

      <Separator className="my-5" />

      <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {[['VER DATOS', 'data'], ['NUEVA FASE', 'phase'], ['NUEVO INFORME', 'newReport'], ['NUEVA FOTO', 'photoUpload'], ['DATOS PERSONALES', 'profile']].map(([label, page]) => (
          <Button key={page} variant="secondary" onClick={() => onNavigate(page)}>{label}</Button>
        ))}
      </div>

      <Separator className="my-5" />

      <button onClick={() => onNavigate('aiReport')}
        className="w-full h-14 glass-card-elevated rounded-sm border-[#1f2a00] text-[#6a8000] font-sans text-sm font-bold tracking-widest text-left px-5 hover:text-[#c8f500] hover:border-[#c8f500]/40 transition-all duration-300 group relative overflow-hidden mb-4">
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#c8f500] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 rounded-r-sm" />
        <span className="relative z-10 flex items-center gap-2">
          <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors">◆</span>
          GENERAR INFORME IA
        </span>
      </button>

      <Button variant="ghost" onClick={() => { logout(); onLogout() }}>CERRAR SESIÓN</Button>

      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] mt-4 select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>

      {msg && <Toast message={msg} type={msg.startsWith('✓') ? 'success' : 'error'} onDone={() => setMsg('')} />}
    </PageWrapper>
  )
}