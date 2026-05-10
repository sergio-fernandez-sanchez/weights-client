import { useState, useEffect, useRef } from 'react'
import { getWeightsWithPhase, getActivePhase, getReports } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
  unknown:     '#888888',
}

const FILTERS = [
  ['FASE',   'phase'],
  ['TODO',   'all'],
  ['SEMANA', 'week'],
  ['MES',    'month'],
  ['AÑO',    'year'],
]

const PAGE_SIZE = 20

const BODY_METRICS = [
  { key: 'body_fat_pct',         label: '% GRASA',         color: '#ff6b35' },
  { key: 'skeletal_muscle_mass', label: 'M.M. ESQUELÉTICA', color: '#4a9eff' },
  { key: 'fat_free_mass',        label: 'M. LIBRE GRASA',  color: '#c8f500' },
]

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function WeightChart({ data }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data.length) return null

  const W = 320, H = 180
  const PAD = { top: 10, right: 10, bottom: 20, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const weights = data.map(d => d.weight)
  const minW = Math.min(...weights), maxW = Math.max(...weights)
  const range = maxW - minW || 1

  function xPos(i) { return PAD.left + (i / (data.length - 1)) * chartW }
  function yPos(w) { return PAD.top + chartH - ((w - minW) / range) * chartH }

  const ticks = Array.from({ length: 4 }, (_, i) => {
    const val = minW + (range * i) / 3
    return { val, y: yPos(val) }
  })

  const segments = []
  let i = 0
  while (i < data.length - 1) {
    const phase = data[i].phase_type
    let j = i + 1
    while (j < data.length && data[j].phase_type === phase) j++
    const seg = data.slice(i, Math.min(j + 1, data.length))
    segments.push({ phase, points: seg.map((d, k) => `${xPos(i + k)},${yPos(d.weight)}`).join(' ') })
    i = j
  }

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left - PAD.left
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / chartW) * (data.length - 1))))
    const d = data[idx]
    setTooltip({ x: xPos(idx), y: yPos(d.weight), weight: d.weight, date: parseDate(d.date).toLocaleDateString('es-ES'), color: PHASE_COLORS[d.phase_type] || '#888' })
  }

  const presentPhases = [...new Set(data.map(d => d.phase_type))].filter(p => p !== 'unknown')

  return (
    <div className="bg-[#141414] border border-[#333333] p-3 relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1f1f1f" strokeWidth="1" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fill="#666" fontSize="9" fontFamily="Courier New">
              {t.val.toFixed(1)}
            </text>
          </g>
        ))}
        {segments.map((seg, i) => (
          <polyline key={i} points={seg.points} fill="none"
            stroke={PHASE_COLORS[seg.phase] || '#888'} strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
              stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={tooltip.color} />
          </>
        )}
      </svg>
      {tooltip && (
        <div className="absolute top-3 right-3 bg-[#0a0a0a] border border-[#333333] px-3 py-2 font-mono text-xs pointer-events-none">
          <p className="text-[#888888]">{tooltip.date}</p>
          <p className="font-bold" style={{ color: tooltip.color }}>{tooltip.weight.toFixed(2)} kg</p>
        </div>
      )}
      {presentPhases.length > 1 && (
        <div className="flex gap-4 mt-2 justify-center">
          {presentPhases.map(phase => (
            <div key={phase} className="flex items-center gap-1">
              <div className="w-4 h-0.5" style={{ backgroundColor: PHASE_COLORS[phase] }} />
              <span className="text-[#888888] font-mono text-xs">{phase}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricChart({ reports, metricKey, label, color }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const data = reports
    .filter(r => r[metricKey] != null)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .map(r => ({ date: r.date, value: parseFloat(r[metricKey]) }))

  if (data.length < 2) return (
    <div className="bg-[#141414] border border-[#333333] p-3 mb-3">
      <p className="text-[#888888] font-mono text-xs mb-1" style={{ color }}>{label}</p>
      <p className="text-[#888888] font-mono text-xs">sin suficientes datos</p>
    </div>
  )

  const W = 320, H = 120
  const PAD = { top: 8, right: 10, bottom: 16, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const vals = data.map(d => d.value)
  const minV = Math.min(...vals), maxV = Math.max(...vals)
  const range = maxV - minV || 1

  function xPos(i) { return PAD.left + (i / (data.length - 1)) * chartW }
  function yPos(v) { return PAD.top + chartH - ((v - minV) / range) * chartH }

  const points = data.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(' ')

  const ticks = [minV, (minV + maxV) / 2, maxV].map(val => ({ val, y: yPos(val) }))

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left - PAD.left
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / chartW) * (data.length - 1))))
    const d = data[idx]
    setTooltip({ x: xPos(idx), y: yPos(d.value), value: d.value, date: parseDate(d.date).toLocaleDateString('es-ES') })
  }

  return (
    <div className="bg-[#141414] border border-[#333333] p-3 mb-3 relative">
      <p className="font-mono text-xs mb-2" style={{ color }}>{label}</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1f1f1f" strokeWidth="1" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fill="#666" fontSize="9" fontFamily="Courier New">
              {t.val.toFixed(1)}
            </text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
              stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} />
          </>
        )}
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

export default function WeightHistory({ onNavigate }) {
  const [weights, setWeights] = useState([])
  const [reports, setReports] = useState([])
  const [activePhase, setActivePhase] = useState(null)
  const [filter, setFilter] = useState('phase')
  const [viewMode, setViewMode] = useState('weightChart')
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [weightData, phaseData, reportData] = await Promise.all([
          getWeightsWithPhase(), getActivePhase(), getReports()
        ])
        setWeights(weightData)
        setActivePhase(phaseData)
        setReports(reportData)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  useEffect(() => { setCurrentPage(0) }, [filter])

  function applyFilter(data) {
    const sorted = [...data].sort((a, b) => parseDate(b.date) - parseDate(a.date))
    if (filter === 'all') return sorted
    if (filter === 'phase') {
      if (!activePhase?.start_date) return sorted
      const start = parseDate(activePhase.start_date)
      return sorted.filter(w => parseDate(w.date) >= start)
    }
    if (filter === 'week') {
      const start = new Date()
      const day = start.getDay() === 0 ? 6 : start.getDay() - 1
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      return sorted.filter(w => parseDate(w.date) >= start)
    }
    if (filter === 'month') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      cutoff.setHours(0, 0, 0, 0)
      return sorted.filter(w => parseDate(w.date) >= cutoff)
    }
    if (filter === 'year') {
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      cutoff.setHours(0, 0, 0, 0)
      return sorted.filter(w => parseDate(w.date) >= cutoff)
    }
    return sorted
  }

  const filtered = applyFilter(weights)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const ws = filtered.map(w => parseFloat(w.weight))
  const min = ws.length ? Math.min(...ws).toFixed(2) : '—'
  const max = ws.length ? Math.max(...ws).toFixed(2) : '—'
  const avg = ws.length ? (ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(2) : '—'

  const chartData = [...filtered]
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .map(w => ({ date: w.date, weight: parseFloat(w.weight), phase_type: w.phase_type || 'unknown' }))

  const VIEW_MODES = [
    ['GRÁFICA PESOS', 'weightChart'],
    ['GRÁFICA CUERPO', 'bodyChart'],
    ['TABLA PESOS', 'table'],
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// EVOLUCIÓN" />

        {/* Filters — only for weight views */}
        {viewMode !== 'bodyChart' && (
          <div className="flex gap-1 mb-4">
            {FILTERS.map(([label, val]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`flex-1 h-9 font-mono text-xs border transition-colors ${
                  filter === val
                    ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                    : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
                }`}>{label}</button>
            ))}
          </div>
        )}

        {/* Summary — only for weight views */}
        {viewMode !== 'bodyChart' && filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[['MÍN', min], ['MÁX', max], ['MEDIA', avg]].map(([label, val]) => (
              <div key={label} className="bg-[#141414] border border-[#333333] p-3 text-center">
                <p className="text-[#888888] font-mono text-xs">{label}</p>
                <p className="text-[#c8f500] font-mono text-base font-bold">{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex gap-1 mb-4">
          {VIEW_MODES.map(([label, val]) => (
            <button key={val} onClick={() => setViewMode(val)}
              className={`flex-1 h-9 font-mono text-xs border transition-colors ${
                viewMode === val
                  ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                  : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
              }`}>{label}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-[#888888] font-mono text-sm">cargando...</p>
        ) : viewMode === 'weightChart' ? (
          filtered.length === 0
            ? <p className="text-[#888888] font-mono text-sm">sin datos para este período</p>
            : <WeightChart data={chartData} />
        ) : viewMode === 'bodyChart' ? (
          reports.length === 0
            ? <p className="text-[#888888] font-mono text-sm">no hay informes registrados</p>
            : BODY_METRICS.map(m => (
                <MetricChart key={m.key} reports={reports} metricKey={m.key} label={m.label} color={m.color} />
              ))
        ) : (
          <>
            {filtered.length === 0 ? (
              <p className="text-[#888888] font-mono text-sm">sin datos para este período</p>
            ) : (
              <>
                <div className="flex flex-col gap-px">
                  <div className="flex bg-[#141414] border border-[#333333] px-4 py-2">
                    <span className="flex-1 text-[#c8f500] font-mono text-xs">FECHA</span>
                    <span className="text-[#c8f500] font-mono text-xs">PESO (kg)</span>
                  </div>
                  {paginated.map((w, i) => (
                    <div key={i} className="flex items-center bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 h-10">
                      <div className="w-1 h-6 mr-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PHASE_COLORS[w.phase_type] || PHASE_COLORS.unknown }} />
                      <span className="flex-1 text-[#888888] font-mono text-xs">
                        {parseDate(w.date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="text-[#e8e8e8] font-mono text-sm font-bold">
                        {parseFloat(w.weight).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                      className="text-[#888888] font-mono text-xs hover:text-[#c8f500] disabled:opacity-30 transition-colors">
                      ← ANTERIOR
                    </button>
                    <span className="text-[#888888] font-mono text-xs">{currentPage + 1} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}
                      className="text-[#888888] font-mono text-xs hover:text-[#c8f500] disabled:opacity-30 transition-colors">
                      SIGUIENTE →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}