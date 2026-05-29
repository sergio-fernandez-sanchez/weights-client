import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, getWeeklyReports, getActivePhase, getWeights, getGymLogs, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import Toast from '../components/Toast'

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
      const [phaseData, weightsData, gymData] = await Promise.all([
        getActivePhase(), getWeights(), getGymLogs()
      ])
      setActivePhase(phaseData)
      setAllWeights(weightsData || [])

      // Calculate avg gym strength change during active phase
      if (phaseData && gymData && gymData.length > 0) {
        const phaseStart = parseDate(phaseData.start_date)
        const phaseEnd = new Date()

        // Get unique exercises
        const exerciseIds = [...new Set(gymData.filter(l => l.weight).map(l => l.exercise_type_id))]

        const pcts = []
        exerciseIds.forEach(exId => {
          const history = gymData
            .filter(l => l.exercise_type_id === exId && l.weight)
            .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))

          const phaseHistory = history.filter(l => {
            const d = parseDate(l.start_date)
            return d >= phaseStart && d <= phaseEnd
          })
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

        if (pcts.length > 0) {
          setGymAvgStrength(parseFloat((pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(1)))
        }
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

  // Build weekly deltas from ALL weights (phase-independent)
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
        label: `${monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} – ${sunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
        delta: parseFloat(delta.toFixed(2)),
      })
    }
    return deltas.slice(-4)
  })()

  const maxDeltaAbs = weeklyDeltas.length > 0 ? Math.max(...weeklyDeltas.map(d => Math.abs(d.delta)), 0.1) : 1

  return (
    <PageWrapper>
      <PageHeader title="W E I G H T S" blink />

      {/* ── Status Card ── */}
      <div className="glass-card-elevated rounded-sm mb-5 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
        {/* Top accent line — phase color */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${phaseColor}, transparent)`, opacity: 0.7 }} />

        {/* Refresh shimmer */}
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden" style={{ zIndex: 2 }}>
            <div className="h-full w-full" style={{
              background: `linear-gradient(90deg, transparent, ${phaseColor}, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.2s linear infinite',
            }} />
          </div>
        )}

        {/* ─ Weight + Phase row ─ */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            {/* Weight hero */}
            <div>
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-1.5">
                {todayLogged ? 'HOY' : 'ÚLTIMO REGISTRO'}
              </p>
              {lastWeight ? (
                <p className="text-[#c8f500] font-mono text-4xl font-bold leading-none tracking-tight">
                  {lastWeight.weight}<span className="text-lg ml-1 opacity-50">kg</span>
                </p>
              ) : (
                <p className="text-[#333333] font-mono text-2xl font-bold">—</p>
              )}
              {!todayLogged && lastWeight?.date && (
                <p className="text-[#333333] font-sans text-[10px] mt-1.5">{parseDate(lastWeight.date).toLocaleDateString('es-ES')}</p>
              )}
            </div>

            {/* Phase badge */}
            {activePhase && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-sans text-[10px] font-bold tracking-[0.15em] px-2.5 py-1 rounded-sm"
                  style={{
                    color: phaseColor,
                    backgroundColor: `${phaseColor}10`,
                    border: `1px solid ${phaseColor}20`,
                  }}>
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

        {/* ─ Sparkline — last 14 days ─ */}
        {(() => {
          const sorted = [...allWeights]
            .sort((a, b) => parseDate(a.date) - parseDate(b.date))
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - 14)
          const recent = sorted.filter(w => parseDate(w.date) >= cutoff).map(w => parseFloat(w.weight))
          if (recent.length < 3) return null

          const min = Math.min(...recent), max = Math.max(...recent)
          const range = max - min || 0.1
          const W = 280, H = 32
          const points = recent.map((w, i) => {
            const x = (i / (recent.length - 1)) * W
            const y = H - 2 - ((w - min) / range) * (H - 4)
            return `${x},${y}`
          }).join(' ')
          const area = `0,${H} ${points} ${W},${H}`

          return (
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[#333333] font-sans text-[9px] tracking-[0.2em]">14 DÍAS</p>
                <p className="text-[#333333] font-sans text-[9px]">
                  {min.toFixed(1)} – {max.toFixed(1)} kg
                </p>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '32px' }}>
                <defs>
                  <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={phaseColor} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={area} fill="url(#spark-fill)" />
                <polyline points={points} fill="none" stroke={phaseColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={(recent.length - 1) / (recent.length - 1) * W} cy={H - 2 - ((recent[recent.length - 1] - min) / range) * (H - 4)} r="2.5" fill={phaseColor} />
              </svg>
            </div>
          )
        })()}

        {/* ─ Separator ─ */}
        <div className="mx-4 mt-3 mb-0 h-px bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" />

        {/* ─ Weekly history bars ─ */}
        {weeklyDeltas.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[#444444] font-sans text-[9px] tracking-[0.2em] mb-2.5">ÚLTIMAS 4 SEMANAS</p>
            <div className="flex flex-col gap-2">
              {weeklyDeltas.map((w, i) => {
                const color = barColor(w.delta)
                const widthPct = Math.max(6, (Math.abs(w.delta) / maxDeltaAbs) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[#444444] font-sans text-[9px] w-[90px] flex-shrink-0">{w.label}</span>
                    <div className="flex-1 relative h-[6px] bg-[#141414] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: color,
                          boxShadow: `0 0 6px ${color}25`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold w-[52px] text-right flex-shrink-0" style={{ color }}>
                      {w.delta > 0 ? '+' : ''}{w.delta.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─ Bottom stats strip ─ */}
        {(gymAvgStrength !== null || activeCalories) && (
          <>
            <div className="mx-4 mt-2 mb-0 h-px bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" />
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
            <span
              className="w-8 h-8 rounded-sm flex items-center justify-center text-base font-sans border"
              style={{
                borderColor: weekFilled ? '#c8f500' : '#ff2d2d',
                color: weekFilled ? '#c8f500' : '#ff2d2d',
                backgroundColor: weekFilled ? 'rgba(200,245,0,0.06)' : 'rgba(255,45,45,0.06)',
              }}
            >
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
        <Input
          label={todayLogged ? 'ACTUALIZAR PESO (kg)' : 'PESO DE HOY (kg)'}
          type="number"
          step="0.01"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="00.00"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? '...' : todayLogged ? 'ACTUALIZAR PESO' : 'AÑADIR PESO'}
        </Button>
      </form>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-2 mb-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <button
          onClick={() => onNavigate('calories', activeCalories)}
          className="glass-card rounded-sm h-14 flex flex-col items-center justify-center group hover:border-[#333333] transition-all duration-300"
        >
          <span className="text-[#555555] font-sans text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">CALORÍAS</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">→</span>
        </button>
        <button
          onClick={() => onNavigate('gym')}
          className="glass-card rounded-sm h-14 flex flex-col items-center justify-center group hover:border-[#333333] transition-all duration-300"
        >
          <span className="text-[#555555] font-sans text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">GYM</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">→</span>
        </button>
      </div>

      <Separator className="my-5" />

      {/* ── Navigation ── */}
      <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {[
          ['VER DATOS',        'data'],
          ['NUEVA FASE',       'phase'],
          ['NUEVO INFORME',    'newReport'],
          ['DATOS PERSONALES', 'profile'],
        ].map(([label, page]) => (
          <Button key={page} variant="secondary" onClick={() => onNavigate(page)}>
            {label}
          </Button>
        ))}
      </div>

      <Separator className="my-5" />

      {/* ── AI Report Button ── */}
      <button
        onClick={() => onNavigate('aiReport')}
        className="w-full h-14 glass-card-elevated rounded-sm border-[#1f2a00] text-[#6a8000] font-sans text-sm font-bold tracking-widest text-left px-5 hover:text-[#c8f500] hover:border-[#c8f500]/40 transition-all duration-300 group relative overflow-hidden mb-4"
      >
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#c8f500] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 rounded-r-sm" />
        <span className="relative z-10 flex items-center gap-2">
          <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors">◆</span>
          GENERAR INFORME IA
        </span>
      </button>

      <Button variant="ghost" onClick={() => { logout(); onLogout() }}>
        CERRAR SESIÓN
      </Button>

      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] mt-4 select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>

      {msg && <Toast message={msg} type={msg.startsWith('✓') ? 'success' : 'error'} onDone={() => setMsg('')} />}
    </PageWrapper>
  )
}