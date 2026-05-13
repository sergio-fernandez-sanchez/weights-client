import { useState, useEffect } from 'react'
import { getCalories, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
}

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

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
      <p className="text-[#888888] font-mono text-sm">cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// CALORÍAS" />

        {calories.length === 0 ? (
          <p className="text-[#888888] font-mono text-sm">sin registros</p>
        ) : (
          <div className="flex flex-col gap-px">
            <div className="flex bg-[#141414] border border-[#333333] px-4 py-2">
              <span className="w-24 text-[#888888] font-mono text-xs">DESDE</span>
              <span className="w-24 text-[#888888] font-mono text-xs">HASTA</span>
              <span className="flex-1 text-right text-[#c8f500] font-mono text-xs">KCAL</span>
            </div>

            {calories.map((c, i) => {
              const phasesInPeriod = getPhasesInPeriod(phases, c.start_date, c.end_date)
              const isActive = !c.end_date
              const start = parseDate(c.start_date)
              const end = c.end_date ? parseDate(c.end_date) : new Date()
              const days = Math.floor((end - start) / (1000 * 60 * 60 * 24))

              return (
                <div key={i} className={`bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 py-3 ${isActive ? 'border-l-2 border-l-[#c8f500]' : ''}`}>
                  <div className="flex items-center">
                    <span className="w-24 text-[#888888] font-mono text-xs">{fmt(c.start_date)}</span>
                    <span className="w-24 text-[#888888] font-mono text-xs">{fmt(c.end_date)}</span>
                    <span className="flex-1 text-right text-[#e8e8e8] font-mono text-sm font-bold">{c.calories}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[#555555] font-mono text-xs">{days} días</span>
                    {phasesInPeriod.map(phase => (
                      <span key={phase} className="font-mono text-xs font-bold" style={{ color: PHASE_COLORS[phase] || '#888888' }}>
                        {phase}
                      </span>
                    ))}
                    {isActive && <span className="text-[#c8f500] font-mono text-xs">● activo</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}