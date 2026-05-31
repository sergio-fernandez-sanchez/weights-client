import { readableOnLight } from '../utils/color'
import { useState, useEffect } from 'react'
import { postPhase, getWeights, getGymLogs } from '../api/client'
import { usePhase, PHASE_COLORS } from '../context/PhaseContext'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'
import { haptic } from '../utils/haptic'

const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTENIMIENTO' }
const PHASE_TYPES = ['bulk', 'cut', 'maintenance']
const PHASE_META = {
  bulk:        { label: 'VOLUMEN',       desc: 'ganar masa',    icon: '▲' },
  cut:         { label: 'DEFINICIÓN',    desc: 'perder grasa',  icon: '▼' },
  maintenance: { label: 'MANTENIMIENTO', desc: 'mantener peso', icon: '◆' },
}

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

export default function Phase({ onNavigate }) {
  const { activePhase, refreshPhase } = usePhase()
  const [phaseType, setPhaseType] = useState('bulk')
  const [weightGoal, setWeightGoal] = useState('')
  const [dateGoal, setDateGoal] = useState('')
  const [startDateMode, setStartDateMode] = useState('today')
  const [manualStartDate, setManualStartDate] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [phaseSummary, setPhaseSummary] = useState(null)

  // Calculate summary when showing confirmation
  useEffect(() => {
    if (!showConfirm || !activePhase) return
    async function calcSummary() {
      try {
        const [weights, gymLogs] = await Promise.all([getWeights(), getGymLogs()])
        const phaseStart = parseDate(activePhase.start_date)
        const phaseEnd = new Date()
        const days = Math.max(1, Math.round((phaseEnd - phaseStart) / (1000 * 60 * 60 * 24)))
        const weeks = days / 7

        const pw = weights
          .filter(w => { const d = parseDate(w.date); return d >= phaseStart && d <= phaseEnd })
          .sort((a, b) => parseDate(a.date) - parseDate(b.date))
        const startW = pw.length > 0 ? parseFloat(pw[0].weight) : null
        const endW = pw.length > 0 ? parseFloat(pw[pw.length - 1].weight) : null
        const delta = startW && endW ? parseFloat((endW - startW).toFixed(2)) : null
        const weeklyRate = delta !== null && weeks > 0 ? parseFloat((delta / weeks).toFixed(2)) : null

        const exerciseIds = [...new Set(gymLogs.filter(l => l.weight).map(l => l.exercise_type_id))]
        const pcts = []
        exerciseIds.forEach(exId => {
          const history = gymLogs.filter(l => l.exercise_type_id === exId && l.weight).sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
          const ph = history.filter(l => { const d = parseDate(l.start_date); return d >= phaseStart && d <= phaseEnd })
          const before = history.filter(l => parseDate(l.start_date) < phaseStart)
          if (ph.length === 0) return
          const current = ph[ph.length - 1]
          let base = ph.length >= 2 ? ph[0] : before.length > 0 ? before[before.length - 1] : null
          if (!base || base.id === current.id) return
          const rmB = base.weight && base.reps ? parseFloat(base.weight) * (1 + parseInt(base.reps) / 30) : parseFloat(base.weight)
          const rmC = current.weight && current.reps ? parseFloat(current.weight) * (1 + parseInt(current.reps) / 30) : parseFloat(current.weight)
          if (rmB && rmC) pcts.push(((rmC - rmB) / rmB) * 100)
        })
        const gymPct = pcts.length > 0 ? parseFloat((pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(1)) : null

        setPhaseSummary({ days, delta, weeklyRate, gymPct, startW, endW })
      } catch {}
    }
    calcSummary()
  }, [showConfirm, activePhase])

  function parseManualDate(str) {
    const parts = str.split('/')
    if (parts.length !== 3) return null
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }

  function handlePreSubmit(e) {
    e.preventDefault()
    if (activePhase) {
      setShowConfirm(true)
    } else {
      doSubmit()
    }
  }

  async function doSubmit() {
    setShowConfirm(false)
    setLoading(true)
    setToast(null)
    try {
      const startDate = startDateMode === 'manual' && manualStartDate
        ? parseManualDate(manualStartDate)
        : null
      await postPhase(
        phaseType,
        weightGoal ? parseFloat(weightGoal.replace(',', '.')) : null,
        dateGoal || null,
        startDate
      )
      await refreshPhase()
      haptic('success')
      setToast({ msg: '✓  fase iniciada', type: 'success' })
      setTimeout(() => onNavigate('home'), 1400)
    } catch {
      setToast({ msg: '✗  error al iniciar fase', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const activePhaseDays = activePhase
    ? Math.floor((new Date() - parseDate(activePhase.start_date)) / (1000 * 60 * 60 * 24))
    : null
  const activeColor = activePhase ? readableOnLight(PHASE_COLORS[activePhase.phase_type] || '#71727a') : '#71727a'
  const selColor = PHASE_COLORS[phaseType] || '#a4c400'
  const selInk = readableOnLight(selColor)

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="NUEVA FASE" />

      {/* Confirmation overlay */}
      {showConfirm && activePhase && (
        <div className="glass-card-elevated rounded-sm p-4 mb-5 relative overflow-hidden animate-slide-down">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, #ff9f00, transparent)` }} />

          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-6 h-6 rounded-sm flex items-center justify-center text-sm border border-[#ff9f00] text-[#ff9f00]" style={{ backgroundColor: 'rgba(255,159,0,0.06)' }}>!</span>
            <span className="text-[#ff9f00] font-sans text-xs font-bold tracking-wider">CERRAR FASE</span>
          </div>

          <p className="text-[#888888] font-sans text-sm leading-relaxed mb-2">
            Esto cerrará tu fase actual de
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-sans text-sm font-bold px-2 py-0.5 rounded-sm"
              style={{ color: activeColor, backgroundColor: `${activeColor}10`, border: `1px solid ${activeColor}20` }}>
              {PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type.toUpperCase()}
            </span>
            <span className="text-[#555555] font-sans text-sm">{activePhaseDays} días</span>
          </div>

          {/* Phase summary receipt */}
          {phaseSummary && (
            <div className="rounded-sm p-3 mb-4 relative overflow-hidden" style={{ backgroundColor: `${activeColor}06`, border: `1px solid ${activeColor}12` }}>
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ backgroundColor: activeColor, opacity: 0.2 }} />
              <p className="text-[#555555] font-sans text-[9px] tracking-[0.2em] mb-2.5">RESUMEN DE FASE</p>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-[#444444] font-sans text-[9px] tracking-wide mb-0.5">Δ PESO</p>
                  <p className="font-mono text-sm font-bold" style={{ color: phaseSummary.delta !== null ? (phaseSummary.delta > 0 ? '#5f8a00' : phaseSummary.delta < -0.2 ? '#d92020' : '#b87400') : '#94959c' }}>
                    {phaseSummary.delta !== null ? `${phaseSummary.delta > 0 ? '+' : ''}${phaseSummary.delta} kg` : '—'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[#444444] font-sans text-[9px] tracking-wide mb-0.5">RITMO</p>
                  <p className="font-mono text-sm font-bold" style={{ color: phaseSummary.weeklyRate !== null ? '#71727a' : '#94959c' }}>
                    {phaseSummary.weeklyRate !== null ? `${phaseSummary.weeklyRate > 0 ? '+' : ''}${phaseSummary.weeklyRate} kg/sem` : '—'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[#444444] font-sans text-[9px] tracking-wide mb-0.5">GYM</p>
                  <p className="font-mono text-sm font-bold" style={{ color: phaseSummary.gymPct !== null ? (phaseSummary.gymPct > 2 ? '#5f8a00' : phaseSummary.gymPct < -2 ? '#d92020' : '#b87400') : '#94959c' }}>
                    {phaseSummary.gymPct !== null ? `${phaseSummary.gymPct > 0 ? '+' : ''}${phaseSummary.gymPct}%` : '—'}
                  </p>
                </div>
              </div>
              {phaseSummary.startW && phaseSummary.endW && (
                <p className="text-[#333333] font-sans text-[10px]">
                  {phaseSummary.startW.toFixed(1)} → {phaseSummary.endW.toFixed(1)} kg en {phaseSummary.days} días
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => { setShowConfirm(false); setPhaseSummary(null) }}
              className="flex-1 h-10 glass-card card-hover click-press rounded-sm text-[#6c6e76] font-sans text-xs font-bold tracking-wider transition-all">
              CANCELAR
            </button>
            <button onClick={doSubmit}
              className="flex-1 h-10 rounded-sm text-[#3a2600] font-sans text-xs font-bold tracking-wider click-press transition-all"
              style={{ background: 'linear-gradient(180deg, #f0a420, #e88c00)', border: '0.5px solid #e88c00', boxShadow: '0 6px 16px -6px rgba(232,140,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)' }}>
              CONFIRMAR
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: selColor }} />
          TIPO DE FASE
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PHASE_TYPES.map(t => {
            const c = PHASE_COLORS[t]
            const ink = readableOnLight(c)
            const sel = phaseType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => { haptic('light'); setPhaseType(t) }}
                className="relative glass-card card-hover rounded-sm py-3 px-2 flex flex-col items-center gap-1.5 click-press overflow-hidden"
                style={sel ? { borderColor: `${c}88`, background: `${c}1a`, boxShadow: `0 8px 22px -8px ${c}66, inset 0 1px 1px rgba(255,255,255,0.7)` } : undefined}
              >
                <span className="absolute top-0 left-0 right-0 h-[2px] transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${c}, transparent)`, opacity: sel ? 1 : 0.25 }} />
                <span className="text-base leading-none transition-transform" style={{ color: ink, transform: sel ? 'scale(1.15)' : 'scale(1)' }}>{PHASE_META[t].icon}</span>
                <span className="font-sans text-[9px] font-bold tracking-wider" style={{ color: sel ? ink : '#71727a' }}>{PHASE_META[t].label}</span>
                <span className="font-sans text-[8px]" style={{ color: sel ? ink : '#9a9ba2', opacity: sel ? 0.8 : 0.6 }}>{PHASE_META[t].desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handlePreSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
            <span className="w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: selColor }} />
            FECHA DE INICIO
          </label>
          <Tabs options={[['HOY', 'today'], ['MANUAL', 'manual']]} value={startDateMode} onChange={setStartDateMode} className="mb-0" />
          {startDateMode === 'manual' && (
            <Input type="text" value={manualStartDate} onChange={e => setManualStartDate(e.target.value)} placeholder="dd/mm/aa" />
          )}
        </div>

        <Input label="OBJETIVO DE PESO (kg)" type="number" step="0.01" value={weightGoal} onChange={e => setWeightGoal(e.target.value)} placeholder="75.00" />
        <Input label="FECHA OBJETIVO (dd/mm/aa)" type="text" value={dateGoal} onChange={e => setDateGoal(e.target.value)} placeholder="01/09/26" />

        <button type="submit" disabled={loading}
          className="group relative w-full h-14 rounded-sm overflow-hidden font-sans font-semibold text-sm tracking-wide click-press flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-all"
          style={{
            color: '#cfd0d5',
            background: `linear-gradient(180deg, ${selColor}f0 0%, ${selColor} 50%, ${selColor}cc 100%)`,
            border: `0.5px solid ${selColor}`,
            boxShadow: `0 8px 22px -6px ${selColor}80, inset 0 1px 0 rgba(255,255,255,0.55)`,
          }}>
          <span className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent)', mixBlendMode: 'overlay' }} />
          <span className="relative z-10">{loading ? '...' : 'INICIAR FASE'}</span>
        </button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </PageWrapper>
  )
}