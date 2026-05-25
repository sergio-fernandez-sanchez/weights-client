import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, getWeeklyReports, getActivePhase, getWeights, getActiveGymLogs, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'

function getLastMondayISO() {
  const now = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const date  = now.getDate()
  const day   = now.getDay()
  const daysToThisMonday = day === 0 ? 6 : day - 1
  const lastMondayDate = new Date(year, month, date - daysToThisMonday - 7)
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

const PHASE_COLORS = { bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00' }
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTEN.' }

export default function Home({ onNavigate, onLogout }) {
  const [lastWeight, setLastWeight]         = useState(null)
  const [input, setInput]                   = useState('')
  const [msg, setMsg]                       = useState('')
  const [loading, setLoading]               = useState(false)
  const [todayLogged, setTodayLogged]       = useState(false)
  const [activeCalories, setActiveCalories] = useState(null)
  const [weekFilled, setWeekFilled]         = useState(null)
  const [activePhase, setActivePhase]       = useState(null)
  const [weeklyTrend, setWeeklyTrend]       = useState(null)
  const [bestOneRM, setBestOneRM]           = useState(null)

  const lastMondayISO = getLastMondayISO()

  useEffect(() => {
    fetchLastWeight()
    fetchCalories()
    fetchWeeklyStatus()
    fetchExtraStats()
  }, [])

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
        getActivePhase(), getWeights(), getActiveGymLogs()
      ])
      setActivePhase(phaseData)

      if (weightsData && weightsData.length >= 2) {
        const sorted = [...weightsData].sort((a, b) => new Date(a.date) - new Date(b.date))
        const today = new Date()
        const cutoff7  = new Date(today); cutoff7.setDate(today.getDate() - 7)
        const cutoff14 = new Date(today); cutoff14.setDate(today.getDate() - 14)
        const last7 = sorted.filter(w => new Date(w.date) >= cutoff7).map(w => parseFloat(w.weight))
        const prev7 = sorted.filter(w => new Date(w.date) >= cutoff14 && new Date(w.date) < cutoff7).map(w => parseFloat(w.weight))
        if (last7.length > 0 && prev7.length > 0) {
          const avg7  = last7.reduce((a, b) => a + b, 0) / last7.length
          const avgP7 = prev7.reduce((a, b) => a + b, 0) / prev7.length
          setWeeklyTrend(parseFloat((avg7 - avgP7).toFixed(2)))
        }
      }

      if (gymData && gymData.length > 0) {
        let best = null
        gymData.forEach(log => {
          if (!log.weight) return
          const rm = log.reps
            ? parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
            : parseFloat(log.weight)
          if (!best || rm > best.rm) best = { name: log.name, rm: Math.round(rm) }
        })
        setBestOneRM(best)
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
    } catch {
      setMsg('✗  error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const phaseDays = activePhase
    ? Math.floor((new Date() - new Date(activePhase.start_date + 'T00:00:00')) / (1000*60*60*24))
    : null

  return (
    <PageWrapper>
      <PageHeader title="W E I G H T S" blink />

      {/* ── Status Banner ── */}
      {lastWeight && (
        <div className="glass-card rounded-sm p-4 mb-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Weight display */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[#555555] font-mono text-[10px] tracking-[0.2em] mb-1">
                {todayLogged ? 'HOY' : 'ÚLTIMO REGISTRO'}
              </p>
              <p className="text-[#c8f500] font-mono text-3xl font-bold leading-none tracking-tight">
                {lastWeight.weight}<span className="text-lg ml-1 opacity-60">kg</span>
              </p>
            </div>
            {todayLogged && (
              <span className="flex items-center gap-1.5 text-[#c8f500] font-mono text-[10px] tracking-widest bg-[#c8f500]/8 px-2.5 py-1 rounded-sm border border-[#c8f500]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8f500] animate-pulse" />
                REGISTRADO
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-3 flex-wrap">
            {activePhase && (
              <span className="font-mono text-[11px] flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
                style={{
                  color: PHASE_COLORS[activePhase.phase_type] || '#888',
                  backgroundColor: `${PHASE_COLORS[activePhase.phase_type] || '#888'}10`,
                  border: `1px solid ${PHASE_COLORS[activePhase.phase_type] || '#888'}20`,
                }}>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: PHASE_COLORS[activePhase.phase_type] }} />
                {PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type.toUpperCase()} · {phaseDays}d
              </span>
            )}
            {weeklyTrend !== null && (
              <span className="font-mono text-[11px] flex items-center gap-1" style={{ color: weeklyTrend > 0 ? '#4a9eff' : weeklyTrend < 0 ? '#ff2d2d' : '#666' }}>
                {weeklyTrend > 0 ? '↑' : weeklyTrend < 0 ? '↓' : '→'} {Math.abs(weeklyTrend)} kg/7d
              </span>
            )}
            {bestOneRM && (
              <span className="text-[#444444] font-mono text-[11px]">
                1RM {bestOneRM.name.toLowerCase()} {bestOneRM.rm}kg
              </span>
            )}
          </div>

          {!todayLogged && lastWeight.date && (
            <p className="text-[#444444] font-mono text-[10px] mt-2">{lastWeight.date}</p>
          )}
        </div>
      )}

      {/* ── Weekly Report Banner ── */}
      {weekFilled !== null && (
        <button
          onClick={() => onNavigate('weeklyReport', lastMondayISO)}
          className="w-full glass-card rounded-sm p-3 mb-5 flex items-center justify-between group hover:border-[#333333] transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-sm flex items-center justify-center text-base font-mono border"
              style={{
                borderColor: weekFilled ? '#c8f500' : '#ff2d2d',
                color: weekFilled ? '#c8f500' : '#ff2d2d',
                backgroundColor: weekFilled ? 'rgba(200,245,0,0.06)' : 'rgba(255,45,45,0.06)',
              }}
            >
              {weekFilled ? '✓' : '!'}
            </span>
            <div className="text-left">
              <p className="text-[#888888] font-mono text-[10px] tracking-[0.15em]">INFORME SEMANAL</p>
              <p className="text-[#e8e8e8] font-mono text-xs font-bold">{fmtWeekFromISO(lastMondayISO)}</p>
            </div>
          </div>
          <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors font-mono">›</span>
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

      {msg && <p className="text-[#c8f500] font-mono text-sm mb-3 animate-slide-down">{msg}</p>}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-2 mb-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <button
          onClick={() => onNavigate('calories', activeCalories)}
          className="glass-card rounded-sm h-14 flex flex-col items-center justify-center group hover:border-[#333333] transition-all duration-300"
        >
          <span className="text-[#555555] font-mono text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">CALORÍAS</span>
          <span className="text-[#c8f500] font-mono text-sm font-bold group-hover:text-[#deff33] transition-colors">
            {activeCalories ? `${activeCalories}` : '—'}
          </span>
        </button>
        <button
          onClick={() => onNavigate('gym')}
          className="glass-card rounded-sm h-14 flex flex-col items-center justify-center group hover:border-[#333333] transition-all duration-300"
        >
          <span className="text-[#555555] font-mono text-[9px] tracking-[0.2em] group-hover:text-[#888888] transition-colors">GYM</span>
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
        className="w-full h-14 glass-card-elevated rounded-sm border-[#1f2a00] text-[#6a8000] font-mono text-sm font-bold tracking-widest text-left px-5 hover:text-[#c8f500] hover:border-[#c8f500]/40 transition-all duration-300 group relative overflow-hidden mb-4"
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

      <p className="text-[#222222] font-mono text-[10px] mt-4 text-center tracking-widest">weights v0.1</p>
    </PageWrapper>
  )
}