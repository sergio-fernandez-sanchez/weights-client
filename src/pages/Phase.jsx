import { useState } from 'react'
import { postPhase } from '../api/client'
import { usePhase, PHASE_COLORS } from '../context/PhaseContext'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'

const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTENIMIENTO' }
const PHASE_TYPES = ['bulk', 'cut', 'maintenance']

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
  const activeColor = activePhase ? (PHASE_COLORS[activePhase.phase_type] || '#888') : '#888'

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
            <span className="text-[#ff9f00] font-sans text-xs font-bold tracking-wider">ATENCIÓN</span>
          </div>

          <p className="text-[#888888] font-sans text-sm leading-relaxed mb-1">
            Esto cerrará tu fase actual de
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-sans text-sm font-bold px-2 py-0.5 rounded-sm"
              style={{ color: activeColor, backgroundColor: `${activeColor}10`, border: `1px solid ${activeColor}20` }}>
              {PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type.toUpperCase()}
            </span>
            <span className="text-[#555555] font-sans text-sm">{activePhaseDays} días</span>
          </div>
          <p className="text-[#555555] font-sans text-xs mb-4">
            Se marcará como finalizada con fecha de hoy y se iniciará la nueva fase.
          </p>

          <div className="flex gap-2">
            <button onClick={() => setShowConfirm(false)}
              className="flex-1 h-10 rounded-sm border border-[#252525] text-[#555555] font-sans text-xs font-bold tracking-wider hover:border-[#888888] hover:text-[#888888] transition-colors">
              CANCELAR
            </button>
            <button onClick={doSubmit}
              className="flex-1 h-10 rounded-sm bg-[#ff9f00] text-[#0a0a0a] font-sans text-xs font-bold tracking-wider hover:bg-[#ffb333] transition-colors">
              CONFIRMAR
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
          TIPO DE FASE
        </label>
        <Tabs options={PHASE_TYPES.map(t => [t.toUpperCase(), t])} value={phaseType} onChange={setPhaseType} className="mb-0" />
      </div>

      <form onSubmit={handlePreSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
            FECHA DE INICIO
          </label>
          <Tabs options={[['HOY', 'today'], ['MANUAL', 'manual']]} value={startDateMode} onChange={setStartDateMode} className="mb-0" />
          {startDateMode === 'manual' && (
            <Input type="text" value={manualStartDate} onChange={e => setManualStartDate(e.target.value)} placeholder="dd/mm/aa" />
          )}
        </div>

        <Input label="OBJETIVO DE PESO (kg)" type="number" step="0.01" value={weightGoal} onChange={e => setWeightGoal(e.target.value)} placeholder="75.00" />
        <Input label="FECHA OBJETIVO (dd/mm/aa)" type="text" value={dateGoal} onChange={e => setDateGoal(e.target.value)} placeholder="01/09/26" />

        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'INICIAR FASE'}
        </Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </PageWrapper>
  )
}