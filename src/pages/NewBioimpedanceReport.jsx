import { useState } from 'react'
import { postBioimpedanceReport } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'

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
  const [msg, setMsg] = useState('')
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
    setMsg('')
    try {
      const data = Object.fromEntries(
        FIELDS.map(([key]) => [key, values[key] ? parseFloat(values[key].replace(',', '.')) : null])
      )
      if (dateMode === 'manual' && manualDate) data.date = parseManualDate(manualDate)
      await postBioimpedanceReport(data)
      setMsg('✓  informe guardado')
      setTimeout(() => onNavigate('home'), 1400)
    } catch {
      setMsg('✗  error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto">
        <div className="pt-10">
          <BackButton onClick={() => onNavigate('home')} />
          <PageHeader title="// NUEVA BIOIMPEDANCIA" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[#888888] font-mono text-sm">FECHA</label>
            <Tabs options={[['HOY', 'today'], ['MANUAL', 'manual']]} value={dateMode} onChange={setDateMode} className="mb-0" />
            {dateMode === 'manual' && (
              <Input type="text" value={manualDate} onChange={e => setManualDate(e.target.value)} placeholder="dd/mm/aa" />
            )}
          </div>
          {FIELDS.map(([key, label]) => (
            <Input key={key} label={label} type="number" step="0.01"
              value={values[key]} onChange={e => handleChange(key, e.target.value)} placeholder="—" />
          ))}
          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}
          <Button type="submit" disabled={loading}>{loading ? '...' : 'GUARDAR'}</Button>
        </form>
        <Separator className="mt-10 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}