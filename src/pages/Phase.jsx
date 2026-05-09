import { useState } from 'react'
import { postPhase } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const PHASE_TYPES = ['bulk', 'cut', 'maintenance']

export default function Phase({ onNavigate }) {
  const [phaseType, setPhaseType] = useState('bulk')
  const [weightGoal, setWeightGoal] = useState('')
  const [dateGoal, setDateGoal] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await postPhase(
        phaseType,
        weightGoal ? parseFloat(weightGoal.replace(',', '.')) : null,
        dateGoal || null
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
      <PageHeader title="// NUEVA FASE" />

      <div className="flex flex-col gap-1 mb-6">
        <label className="text-[#888888] font-mono text-sm">TIPO DE FASE</label>
        <div className="flex">
          {PHASE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setPhaseType(type)}
              className={`flex-1 h-12 font-mono text-sm border transition-colors ${
                phaseType === type
                  ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                  : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="OBJETIVO DE PESO (kg)"
          type="number"
          step="0.01"
          value={weightGoal}
          onChange={e => setWeightGoal(e.target.value)}
          placeholder="75.00"
        />
        <Input
          label="FECHA OBJETIVO (dd/mm/aa)"
          type="text"
          value={dateGoal}
          onChange={e => setDateGoal(e.target.value)}
          placeholder="01/09/26"
        />

        {msg && (
          <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
            {msg}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'INICIAR FASE'}
        </Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}