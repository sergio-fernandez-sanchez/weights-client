import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, getWeeklyReport, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import HomeHeader from '../components/HomeHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'

function getLastMonday() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7
  const monday = new Date(today)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function fmtWeek(monday) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const fmt = d => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  return `${fmt(monday)}-${fmt(sunday)}`
}

export default function Home({ onNavigate, onLogout }) {
  const [lastWeight, setLastWeight]       = useState(null)
  const [input, setInput]                 = useState('')
  const [msg, setMsg]                     = useState('')
  const [loading, setLoading]             = useState(false)
  const [todayLogged, setTodayLogged]     = useState(false)
  const [activeCalories, setActiveCalories] = useState(null)
  const [weekFilled, setWeekFilled]       = useState(null) // null=cargando, true/false

  const lastMonday    = getLastMonday()
  const lastMondayISO = lastMonday.toISOString().split('T')[0]

  useEffect(() => {
    fetchLastWeight()
    fetchCalories()
    fetchWeeklyStatus()
  }, [])

  async function fetchLastWeight() {
    try {
      const data = await getLastWeight()
      if (data) {
        setLastWeight(data)
        const today = new Date().toISOString().split('T')[0]
        setTodayLogged(data.date === today)
      }
    } catch {}
  }

  async function fetchCalories() {
    try {
      const data = await getActiveCalories()
      if (data) setActiveCalories(data.calories)
    } catch {}
  }

  async function fetchWeeklyStatus() {
    try {
      const data = await getWeeklyReport(lastMondayISO)
      setWeekFilled(!!data)
    } catch {
      setWeekFilled(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input) return
    setLoading(true)
    setMsg('')
    try {
      const val = parseFloat(input.replace(',', '.'))
      await postWeight(val)
      setMsg(todayLogged ? '✓  peso actualizado' : '✓  peso añadido')
      setInput('')
      fetchLastWeight()
    } catch {
      setMsg('✗  error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <HomeHeader />

      {/* Peso + botón informe semanal en la misma fila */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="flex-1">
          {lastWeight && (
            <p className="text-[#c8f500] font-mono text-sm">
              {todayLogged
                ? `✓  ${lastWeight.weight} kg registrado hoy`
                : `último: ${lastWeight.weight} kg — ${lastWeight.date}`}
            </p>
          )}
        </div>

        {/* Botón informe semanal */}
        {weekFilled !== null && (
          <button
            onClick={() => onNavigate('weeklyReport', lastMondayISO)}
            className="flex-shrink-0 px-3 py-2 border font-mono text-xs transition-colors"
            style={{
              backgroundColor: weekFilled ? '#c8f500' : '#1a0000',
              borderColor:     weekFilled ? '#c8f500' : '#ff2d2d',
              color:           weekFilled ? '#0a0a0a' : '#ff2d2d',
            }}
          >
            <p className="font-bold">{fmtWeek(lastMonday)}</p>
            <p className="text-xs mt-0.5">{weekFilled ? '✓ relleno' : '✗ falta'}</p>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-2">
        <Input
          label={todayLogged ? 'ACTUALIZAR PESO (kg)' : 'PESO DE HOY (kg)'}
          type="number"
          step="0.01"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="00.00"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? '...' : todayLogged ? 'ACTUALIZAR PESO' : 'AÑADIR PESO'}
        </Button>
      </form>

      {msg && <p className="text-[#c8f500] font-mono text-sm mb-2">{msg}</p>}

      <div className="flex gap-2 mt-2 mb-2">
        <button
          onClick={() => onNavigate('calories', activeCalories)}
          className="flex-1 h-10 bg-[#141414] border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors"
        >
          {activeCalories ? `${activeCalories} kcal` : '// CALORÍAS'}
        </button>
        <button
          onClick={() => onNavigate('gym')}
          className="flex-1 h-10 bg-[#141414] border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors"
        >
          // GYM →
        </button>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col gap-3">
        {[
          ['// VER DATOS →',     'data'],
          ['// NUEVA FASE →',    'phase'],
          ['// NUEVO INFORME →', 'report'],
          ['// PERFIL →',        'profile'],
        ].map(([label, page]) => (
          <Button key={page} variant="secondary" onClick={() => onNavigate(page)}>
            {label}
          </Button>
        ))}
      </div>

      <Separator className="mt-8 mb-4" />
      <button
        onClick={() => onNavigate('aiReport')}
        className="w-full h-14 bg-[#141414] border border-[#1f2a00] text-[#6a8000] font-mono text-base text-left px-6 hover:bg-[#1a2200] hover:text-[#c8f500] hover:border-[#c8f500] transition-colors mb-3"
      >
        // GENERAR INFORME IA →
      </button>
      <Button variant="ghost" onClick={() => { logout(); onLogout() }}>
        // CERRAR SESIÓN
      </Button>
      <p className="text-[#333333] font-mono text-xs mt-3">sergio / weights v0.1</p>
    </PageWrapper>
  )
}