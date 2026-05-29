import { useState } from 'react'
import { postBioimpedanceReport } from '../api/client'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'

const FIELDS = [
  ['body_fat_pct',         '% GRASA CORPORAL'],
  ['skeletal_muscle_mass', 'MASA MUSCULAR ESQ. (kg)'],
  ['fat_free_mass',        'MASA LIBRE DE GRASA (kg)'],
  ['visceral_fat_index',   'ÍNDICE GRASA VISCERAL'],
  ['muscle_quality',       'CALIDAD MUSCULAR'],
  ['trunk_fat_kg',         'GRASA TRONCO (kg)'],
  ['trunk_fat_pct',        'GRASA TRONCO (%)'],
  ['total_body_water',     'AGUA CORPORAL TOTAL (kg)'],
]

export default function NewBioimpedanceReport({ onNavigate }) {
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
      await postBioimpedanceReport(data)
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
        <PageHeader title="BIOIMPEDANCIA" sub="nuevo informe" />

        <div className="mb-5">
          <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 mb-2">
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
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </div>
  )
}