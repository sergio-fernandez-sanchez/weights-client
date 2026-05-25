import { useState, useEffect, useRef } from 'react'
import { getBioimpedanceReports, getWeights, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import MetricCard from '../components/MetricCard'
import EmptyState from '../components/EmptyState'

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

const PHASE_COLORS = { bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00', unknown: '#888888' }

function deltaColor(delta, upIsGood) {
  if (upIsGood === null || delta === 0) return '#888888'
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

function BioChart({ reports }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  if (reports.length < 2) return null

  const sorted = [...reports].sort((a, b) => parseDate(a.date) - parseDate(b.date))
  const W = 320, H = 160
  const PAD = { top: 12, right: 12, bottom: 20, left: 38 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minDate = parseDate(sorted[0].date).getTime()
  const maxDate = parseDate(sorted[sorted.length - 1].date).getTime()
  const dateRange = maxDate - minDate || 1

  const allVals = []
  sorted.forEach(r => CHART_METRICS.forEach(m => { if (r[m.key] != null) allVals.push(parseFloat(r[m.key])) }))
  const minVal = Math.min(...allVals), maxVal = Math.max(...allVals)
  const valRange = maxVal - minVal || 1

  function xPos(date) { return PAD.left + ((parseDate(date).getTime() - minDate) / dateRange) * chartW }
  function yPos(val) { return PAD.top + chartH - ((val - minVal) / valRange) * chartH }

  const ticks = Array.from({ length: 4 }, (_, i) => {
    const val = minVal + (valRange * i) / 3
    return { val, y: yPos(val) }
  })

  function handleMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * (W / rect.width)
    let closest = sorted[0], closestDist = Infinity
    sorted.forEach(r => { const d = Math.abs(xPos(r.date) - x); if (d < closestDist) { closestDist = d; closest = r } })
    const vals = CHART_METRICS.filter(m => closest[m.key] != null).map(m => ({ label: m.label, val: parseFloat(closest[m.key]).toFixed(1), color: m.color }))
    setTooltip({ x: xPos(closest.date), date: parseDate(closest.date).toLocaleDateString('es-ES'), vals })
  }

  return (
    <div className="glass-card rounded-sm p-3 mb-4 relative overflow-hidden">
      <p className="text-[#555555] font-mono text-[10px] tracking-[0.2em] mb-2">EVOLUCIÓN</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMove} onTouchMove={handleMove}
        onMouseLeave={() => setTooltip(null)} onTouchEnd={() => setTooltip(null)}>
        <defs>
          {CHART_METRICS.map(m => (
            <linearGradient key={m.key} id={`bio-area-${m.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={m.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={m.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#444" fontSize="9" fontFamily="monospace">{t.val.toFixed(1)}</text>
          </g>
        ))}
        {CHART_METRICS.map(m => {
          const pts = sorted.filter(r => r[m.key] != null)
          if (pts.length < 2) return null
          const line = pts.map(r => `${xPos(r.date)},${yPos(parseFloat(r[m.key]))}`).join(' ')
          const area = `${xPos(pts[0].date)},${PAD.top + chartH} ${line} ${xPos(pts[pts.length-1].date)},${PAD.top + chartH}`
          return (
            <g key={m.key}>
              <polygon points={area} fill={`url(#bio-area-${m.key})`} />
              <polyline points={line} fill="none" stroke={m.color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )
        })}
        {tooltip && (
          <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
            stroke="#c8f500" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.3" />
        )}
      </svg>
      {tooltip && (
        <div className="absolute top-3 right-3 glass-card-elevated rounded-sm px-3 py-2 font-mono text-xs pointer-events-none border-none shadow-lg">
          <p className="text-[#555555] mb-1">{tooltip.date}</p>
          {tooltip.vals.map((v, i) => (
            <p key={i} style={{ color: v.color }}>{v.label}: <span className="font-bold">{v.val}</span></p>
          ))}
        </div>
      )}
      <div className="flex gap-4 mt-2 justify-center flex-wrap">
        {CHART_METRICS.map(m => (
          <div key={m.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-[#555555] font-mono text-[10px]">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BioimpedanceReports({ onNavigate }) {
  const [reports, setReports] = useState([])
  const [weights, setWeights] = useState([])
  const [phases, setPhases] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [rData, wData, pData] = await Promise.all([getBioimpedanceReports(), getWeights(), getPhases()])
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
        <PageHeader title="BIOIMPEDANCIA" />
        <EmptyState message="SIN INFORMES DE BIOIMPEDANCIA" icon="◎" />
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
        <PageHeader title="BIOIMPEDANCIA" />

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

        {/* Chart */}
        <BioChart reports={reports} />

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