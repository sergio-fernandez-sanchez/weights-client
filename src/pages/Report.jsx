import { useState } from 'react'
import { postReport } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const FIELDS = [
  ['body_fat_pct',         '% GRASA CORPORAL'],
  ['skeletal_muscle_mass', 'MASA MUSCULAR ESQ. (kg)'],
  ['fat_free_mass',        'MASA LIBRE DE GRASA (kg)'],
  ['visceral_fat_index',   'ÍNDICE GRASA VISCERAL'],
  ['muscle_quality',       'CALIDAD MUSCULAR'],
  ['trunk_fat_kg',         'GRASA TRONCO (kg)'],
  ['trunk_fat_pct',        'GRASA TRONCO (%)'],
  ['total_body_water',     'AGUA CORPORAL TOTAL (kg)'],
  ['neck_cm',              'CUELLO (cm)'],
  ['chest_cm',             'PECHO (cm)'],
  ['bicep_cm',             'BÍCEP (cm)'],
  ['hip_cm',               'CADERA (cm)'],
  ['thigh_cm',             'MUSLO (cm)'],
]

export default function Report({ onNavigate }) {
  const [dateMode, setDateMode] = useState('today') // 'today' | 'manual'
  const [manualDate, setManualDate] = useState('')
  const [values, setValues] = useState(
    Object.fromEntries(FIELDS.map(([key]) => [key, '']))
  )
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
        FIELDS.map(([key]) => [
          key,
          values[key] ? parseFloat(values[key].replace(',', '.')) : null
        ])
      )
      if (dateMode === 'manual' && manualDate) {
        data.date = parseManualDate(manualDate)
      }
      await postReport(data)
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
          <PageHeader title="// NUEVO INFORME" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Selector de fecha */}
          <div className="flex flex-col gap-2">
            <label className="text-[#888888] font-mono text-sm">FECHA DEL INFORME</label>
            <div className="flex gap-2">
              {[['HOY', 'today'], ['MANUAL', 'manual']].map(([label, val]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDateMode(val)}
                  className={`flex-1 h-10 font-mono text-xs border transition-colors ${
                    dateMode === val
                      ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                      : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {dateMode === 'manual' && (
              <Input
                type="text"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                placeholder="dd/mm/aa"
              />
            )}
          </div>

          {FIELDS.map(([key, label]) => (
            <Input
              key={key}
              label={label}
              type="number"
              step="0.01"
              value={values[key]}
              onChange={e => handleChange(key, e.target.value)}
              placeholder="—"
            />
          ))}

          {msg && (
            <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
              {msg}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? '...' : 'GUARDAR INFORME'}
          </Button>
        </form>

        <Separator className="mt-10 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}