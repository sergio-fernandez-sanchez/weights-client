import { SkeletonPage } from '../components/Skeleton'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getWeightsWithPhase, getActivePhase } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import MetricCard from '../components/MetricCard'

const PHASE_COLORS = {
  bulk:        '#a4c400',
  cut:         '#e23535',
  maintenance: '#e88c00',
  unknown:     '#8a8c94',
}

const FILTERS = [
  ['FASE',   'phase'],
  ['TODO',   'all'],
  ['SEMANA', 'week'],
  ['MES',    'month'],
  ['AÑO',    'year'],
]

const PAGE_SIZE = 20

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function movingAverage(data, windowDays) {
  return data.map((point, i) => {
    const pointDate = parseDate(point.date).getTime()
    const cutoff = pointDate - windowDays * 24 * 60 * 60 * 1000
    const window = data.filter(d => {
      const t = parseDate(d.date).getTime()
      return t >= cutoff && t <= pointDate
    })
    const avg = window.reduce((sum, d) => sum + d.weight, 0) / window.length
    return { date: point.date, weight: avg }
  })
}

function WeightChart({ data, filter }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data.length) return null

  const W = 320, H = 180
  const PAD = { top: 16, right: 12, bottom: 20, left: 38 }
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

  // Build segments by phase
  const segments = []
  for (let k = 0; k < data.length - 1; k++) {
    const a = data[k], b = data[k + 1]
    const pts = `${xPos(k)},${yPos(a.weight)} ${xPos(k + 1)},${yPos(b.weight)}`
    const areaPts = `${xPos(k)},${PAD.top + chartH} ${pts} ${xPos(k + 1)},${PAD.top + chartH}`
    segments.push({ phase: b.phase_type, points: pts, area: areaPts, startIdx: k })
  }

  // Marcas de año en el eje X (solo en vista TODO): primer punto de cada año
  const yearTicks = []
  if (filter === 'all') {
    const seen = new Set()
    data.forEach((d, idx) => {
      const y = parseDate(d.date).getFullYear()
      if (!seen.has(y)) { seen.add(y); yearTicks.push({ year: y, x: xPos(idx) }) }
    })
  }

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left - PAD.left
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / chartW) * (data.length - 1))))
    const d = data[idx]
    setTooltip({ x: xPos(idx), y: yPos(d.weight), weight: d.weight, date: parseDate(d.date).toLocaleDateString('es-ES'), color: PHASE_COLORS[d.phase_type] || '#71727a' })
  }

  const presentPhases = [...new Set(data.map(d => d.phase_type))].filter(p => p !== 'unknown')

  return (
    <div className="glass-card rounded-sm p-3 relative overflow-hidden chart-fade-up">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onTouchMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)} className="chart-reveal">
        <defs>
          {Object.entries(PHASE_COLORS).map(([phase, color]) => (
            <linearGradient key={phase} id={`wh-area-${phase}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#d6d8e0" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#444" fontSize="9" fontFamily="monospace">
              {t.val.toFixed(1)}
            </text>
          </g>
        ))}
        {/* Area fills */}
        {segments.map((seg, i) => (
          <polygon key={`area-${i}`} points={seg.area} fill={`url(#wh-area-${seg.phase || 'unknown'})`} />
        ))}
        {/* Lines */}
        {segments.map((seg, i) => (
          <polyline key={i} points={seg.points} fill="none" className="svg-draw" style={{ "--path-length": "2000", "--draw-duration": "2s", "--draw-delay": `${0.2 + i * 0.1}s` }}
            stroke={PHASE_COLORS[seg.phase] || '#71727a'} strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Moving average */}
        {(() => {
          const maData = movingAverage(data, 7)
          if (maData.length < 2) return null
          const maPoints = maData.map((d, i) => `${xPos(i)},${yPos(d.weight)}`).join(' ')
          return <polyline points={maPoints} fill="none" stroke="#1d1d1f" strokeWidth="1" className="svg-draw" style={{ "--path-length": "2000", "--draw-duration": "2.5s", "--draw-delay": "0.5s" }}
            strokeDasharray="4,4" strokeOpacity="0.35" strokeLinejoin="round" />
        })()}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
              stroke={tooltip.color} strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="none" stroke={tooltip.color} strokeWidth="2" />
            <circle cx={tooltip.x} cy={tooltip.y} r="2.5" fill={tooltip.color} />
          </>
        )}
        {yearTicks.map((t, i) => (
          <g key={`yr-${t.year}`}>
            <line x1={t.x} y1={PAD.top} x2={t.x} y2={PAD.top + chartH}
              stroke="rgba(70,80,115,0.12)" strokeWidth="1" strokeDasharray="2,3" />
            <text x={t.x} y={H - 6} textAnchor={i === 0 ? 'start' : 'middle'}
              fill="#71727a" fontSize="9" fontFamily="'JetBrains Mono', monospace">{t.year}</text>
          </g>
        ))}
      </svg>
      {tooltip && (
        <div className="absolute top-3 right-3 glass-tooltip rounded-sm px-3 py-2 font-sans text-xs pointer-events-none">
          <p className="text-[#555555]">{tooltip.date}</p>
          <p className="font-bold text-sm" style={{ color: tooltip.color }}>{tooltip.weight.toFixed(2)} kg</p>
        </div>
      )}
      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {presentPhases.length > 1 && presentPhases.map(phase => (
          <div key={phase} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
            <span className="text-[#555555] font-sans text-[10px]">{phase}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0 border-t border-dashed border-white/20" />
          <span className="text-[#444444] font-sans text-[10px]">media 7d</span>
        </div>
      </div>
    </div>
  )
}

export default function WeightHistory({ onNavigate }) {
  const [weights, setWeights] = useState([])
  const [activePhase, setActivePhase] = useState(null)
  const [filter, setFilter] = useState('phase')
  const [viewMode, setViewMode] = useState('chart')
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [weightData, phaseData] = await Promise.all([
          getWeightsWithPhase(), getActivePhase()
        ])
        setWeights(weightData)
        setActivePhase(phaseData)
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
      return sorted.filter(w => parseDate(w.date) >= cutoff)
    }
    if (filter === 'year') {
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 1)
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

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="PESO" />

        <Tabs options={FILTERS} value={filter} onChange={setFilter} />

        {filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[['MÍN', min], ['MÁX', max], ['MEDIA', avg]].map(([label, val]) => (
              <MetricCard key={label} label={label} value={val} />
            ))}
          </div>
        )}

        <Tabs options={[['GRÁFICA', 'chart'], ['TABLA', 'table']]} value={viewMode} onChange={setViewMode} />

        {loading ? (
          <SkeletonPage />
        ) : viewMode === 'chart' ? (
          filtered.length === 0
            ? <p className="text-[#555555] font-sans text-sm">sin datos para este período</p>
            : <WeightChart data={chartData} filter={filter} />
        ) : (
          filtered.length === 0
            ? <p className="text-[#555555] font-sans text-sm">sin datos para este período</p>
            : <>
                <div className="flex flex-col gap-px rounded-sm overflow-hidden">
                  <div className="flex bg-[#111111] px-4 py-2.5">
                    <span className="flex-1 text-[#c8f500] font-sans text-[10px] tracking-[0.2em]">FECHA</span>
                    <span className="text-[#c8f500] font-sans text-[10px] tracking-[0.2em]">PESO (kg)</span>
                  </div>
                  {paginated.map((w, i) => (
                    <div key={i} className="flex items-center bg-[#0e0e0e] border-b border-[#161616] px-4 h-10 hover:bg-[#131313] transition-colors">
                      <div className="w-1.5 h-5 mr-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PHASE_COLORS[w.phase_type] || PHASE_COLORS.unknown, opacity: 0.6 }} />
                      <span className="flex-1 text-[#666666] font-sans text-xs">
                        {parseDate(w.date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="text-[#e8e8e8] font-sans text-sm font-bold">
                        {parseFloat(w.weight).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                      className="text-[#555555] font-sans text-xs hover:text-[#c8f500] disabled:opacity-30 transition-colors">
                      ← ANTERIOR
                    </button>
                    <span className="text-[#444444] font-sans text-[10px]">{currentPage + 1} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}
                      className="text-[#555555] font-sans text-xs hover:text-[#c8f500] disabled:opacity-30 transition-colors">
                      SIGUIENTE →
                    </button>
                  </div>
                )}
              </>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}