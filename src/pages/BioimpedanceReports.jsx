import { useState, useEffect, useRef } from 'react'
import { getBioimpedanceReports, getWeights, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import MetricCard from '../components/MetricCard'

const METRICS = [
  ['body_fat_pct',         '% GRASA',        false],
  ['skeletal_muscle_mass', 'M.M. ESQ. kg',   true],
  ['fat_free_mass',        'M. LIBRE GRASA', true],
  ['visceral_fat_index',   'GRASA VISCERAL', false],
  ['muscle_quality',       'CAL. MUSCULAR',  true],
  ['trunk_fat_kg',         'TRONCO kg',      false],
  ['trunk_fat_pct',        'TRONCO %',       false],
  ['total_body_water',     'AGUA CORP.',     true],
]

const CHART_METRICS = [
  { key: 'body_fat_pct',         label: '% GRASA',         color: '#ff6b35' },
  { key: 'skeletal_muscle_mass', label: 'M.M. ESQUELÉTICA', color: '#4a9eff' },
  { key: 'fat_free_mass',        label: 'M. LIBRE GRASA',  color: '#c8f500' },
]

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
  unknown:     '#888888',
}

function deltaColor(delta, upIsGood) {
  if (upIsGood === null || delta === 0) return '#888888'
  if ((delta > 0 && upIsGood) || (delta < 0 && !upIsGood)) return '#4caf50'
  return '#f44336'
}

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

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
  const exact = sorted.find(w => normalizeDate(w.date) === dateStr)
  if (exact) return exact.weight
  return sorted.find(w => normalizeDate(w.date) < dateStr)?.weight ?? null
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

function MetricChart({ reports, metricKey, label, color }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  const data = reports.filter(r => r[metricKey] != null)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .map(r => ({ date: r.date, value: parseFloat(r[metricKey]) }))
  if (data.length < 2) return null
  const W = 320, H = 100, PAD = { top: 8, right: 10, bottom: 16, left: 36 }
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom
  const vals = data.map(d => d.value)
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1
  function xPos(i) { return PAD.left + (i / (data.length - 1)) * chartW }
  function yPos(v) { return PAD.top + chartH - ((v - minV) / range) * chartH }
  const points = data.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(' ')
  function handleMouseMove(e) {
    const svg = svgRef.current; if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left - PAD.left
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / chartW) * (data.length - 1))))
    setTooltip({ x: xPos(idx), y: yPos(data[idx].value), value: data[idx].value, date: parseDate(data[idx].date).toLocaleDateString('es-ES') })
  }
  return (
    <div className="bg-[#141414] border border-[#333333] p-3 mb-3 relative">
      <p className="font-mono text-xs mb-2" style={{ color }}>{label}</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        {[minV, (minV+maxV)/2, maxV].map((val, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yPos(val)} x2={W-PAD.right} y2={yPos(val)} stroke="#1f1f1f" strokeWidth="1" />
            <text x={PAD.left-4} y={yPos(val)+4} textAnchor="end" fill="#555" fontSize="8" fontFamily="Courier New">{val.toFixed(1)}</text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {tooltip && <><line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H-PAD.bottom} stroke="#333" strokeWidth="1" strokeDasharray="3,3" /><circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} /></>}
      </svg>
      {tooltip && (
        <div className="absolute top-8 right-3 bg-[#0a0a0a] border border-[#333333] px-3 py-2 font-mono text-xs pointer-events-none">
          <p className="text-[#888888]">{tooltip.date}</p>
          <p className="font-bold" style={{ color }}>{tooltip.value.toFixed(1)}</p>
        </div>
      )}
    </div>
  )
}

export default function BioimpedanceReports({ onNavigate }) {
  const [reports, setReports]   = useState([])
  const [weights, setWeights]   = useState([])
  const [phases, setPhases]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [tab, setTab]           = useState('reports')

  useEffect(() => {
    async function fetchData() {
      try {
        const [r, w, p] = await Promise.all([getBioimpedanceReports(), getWeights(), getPhases()])
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
      <BackButton onClick={() => onNavigate('data')} /><PageHeader title="// BIOIMPEDANCIA" />
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
        <PageHeader title="// BIOIMPEDANCIA" />

        <Tabs options={[['VER INFORMES', 'reports'], ['GRÁFICAS', 'charts']]} value={tab} onChange={setTab} />

        {tab === 'charts' ? (
          CHART_METRICS.map(m => <MetricChart key={m.key} reports={reports} metricKey={m.key} label={m.label} color={m.color} />)
        ) : (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {reports.map((r, i) => {
                const active = selectedIdx === i
                return (
                  <button key={i} onClick={() => setSelectedIdx(i)}
                    className={`relative flex-shrink-0 px-3 h-9 font-mono text-xs font-bold border transition-all whitespace-nowrap ${active ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]' : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'}`}>
                    {active && (
                      <>
                        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-[#0a0a0a]" />
                        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-[#0a0a0a]" />
                      </>
                    )}
                    {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </button>
                )
              })}
            </div>
            {current && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <MetricCard label="PESO ESE DÍA" value={weightOnDate ? `${parseFloat(weightOnDate).toFixed(2)} kg` : '—'} />
                <MetricCard label="FASE" value={phaseOnDate ? phaseOnDate.toUpperCase() : '—'} valueColor={phaseColor} />
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
                      {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}
                    </span>}
                    <span className="w-16 text-right text-[#e8e8e8] font-mono text-sm font-bold">{val != null ? val.toFixed(1) : '—'}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}