import { useState, useEffect } from 'react'
import { getCalories, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'

const PHASE_COLORS = {
  bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00', unknown: '#888888',
}

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function fmt(d) {
  if (!d) return 'actual'
  return parseDate(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function getPhasesInPeriod(phases, startDate, endDate) {
  const start = parseDate(startDate)
  const end = endDate ? parseDate(endDate) : new Date()
  const result = []
  for (const p of phases) {
    const pStart = parseDate(p.start_date)
    const pEnd = p.end_date ? parseDate(p.end_date) : new Date()
    if (pStart < end && pEnd > start) result.push(p.phase_type)
  }
  return [...new Set(result)]
}

export default function CaloriesHistory({ onNavigate }) {
  const [calories, setCalories] = useState([])
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [calData, phaseData] = await Promise.all([getCalories(), getPhases()])
        setCalories([...calData].sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date)))
        setPhases(phaseData)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#555555] font-mono text-sm animate-pulse">cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="CALORÍAS" sub="historial de objetivos calóricos" />

        {calories.length === 0 ? (
          <EmptyState message="SIN REGISTROS DE CALORÍAS" icon="◇" />
        ) : (
          <div className="flex flex-col gap-2 stagger">
            {[...calories].reverse().map((c, i) => {
              const phaseTypes = getPhasesInPeriod(phases, c.start_date, c.end_date)
              const isActive = !c.end_date
              return (
                <div key={i} className="glass-card rounded-sm p-4 relative overflow-hidden">
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c8f500] to-transparent opacity-60" />
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#c8f500] font-mono text-xl font-bold">{c.calories} <span className="text-sm opacity-60">kcal</span></p>
                      <p className="text-[#444444] font-mono text-[10px] mt-1.5 tracking-wide">
                        {fmt(c.start_date)} → {fmt(c.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {phaseTypes.map((pt, j) => (
                        <span key={j} className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS[pt] || '#888' }} />
                      ))}
                      {isActive && (
                        <span className="font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-sm text-[#c8f500]"
                          style={{ backgroundColor: 'rgba(200,245,0,0.08)', border: '1px solid rgba(200,245,0,0.15)' }}>
                          ACTIVO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
      </div>
    </div>
  )
}