import { useState, useEffect } from 'react'
import { getDexaReports, getWeights, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const METRICS = [
  ['fat_mass_kg',          'MASA GRASA (kg)',    false],
  ['lean_mass_kg',         'MASA MAGRA (kg)',    true],
  ['body_fat_pct',         '% GRASA',            false],
  ['muscle_mass_kg',       'MASA MUSCULAR (kg)', true],
  ['bone_mineral_density', 'DENS. MINERAL ÓSEA', true],
  ['visceral_fat_kg',      'GRASA VISCERAL (kg)',false],
]

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
  unknown:     '#888888',
}

function deltaColor(delta, upIsGood) {
  if (delta === 0) return '#888888'
  if ((delta > 0 && upIsGood) || (delta < 0 && !upIsGood)) return '#4caf50'
  return '#f44336'
}

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function normalizeDate(date) {
  if (!date) return null
  if (typeof date === 'string') return date.split('T')[0]
  return toISO(new Date(date))
}

function getWeightOnDate(weights, date) {
  const dateStr = normalizeDate(date)
  const sorted = [...weights].sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)))
  return sorted.find(w => normalizeDate(w.date) === dateStr)?.weight
    ?? sorted.find(w => normalizeDate(w.date) < dateStr)?.weight ?? null
}

function getPhaseOnPrevDay(phases, date) {
  const dateStr = normalizeDate(date)
  const [y, m, d] = dateStr.split('-').map(Number)
  const prevStr = toISO(new Date(y, m - 1, d - 1))
  for (const p of phases) {
    const startStr = normalizeDate(p.start_date)
    const endStr   = p.end_date ? normalizeDate(p.end_date) : '2099-01-01'
    if (prevStr >= startStr && prevStr <= endStr) return p.phase_type
  }
  return null
}

export default function DexaReports({ onNavigate }) {
  const [reports, setReports]   = useState([])
  const [weights, setWeights]   = useState([])
  const [phases, setPhases]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [r, w, p] = await Promise.all([getDexaReports(), getWeights(), getPhases()])
        const sorted = [...r].sort((a, b) => new Date(a.date) - new Date(b.date))
        setReports(sorted); setWeights(w); setPhases(p)
        if (sorted.length > 0) setSelectedIdx(sorted.length - 1)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-[#888888] font-mono text-sm">cargando...</p></div>
  if (!reports.length) return (
    <div className="min-h-screen px-6 pb-10"><div className="w-full max-w-sm mx-auto pt-10">
      <BackButton onClick={() => onNavigate('data')} /><PageHeader title="// DEXA" />
      <p className="text-[#888888] font-mono text-sm">sin informes registrados</p>
    </div></div>
  )

  const current = reports[selectedIdx]
  const prev    = selectedIdx > 0 ? reports[selectedIdx - 1] : null
  const weightOnDate = current ? getWeightOnDate(weights, current.date) : null
  const phaseOnDate  = current ? getPhaseOnPrevDay(phases, current.date) : null
  const phaseColor   = phaseOnDate ? (PHASE_COLORS[phaseOnDate] || '#888888') : '#888888'

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// DEXA" />

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {reports.map((r, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className={`flex-shrink-0 px-3 h-9 font-mono text-xs border transition-colors whitespace-nowrap ${selectedIdx === i ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]' : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'}`}>
              {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </button>
          ))}
        </div>

        {current && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#141414] border border-[#333333] p-3">
              <p className="text-[#888888] font-mono text-xs mb-1">PESO ESE DÍA</p>
              <p className="text-[#c8f500] font-mono text-xl font-bold">{weightOnDate ? `${parseFloat(weightOnDate).toFixed(2)} kg` : '—'}</p>
            </div>
            <div className="bg-[#141414] border border-[#333333] p-3">
              <p className="text-[#888888] font-mono text-xs mb-1">FASE</p>
              <p className="font-mono text-xl font-bold" style={{ color: phaseColor }}>{phaseOnDate ? phaseOnDate.toUpperCase() : '—'}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-px">
          <div className="flex bg-[#141414] border border-[#333333] px-4 py-2">
            <span className="flex-1 text-[#c8f500] font-mono text-xs">MÉTRICA</span>
            {prev && <span className="w-16 text-center text-[#888888] font-mono text-xs">Δ</span>}
            <span className="w-16 text-right text-[#c8f500] font-mono text-xs">VALOR</span>
          </div>
          {METRICS.map(([key, label, upIsGood]) => {
            const val     = current?.[key] != null ? parseFloat(current[key]) : null
            const prevVal = prev?.[key]    != null ? parseFloat(prev[key])    : null
            const delta   = val != null && prevVal != null ? val - prevVal : null
            return (
              <div key={key} className="flex items-center bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 h-10">
                <span className="flex-1 text-[#888888] font-mono text-xs">{label}</span>
                {prev && <span className="w-16 text-center font-mono text-xs font-bold" style={{ color: delta != null ? deltaColor(delta, upIsGood) : '#888888' }}>
                  {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}` : '—'}
                </span>}
                <span className="w-16 text-right text-[#e8e8e8] font-mono text-sm font-bold">{val != null ? val.toFixed(2) : '—'}</span>
              </div>
            )
          })}
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}