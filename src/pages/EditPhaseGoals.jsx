import { useState } from 'react'
import { patchPhaseGoals } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function EditPhaseGoals({ onNavigate, phase }) {
  const [weightGoal, setWeightGoal] = useState(
    phase?.weight_goal ? String(phase.weight_goal) : ''
  )
  const [dateGoal, setDateGoal] = useState(
    phase?.date_goal
      ? new Date(phase.date_goal + 'T00:00:00').toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: '2-digit'
        })
      : ''
  )
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const wGoal = weightGoal ? parseFloat(weightGoal.replace(',', '.')) : null
      let dGoal = null
      if (dateGoal) {
        // Parse dd/mm/yy
        const parts = dateGoal.split('/')
        if (parts.length === 3) {
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
          dGoal = `${year}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
        }
      }
      await patchPhaseGoals(wGoal, dGoal)
      setMsg('✓  objetivos actualizados')
      setTimeout(() => onNavigate('currentPhase'), 1400)
    } catch {
      setMsg('✗  error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('currentPhase')} />
      <PageHeader title="// EDITAR OBJETIVOS" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="NUEVO PESO OBJETIVO (kg)"
          type="number"
          step="0.01"
          value={weightGoal}
          onChange={e => setWeightGoal(e.target.value)}
          placeholder="75.00"
        />
        <Input
          label="NUEVA FECHA OBJETIVO (dd/mm/aa)"
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
          {loading ? '...' : 'GUARDAR CAMBIOS'}
        </Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}