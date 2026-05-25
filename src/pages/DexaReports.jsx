import { useState, useEffect } from 'react'
import { getDexaReports, getWeights, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import MetricCard from '../components/MetricCard'
import EmptyState from '../components/EmptyState'

const METRICS = [
  ['fat_mass_kg',          'MASA GRASA (kg)',    false],
  ['lean_mass_kg',         'MASA MAGRA (kg)',    true],
  ['body_fat_pct',         '% GRASA',            false],
  ['muscle_mass_kg',       'MASA MUSCULAR (kg)', true],
  ['bone_mineral_density', 'DENS. MINERAL ÓSEA', true],
  ['visceral_fat_kg',      'GRASA VISCERAL (kg)',false],
]

const PHASE_COLORS = { bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00', unknown: '#888888' }

function deltaColor(delta, upIsGood) {
  if (delta === 0) return '#888888'
  if ((delta > 0 && upIsGood) || (delta < 0 && !upIsGood)) return '#4caf50'
  return '#f44336'
}

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }
function toISO(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` }
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
    const endStr = p.end_date ? normalizeDate(p.end_date) : '2099-01-01'
    if (prevStr >= startStr && prevStr <= endStr) return p.phase_type
  }
  return null
}

export default function DexaReports({ onNavigate }) {
  const [reports, setReports] = useState([])
  const [weights, setWeights] = useState([])
  const [phases, setPhases] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [rData, wData, pData] = await Promise.all([getDexaReports(), getWeights(), getPhases()])
        const sorted = [...rData].sort((a, b) => parseDate(a.date) - parseDate(b.date))
        setReports(sorted)
        setWeights(wData)
        setPhases(pData)
        if (sorted.length > 0) setSelectedIdx(sorted.length - 1)
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

  if (reports.length === 0) return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="DEXA" />
        <EmptyState message="SIN INFORMES DEXA" icon="⬢" />
      </div>
    </div>
  )

  const report = reports[selectedIdx]
  const prevReport = selectedIdx > 0 ? reports[selectedIdx - 1] : null
  const bodyWeight = getWeightOnDate(weights, report.date)
  const phaseType = getPhaseOnPrevDay(phases, report.date)

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="DEXA" />

        {/* Report selector */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
          {reports.map((r, i) => {
            const active = i === selectedIdx
            return (
              <button key={i} onClick={() => setSelectedIdx(i)}
                className={`relative flex-shrink-0 px-3 h-9 font-mono text-xs font-bold rounded-sm transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#c8f500] text-[#0a0a0a] shadow-[0_0_12px_rgba(200,245,0,0.2)]'
                    : 'glass-card text-[#555555] hover:text-[#888888]'
                }`}>
                {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </button>
            )
          })}
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {bodyWeight && (
            <span className="text-[#555555] font-mono text-[10px] tracking-wide">
              peso: <span className="text-[#e8e8e8]">{parseFloat(bodyWeight).toFixed(1)} kg</span>
            </span>
          )}
          {phaseType && (
            <span className="font-mono text-[10px] flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
              style={{ color: PHASE_COLORS[phaseType], backgroundColor: `${PHASE_COLORS[phaseType]}10`, border: `1px solid ${PHASE_COLORS[phaseType]}20` }}>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: PHASE_COLORS[phaseType] }} />
              {phaseType.toUpperCase()}
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 stagger">
          {METRICS.map(([key, label, upIsGood]) => {
            const val = report[key]
            if (val == null) return null
            const prev = prevReport?.[key]
            const delta = prev != null ? parseFloat(val) - parseFloat(prev) : null
            return (
              <MetricCard
                key={key}
                label={label}
                value={parseFloat(val).toFixed(2)}
                sub={delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)} vs anterior` : undefined}
                valueColor={delta !== null ? deltaColor(delta, upIsGood) : '#c8f500'}
              />
            )
          })}
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
      </div>
    </div>
  )
}