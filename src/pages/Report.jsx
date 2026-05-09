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
  const [values, setValues] = useState(
    Object.fromEntries(FIELDS.map(([key]) => [key, '']))
  )
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(key, val) {
    setValues(prev => ({ ...prev, [key]: val }))
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
    <div className="min-h-screen bg-[#0a0a0a] px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto">
        <div className="pt-10">
          <BackButton onClick={() => onNavigate('home')} />
          <PageHeader title="// AÑADIR INFORME" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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