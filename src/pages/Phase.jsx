import { useState } from 'react'
import { postPhase } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'

const PHASE_TYPES = ['bulk', 'cut', 'maintenance']

export default function Phase({ onNavigate }) {
  const [phaseType, setPhaseType] = useState('bulk')
  const [weightGoal, setWeightGoal] = useState('')
  const [dateGoal, setDateGoal] = useState('')
  const [startDateMode, setStartDateMode] = useState('today')
  const [manualStartDate, setManualStartDate] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  function parseManualDate(str) {
    const parts = str.split('/')
    if (parts.length !== 3) return null
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
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
      setMsg('✓  fase iniciada')
      setTimeout(() => onNavigate('home'), 1400)
    } catch {
      setMsg('✗  error al iniciar fase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="NUEVA FASE" />

      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
          TIPO DE FASE
        </label>
        <Tabs options={PHASE_TYPES.map(t => [t.toUpperCase(), t])} value={phaseType} onChange={setPhaseType} className="mb-0" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
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

        {msg && (
          <p className={`font-mono text-sm animate-slide-down ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
            {msg}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'INICIAR FASE'}
        </Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
    </PageWrapper>
  )
}