import { useState } from 'react'
import { postDexaReport } from '../api/client'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'

const FIELDS = [
  ['fat_mass_kg',          'MASA GRASA TOTAL (kg)'],
  ['lean_mass_kg',         'MASA MAGRA TOTAL (kg)'],
  ['body_fat_pct',         '% GRASA CORPORAL'],
  ['muscle_mass_kg',       'MASA MUSCULAR (kg)'],
  ['bone_mineral_density', 'DENSIDAD MINERAL ÓSEA'],
  ['visceral_fat_kg',      'GRASA VISCERAL (kg)'],
]

export default function NewDexaReport({ onNavigate }) {
  const [dateMode, setDateMode] = useState('today')
  const [manualDate, setManualDate] = useState('')
  const [values, setValues] = useState(Object.fromEntries(FIELDS.map(([key]) => [key, ''])))
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(key, val) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  function parseManualDate(str) {
    const parts = str.split('/')
    if (parts.length !== 3) return null
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setToast(null)
    try {
      const data = Object.fromEntries(
        FIELDS.map(([key]) => [key, values[key] ? parseFloat(values[key].replace(',', '.')) : null])
      )
      if (dateMode === 'manual' && manualDate) data.date = parseManualDate(manualDate)
      await postDexaReport(data)
      setToast({ msg: '✓  informe guardado', type: 'success' })
      setTimeout(() => onNavigate('home'), 1800)
    } catch {
      setToast({ msg: '✗  error al guardar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('newReport')} />
        <PageHeader title="DEXA" sub="nuevo informe" />

        <div className="mb-5">
          <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 mb-2">
            <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
            FECHA
          </label>
          <Tabs options={[['HOY', 'today'], ['MANUAL', 'manual']]} value={dateMode} onChange={setDateMode} className="mb-0" />
          {dateMode === 'manual' && (
            <div className="mt-2"><Input type="text" value={manualDate} onChange={e => setManualDate(e.target.value)} placeholder="dd/mm/aa" /></div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {FIELDS.map(([key, label]) => (
            <Input key={key} label={label} type="number" step="0.01" value={values[key]} onChange={e => handleChange(key, e.target.value)} />
          ))}
          <div className="mt-2">
            <Button type="submit" disabled={loading}>{loading ? '...' : 'GUARDAR'}</Button>
          </div>
        </form>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </div>
  )
}