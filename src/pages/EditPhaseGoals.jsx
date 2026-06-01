import { useState } from 'react'
import { patchPhaseGoals } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'

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
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setToast(null)
    try {
      const wGoal = weightGoal ? parseFloat(weightGoal.replace(',', '.')) : null
      let dGoal = null
      if (dateGoal) {
        const parts = dateGoal.split('/')
        if (parts.length === 3) {
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
          dGoal = `${year}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
        }
      }
      await patchPhaseGoals(wGoal, dGoal)
      setToast({ msg: '✓  objetivos actualizados', type: 'success' })
      setTimeout(() => onNavigate('currentPhase'), 1800)
    } catch {
      setToast({ msg: '✗  error al actualizar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <BackButton />
      <PageHeader title="EDITAR OBJETIVOS" />

      {phase && (
        <div className="glass-card rounded-sm p-4 mb-6" style={{ borderLeft: '3px solid #c8f500' }}>
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-1">FASE ACTIVA</p>
          <p className="text-[#c8f500] font-mono text-lg font-bold uppercase">{phase.phase_type}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="PESO OBJETIVO (kg)" type="number" step="0.01" value={weightGoal} onChange={e => setWeightGoal(e.target.value)} placeholder="75.00" />
        <Input label="FECHA OBJETIVO (dd/mm/aa)" type="text" value={dateGoal} onChange={e => setDateGoal(e.target.value)} placeholder="01/09/26" />
        <Button type="submit" disabled={loading}>{loading ? '...' : 'GUARDAR'}</Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </PageWrapper>
  )
}