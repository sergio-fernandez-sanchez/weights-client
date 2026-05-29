import { SkeletonPage } from '../components/Skeleton'
import { useState, useEffect, useRef } from 'react'
import { getBodyMeasurements } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import EmptyState from '../components/EmptyState'

const METRICS = [
  { key: 'neck_cm',      label: 'CUELLO',   color: '#c8f500' },
  { key: 'shoulders_cm', label: 'HOMBROS',  color: '#4a9eff' },
  { key: 'chest_cm',     label: 'PECHO',    color: '#ff6b35' },
  { key: 'bicep_cm',     label: 'BÍCEP',    color: '#ff2d2d' },
  { key: 'waist_cm',     label: 'CINTURA',  color: '#ff9f00' },
  { key: 'hip_cm',       label: 'CADERA',   color: '#c77dff' },
  { key: 'thigh_cm',     label: 'MUSLO',    color: '#00b4d8' },
]

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function deltaColor(delta) {
  if (delta === 0) return '#888888'
  return delta > 0 ? '#4a9eff' : '#c8f500'
}

function MeasurementsChart({ reports }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  if (reports.length < 1) return null

  const sorted = [...reports].sort((a, b) => parseDate(a.date) - parseDate(b.date))
  const W = 320, H = 180
  const PAD = { top: 12, right: 12, bottom: 20, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minDate = parseDate(sorted[0].date).getTime()
  const maxDate = parseDate(sorted[sorted.length - 1].date).getTime()
  const dateRange = maxDate - minDate || 1

  const allVals = []
  sorted.forEach(r => { METRICS.forEach(m => { if (r[m.key] != null) allVals.push(parseFloat(r[m.key])) }) })
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
    const vals = METRICS.filter(m => closest[m.key] != null).map(m => ({ label: m.label, val: parseFloat(closest[m.key]).toFixed(1), color: m.color }))
    setTooltip({ x: xPos(closest.date), date: parseDate(closest.date).toLocaleDateString('es-ES'), vals })
  }

  return (
    <div className="glass-card rounded-sm p-3 mb-4 relative overflow-hidden">
      <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-2">EVOLUCIÓN</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMove} onTouchMove={handleMove}
        onMouseLeave={() => setTooltip(null)} onTouchEnd={() => setTooltip(null)} className="chart-reveal">
        <defs>
          {METRICS.map(m => (
            <linearGradient key={m.key} id={`bm-area-${m.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={m.color} stopOpacity="0.12" />
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
        {METRICS.map(m => {
          const pts = sorted.filter(r => r[m.key] != null)
          if (pts.length < 2) return null
          const line = pts.map(r => `${xPos(r.date)},${yPos(parseFloat(r[m.key]))}`).join(' ')
          const area = `${xPos(pts[0].date)},${PAD.top + chartH} ${line} ${xPos(pts[pts.length-1].date)},${PAD.top + chartH}`
          return (
            <g key={m.key}>
              <polygon points={area} fill={`url(#bm-area-${m.key})`} />
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
        <div className="absolute top-3 right-3 glass-card-elevated rounded-sm px-3 py-2 font-sans text-xs pointer-events-none border-none shadow-lg max-w-[160px]">
          <p className="text-[#555555] mb-1">{tooltip.date}</p>
          {tooltip.vals.map((v, i) => (
            <p key={i} className="truncate" style={{ color: v.color }}>{v.label}: <span className="font-bold">{v.val}</span></p>
          ))}
        </div>
      )}
      <div className="flex gap-3 mt-2 justify-center flex-wrap">
        {METRICS.map(m => (
          <div key={m.key} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-[#555555] font-sans text-[9px]">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BodyMeasurements({ onNavigate }) {
  const [reports, setReports] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [viewMode, setViewMode] = useState('chart')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getBodyMeasurements()
        const sorted = [...data].sort((a, b) => parseDate(a.date) - parseDate(b.date))
        setReports(sorted)
        if (sorted.length > 0) setSelectedIdx(sorted.length - 1)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <SkeletonPage />
  )

  if (reports.length === 0) return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="MEDIDAS" />
        <EmptyState message="SIN MEDIDAS REGISTRADAS" icon="▣" />
      </div>
    </div>
  )

  const report = reports[selectedIdx]
  const prevReport = selectedIdx > 0 ? reports[selectedIdx - 1] : null

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="MEDIDAS" />

        {/* Report selector */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
          {reports.map((r, i) => {
            const active = i === selectedIdx
            return (
              <button key={i} onClick={() => setSelectedIdx(i)}
                className={`relative flex-shrink-0 px-3 h-9 font-sans text-xs font-bold rounded-sm transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#c8f500] text-[#0a0a0a] shadow-[0_0_12px_rgba(200,245,0,0.2)]'
                    : 'glass-card text-[#555555] hover:text-[#888888]'
                }`}>
                {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </button>
            )
          })}
        </div>

        <Tabs options={[['GRÁFICA', 'chart'], ['DETALLE', 'detail']]} value={viewMode} onChange={setViewMode} />

        {viewMode === 'chart' ? (
          <MeasurementsChart reports={reports} />
        ) : (
          <div className="flex flex-col gap-2 stagger">
            {METRICS.map(m => {
              const val = report[m.key]
              if (val == null) return null
              const prev = prevReport?.[m.key]
              const delta = prev != null ? parseFloat(val) - parseFloat(prev) : null
              return (
                <div key={m.key} className="glass-card rounded-sm p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-[#888888] font-sans text-xs uppercase">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#e8e8e8] font-sans text-sm font-bold">{parseFloat(val).toFixed(1)} cm</span>
                    {delta !== null && (
                      <span className="font-sans text-[10px] font-bold" style={{ color: deltaColor(delta) }}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}