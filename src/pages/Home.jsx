import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, getWeeklyReports, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'

function getLastMondayISO() {
  const now = new Date()
  // Usar fecha local, no UTC
  const year  = now.getFullYear()
  const month = now.getMonth()
  const date  = now.getDate()
  const day   = now.getDay() // 0=domingo, 1=lunes...

  // Días hasta el lunes de esta semana
  const daysToThisMonday = day === 0 ? 6 : day - 1
  // Lunes de la semana pasada = lunes de esta semana - 7
  const lastMondayDate = new Date(year, month, date - daysToThisMonday - 7)

  const y = lastMondayDate.getFullYear()
  const m = String(lastMondayDate.getMonth() + 1).padStart(2, '0')
  const d = String(lastMondayDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmtWeekFromISO(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const sunday = new Date(y, m - 1, d + 6)
  const fmt = date => `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}`
  return `${fmt(monday)}-${fmt(sunday)}`
}

export default function Home({ onNavigate, onLogout }) {
  const [lastWeight, setLastWeight]         = useState(null)
  const [input, setInput]                   = useState('')
  const [msg, setMsg]                       = useState('')
  const [loading, setLoading]               = useState(false)
  const [todayLogged, setTodayLogged]       = useState(false)
  const [activeCalories, setActiveCalories] = useState(null)
  const [weekFilled, setWeekFilled]         = useState(null)

  const lastMondayISO = getLastMondayISO()

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
        const today = new Date()
        const todayISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
        setTodayLogged(data.date === todayISO)
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
      const data = await getWeeklyReports()
      const found = Array.isArray(data) && data.some(r => r.week_start === lastMondayISO)
      setWeekFilled(found)
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
      <PageHeader title="// W E I G H T S" blink />

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

        {weekFilled !== null && (
          <button
            onClick={() => onNavigate('weeklyReport', lastMondayISO)}
            className="flex-shrink-0 px-3 py-2 border font-mono text-xs transition-all active:scale-95"
            style={{
              backgroundColor: weekFilled ? 'rgba(200,245,0,0.08)' : 'rgba(255,45,45,0.06)',
              borderColor:     weekFilled ? '#c8f500' : '#ff2d2d',
              color:           weekFilled ? '#c8f500' : '#ff2d2d',
              boxShadow:       weekFilled ? '0 0 12px rgba(200,245,0,0.15)' : '0 0 12px rgba(255,45,45,0.1)',
            }}
          >
            <p className="font-mono text-xs opacity-50 tracking-widest mb-1">SEMANA</p>
            <p className="font-bold tracking-wide">{fmtWeekFromISO(lastMondayISO)}</p>
            <p className="text-xs mt-1 font-bold">{weekFilled ? '✓ relleno' : '✗ pendiente'}</p>
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
          ['// VER DATOS →',        'data'],
          ['// NUEVA FASE →',       'phase'],
          ['// NUEVO INFORME →',     'newReport'],
          ['// DATOS PERSONALES →',  'profile'],
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