import { useState } from 'react'
import { postCalories } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function Calories({ onNavigate, currentCalories }) {
  const [calories, setCalories] = useState(currentCalories ? String(currentCalories) : '')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!calories) return
    setLoading(true)
    setMsg('')
    try {
      await postCalories(parseInt(calories))
      setMsg('✓  calorías actualizadas')
      setTimeout(() => onNavigate('home'), 1400)
    } catch {
      setMsg('✗  error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="// CALORÍAS" />

      {currentCalories && (
        <p className="text-[#888888] font-mono text-sm mb-6">
          actual: <span className="text-[#c8f500]">{currentCalories} kcal</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="NUEVO OBJETIVO (kcal)"
          type="number"
          value={calories}
          onChange={e => setCalories(e.target.value)}
          placeholder="2500"
          required
        />

        {msg && (
          <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
            {msg}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'GUARDAR'}
        </Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}