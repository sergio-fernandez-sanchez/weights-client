import { useState, useEffect } from 'react'
import { getProfile, saveProfile } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Input from '../components/Input'
import Button from '../components/Button'
import Toast from '../components/Toast'

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
      <p className="text-[#555555] font-mono text-sm animate-pulse">cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="PERFIL" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="NOMBRE" type="text" value={form.name} onChange={set('name')} placeholder="Tu nombre" />
          <Input label="FECHA DE NACIMIENTO" type="date" value={form.birth_date} onChange={set('birth_date')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
              SEXO
            </label>
            <select
              value={form.sex}
              onChange={set('sex')}
              className="bg-[#111111] border border-[#222222] text-[#e8e8e8] font-mono text-sm px-4 h-12 outline-none focus:border-[#c8f500] focus:shadow-[0_0_20px_rgba(200,245,0,0.12)] transition-all duration-300 rounded-sm"
            >
              <option value="">— selecciona —</option>
              {SEX_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <Input label="ALTURA (cm)" type="number" step="0.1" value={form.height_cm} onChange={set('height_cm')} placeholder="175" />

          <div className="flex flex-col gap-1.5">
            <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
              ALERGIAS / INTOLERANCIAS
            </label>
            <textarea
              value={form.allergies}
              onChange={set('allergies')}
              placeholder="Ej: lactosa, gluten..."
              rows={3}
              className="bg-[#111111] border border-[#222222] text-[#e8e8e8] font-mono text-sm px-4 py-3 outline-none focus:border-[#c8f500] focus:shadow-[0_0_20px_rgba(200,245,0,0.12)] transition-all duration-300 resize-none rounded-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
              SUPLEMENTOS
            </label>
            <textarea
              value={form.supplements}
              onChange={set('supplements')}
              placeholder="Ej: creatina 5g, proteína de suero..."
              rows={3}
              className="bg-[#111111] border border-[#222222] text-[#e8e8e8] font-mono text-sm px-4 py-3 outline-none focus:border-[#c8f500] focus:shadow-[0_0_20px_rgba(200,245,0,0.12)] transition-all duration-300 resize-none rounded-sm"
            />
          </div>

          {msg && (
            <p className={`font-mono text-sm animate-slide-down ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
              {msg}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : 'GUARDAR'}
          </Button>
        </form>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
      </div>
    </div>
  )
}