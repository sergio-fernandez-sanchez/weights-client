import { useState, useEffect } from 'react'
import { getLastWeight, postWeight, getActiveCalories, logout } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import HomeHeader from '../components/HomeHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'

export default function Home({ onNavigate, onLogout }) {
  const [lastWeight, setLastWeight] = useState(null)
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [todayLogged, setTodayLogged] = useState(false)
  const [activeCalories, setActiveCalories] = useState(null)

  useEffect(() => {
    fetchLastWeight()
    fetchCalories()
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

      {lastWeight && (
        <p className="text-[#c8f500] font-mono text-sm mb-6">
          {todayLogged
            ? `✓  ${lastWeight.weight} kg registrado hoy`
            : `último: ${lastWeight.weight} kg — ${lastWeight.date}`}
        </p>
      )}

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

      {/* Botones secundarios bajo el peso */}
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
          disabled
        >
          // GYM →
        </button>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col gap-3">
        {[
          ['// VER DATOS →', 'data'],
          ['// NUEVA FASE →', 'phase'],
          ['// NUEVO INFORME →', 'report'],
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