import { useState } from 'react'
import { postCalories } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import Toast from '../components/Toast'
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
      <PageHeader title="CALORÍAS" />

      {currentCalories && (
        <div className="glass-card rounded-sm p-4 mb-6">
          <p className="text-[#555555] font-mono text-[10px] tracking-[0.2em] mb-1">OBJETIVO ACTUAL</p>
          <p className="text-[#c8f500] font-mono text-2xl font-bold">{currentCalories} <span className="text-sm opacity-60">kcal</span></p>
        </div>
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
          <p className={`font-mono text-sm animate-slide-down ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
            {msg}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'GUARDAR'}
        </Button>
      </form>

      <Separator className="mt-10 mb-4" />
      <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
    </PageWrapper>
  )
}