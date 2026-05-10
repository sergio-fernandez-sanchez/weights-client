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
      <PageHeader title="// NUEVA FASE" />

      {/* Tipo de fase */}
      <div className="flex flex-col gap-1 mb-6">
        <label className="text-[#888888] font-mono text-sm">TIPO DE FASE</label>
        <div className="flex">
          {PHASE_TYPES.map(type => (
            <button
              key={type}
              type="button"
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

        {/* Fecha de inicio */}
        <div className="flex flex-col gap-2">
          <label className="text-[#888888] font-mono text-sm">FECHA DE INICIO</label>
          <div className="flex gap-2">
            {[['HOY', 'today'], ['MANUAL', 'manual']].map(([label, val]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStartDateMode(val)}
                className={`flex-1 h-10 font-mono text-xs border transition-colors ${
                  startDateMode === val
                    ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                    : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {startDateMode === 'manual' && (
            <Input
              type="text"
              value={manualStartDate}
              onChange={e => setManualStartDate(e.target.value)}
              placeholder="dd/mm/aa"
            />
          )}
        </div>

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