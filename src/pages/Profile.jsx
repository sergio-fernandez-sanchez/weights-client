import { useState, useEffect } from 'react'
import { getProfile, saveProfile } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Input from '../components/Input'
import Button from '../components/Button'

const SEX_OPTIONS = [
  { value: 'male',   label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
  { value: 'other',  label: 'Otro' },
]

export default function Profile({ onNavigate }) {
  const [form, setForm] = useState({
    name:        '',
    birth_date:  '',
    sex:         '',
    height_cm:   '',
    allergies:   '',
    supplements: '',
  })
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]             = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getProfile()
        if (data) {
          setForm({
            name:        data.name        || '',
            birth_date:  data.birth_date  || '',
            sex:         data.sex         || '',
            height_cm:   data.height_cm   ? String(data.height_cm) : '',
            allergies:   data.allergies   || '',
            supplements: data.supplements || '',
          })
        }
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    try {
      await saveProfile({
        name:        form.name        || null,
        birth_date:  form.birth_date  || null,
        sex:         form.sex         || null,
        height_cm:   form.height_cm   ? parseFloat(form.height_cm) : null,
        allergies:   form.allergies   || null,
        supplements: form.supplements || null,
      })
      setMsg('✓  datos guardados')
    } catch {
      setMsg('✗  error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#888888] font-mono text-sm">cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="// PERFIL" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="NOMBRE"
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Tu nombre"
          />

          <Input
            label="FECHA DE NACIMIENTO"
            type="date"
            value={form.birth_date}
            onChange={set('birth_date')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-[#888888] font-mono text-sm">SEXO</label>
            <select
              value={form.sex}
              onChange={set('sex')}
              className="bg-[#141414] border border-[#333333] text-[#e8e8e8] font-mono text-sm px-4 h-12 outline-none focus:border-[#c8f500] transition-colors"
            >
              <option value="">— selecciona —</option>
              {SEX_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="ALTURA (cm)"
            type="number"
            step="0.1"
            value={form.height_cm}
            onChange={set('height_cm')}
            placeholder="175"
          />

          <div className="flex flex-col gap-1">
            <label className="text-[#888888] font-mono text-sm">ALERGIAS / INTOLERANCIAS</label>
            <textarea
              value={form.allergies}
              onChange={set('allergies')}
              placeholder="Ej: lactosa, gluten..."
              rows={3}
              className="bg-[#141414] border border-[#333333] text-[#e8e8e8] font-mono text-sm px-4 py-3 outline-none focus:border-[#c8f500] transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#888888] font-mono text-sm">SUPLEMENTOS</label>
            <textarea
              value={form.supplements}
              onChange={set('supplements')}
              placeholder="Ej: creatina 5g, proteína de suero..."
              rows={3}
              className="bg-[#141414] border border-[#333333] text-[#e8e8e8] font-mono text-sm px-4 py-3 outline-none focus:border-[#c8f500] transition-colors resize-none"
            />
          </div>

          {msg && (
            <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
              {msg}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : 'GUARDAR'}
          </Button>
        </form>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}