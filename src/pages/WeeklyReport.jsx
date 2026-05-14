import { useState, useEffect } from 'react'
import { getWeeklyReports, saveWeeklyReport } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Input from '../components/Input'
import Button from '../components/Button'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmtDate(date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

function toISO(date) {
  return date.toISOString().split('T')[0]
}

export default function WeeklyReport({ onNavigate, initialWeekStart }) {
  const [reports, setReports] = useState({})
  const [currentMonday, setCurrentMonday] = useState(() => {
    if (initialWeekStart) return new Date(initialWeekStart + 'T00:00:00')
    const today = new Date()
    return getMonday(new Date(today.setDate(today.getDate() - 7)))
  })
  const [form, setForm] = useState({
    training_days:      '',
    avg_daily_steps:    '',
    alcohol_drinks:     '',
    cigarettes_per_day: '',
    avg_water_liters:   '',
    notes:              '',
  })
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]               = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getWeeklyReports()
        const map = {}
        data.forEach(r => { map[r.week_start] = r })
        setReports(map)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const key = toISO(currentMonday)
    const existing = reports[key]
    if (existing) {
      setForm({
        training_days:      existing.training_days      != null ? String(existing.training_days)      : '',
        avg_daily_steps:    existing.avg_daily_steps    != null ? String(existing.avg_daily_steps)    : '',
        alcohol_drinks:     existing.alcohol_drinks     != null ? String(existing.alcohol_drinks)     : '',
        cigarettes_per_day: existing.cigarettes_per_day != null ? String(existing.cigarettes_per_day) : '',
        avg_water_liters:   existing.avg_water_liters   != null ? String(existing.avg_water_liters)   : '',
        notes:              existing.notes              || '',
      })
    } else {
      setForm({ training_days: '', avg_daily_steps: '', alcohol_drinks: '', cigarettes_per_day: '', avg_water_liters: '', notes: '' })
    }
    setMsg('')
  }, [currentMonday, reports])

  function prevWeek() {
    const d = new Date(currentMonday)
    d.setDate(d.getDate() - 7)
    setCurrentMonday(d)
  }

  function nextWeek() {
    const d = new Date(currentMonday)
    d.setDate(d.getDate() + 7)
    // No permitir avanzar más allá de la semana anterior
    const lastMonday = getMonday(new Date(new Date().setDate(new Date().getDate() - 7)))
    if (d <= lastMonday) setCurrentMonday(d)
  }

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    const week_start = toISO(currentMonday)
    try {
      await saveWeeklyReport({
        week_start,
        training_days:      form.training_days      !== '' ? parseInt(form.training_days)         : null,
        avg_daily_steps:    form.avg_daily_steps    !== '' ? parseInt(form.avg_daily_steps)       : null,
        alcohol_drinks:     form.alcohol_drinks     !== '' ? parseFloat(form.alcohol_drinks)      : null,
        cigarettes_per_day: form.cigarettes_per_day !== '' ? parseFloat(form.cigarettes_per_day)  : null,
        avg_water_liters:   form.avg_water_liters   !== '' ? parseFloat(form.avg_water_liters)    : null,
        notes:              form.notes              || null,
      })
      setMsg('✓  informe guardado')
      // Actualizar cache local
      setReports(prev => ({
        ...prev,
        [week_start]: { week_start, ...form }
      }))
      setTimeout(() => onNavigate('home'), 800)
    } catch {
      setMsg('✗  error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const weekEnd    = new Date(currentMonday)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekKey    = toISO(currentMonday)
  const isFilled   = !!reports[weekKey]
  const lastMonday = getMonday(new Date(new Date().setDate(new Date().getDate() - 7)))
  const canGoNext  = currentMonday < lastMonday

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#888888] font-mono text-sm">cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="// INFORME SEMANAL" />

        {/* Selector de semana */}
        <div className="bg-[#141414] border border-[#333333] p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={prevWeek} className="text-[#888888] font-mono text-lg hover:text-[#c8f500] transition-colors px-2">←</button>
            <div className="text-center">
              <p className="font-mono text-sm text-[#e8e8e8] font-bold">
                {fmtDate(currentMonday)} — {fmtDate(weekEnd)}
              </p>
              <p className="font-mono text-xs mt-1" style={{ color: isFilled ? '#c8f500' : '#ff2d2d' }}>
                {isFilled ? '✓ relleno' : '✗ sin rellenar'}
              </p>
            </div>
            <button
              onClick={nextWeek}
              disabled={!canGoNext}
              className={`font-mono text-lg px-2 transition-colors ${canGoNext ? 'text-[#888888] hover:text-[#c8f500]' : 'text-[#333333] cursor-default'}`}
            >→</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="DÍAS DE ENTRENAMIENTO"
            type="number"
            min="0" max="7"
            value={form.training_days}
            onChange={set('training_days')}
            placeholder="0 - 7"
          />
          <Input
            label="PASOS DIARIOS (media)"
            type="number"
            value={form.avg_daily_steps}
            onChange={set('avg_daily_steps')}
            placeholder="8000"
          />
          <Input
            label="ALCOHOL (copas/cervezas totales)"
            type="number"
            step="0.5"
            value={form.alcohol_drinks}
            onChange={set('alcohol_drinks')}
            placeholder="0"
          />
          <Input
            label="CIGARRILLOS (media diaria)"
            type="number"
            step="0.5"
            value={form.cigarettes_per_day}
            onChange={set('cigarettes_per_day')}
            placeholder="0"
          />
          <Input
            label="AGUA (litros/día de media)"
            type="number"
            step="0.1"
            value={form.avg_water_liters}
            onChange={set('avg_water_liters')}
            placeholder="2.0"
          />

          <div className="flex flex-col gap-1">
            <label className="text-[#888888] font-mono text-sm">NOTAS</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Lesiones, enfermedades, eventos especiales..."
              rows={3}
              className="bg-[#141414] border border-[#333333] text-[#e8e8e8] font-mono text-sm px-4 py-3 outline-none focus:border-[#c8f500] transition-colors resize-none"
            />
          </div>

          {msg && (
            <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : isFilled ? 'ACTUALIZAR' : 'GUARDAR'}
          </Button>
        </form>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}