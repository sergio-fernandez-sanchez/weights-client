import { useState, useEffect, useRef } from 'react'
import { getBodyMeasurements } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'

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

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function deltaColor(delta) {
  if (delta === 0) return '#888888'
  return delta > 0 ? '#4a9eff' : '#c8f500'
}

function MeasurementsChart({ reports }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (reports.length < 1) return null

  const sorted = [...reports].sort((a, b) => parseDate(a.date) - parseDate(b.date))

  const W = 320, H = 200
  const PAD = { top: 12, right: 12, bottom: 20, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minDate = parseDate(sorted[0].date).getTime()
  const maxDate = parseDate(sorted[sorted.length - 1].date).getTime()
  const dateRange = maxDate - minDate || 1

  // Calcular rango global de valores
  const allVals = []
  sorted.forEach(r => {
    METRICS.forEach(m => { if (r[m.key] != null) allVals.push(parseFloat(r[m.key])) })
  })
  const minVal = Math.min(...allVals)
  const maxVal = Math.max(...allVals)
  const valRange = maxVal - minVal || 1

  function xPos(date) {
    return PAD.left + ((parseDate(date).getTime() - minDate) / dateRange) * chartW
  }
  function yPos(val) {
    return PAD.top + chartH - ((val - minVal) / valRange) * chartH
  }

  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const val = minVal + (valRange * i) / 3
    return { val, y: yPos(val) }
  })

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = e.clientX - rect.left
    // Encontrar el punto más cercano en X
    let closest = null
    let minDist = Infinity
    sorted.forEach(r => {
      const px = xPos(r.date)
      const dist = Math.abs(mx - px)
      if (dist < minDist) { minDist = dist; closest = r }
    })
    if (closest && minDist < 25) {
      setTooltip({ date: parseDate(closest.date).toLocaleDateString('es-ES'), report: closest, x: xPos(closest.date) })
    } else {
      setTooltip(null)
    }
  }

  return (
    <div className="bg-[#141414] border border-[#333333] p-4 mb-4 relative">
      <p className="text-[#888888] font-mono text-xs mb-3">EVOLUCIÓN DE MEDIDAS</p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full"
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>

        {/* Grid Y */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#1f1f1f" strokeWidth="1" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fill="#555" fontSize="8" fontFamily="Courier New">
              {t.val.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Ticks X */}
        <text x={PAD.left} y={H - 4} textAnchor="start" fill="#555" fontSize="8" fontFamily="Courier New">
          {parseDate(sorted[0].date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </text>
        {sorted.length > 1 && (
          <text x={W - PAD.right} y={H - 4} textAnchor="end" fill="#555" fontSize="8" fontFamily="Courier New">
            {parseDate(sorted[sorted.length - 1].date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </text>
        )}

        {/* Líneas por métrica */}
        {METRICS.map(m => {
          const pts = sorted.filter(r => r[m.key] != null)
          if (pts.length < 2) return null
          const pointStr = pts.map(r => `${xPos(r.date)},${yPos(parseFloat(r[m.key]))}`).join(' ')
          return (
            <polyline key={m.key} points={pointStr} fill="none"
              stroke={m.color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeOpacity="0.8" />
          )
        })}

        {/* Puntos */}
        {METRICS.map(m =>
          sorted.filter(r => r[m.key] != null).map((r, i) => (
            <circle key={`${m.key}-${i}`}
              cx={xPos(r.date)} cy={yPos(parseFloat(r[m.key]))} r="3"
              fill={m.color} stroke="#0a0a0a" strokeWidth="1" />
          ))
        )}

        {/* Crosshair */}
        {tooltip && (
          <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom}
            stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute top-8 right-4 bg-[#0a0a0a] border border-[#333333] px-3 py-2 font-mono text-xs pointer-events-none">
          <p className="text-[#888888] mb-1">{tooltip.date}</p>
          {METRICS.map(m => tooltip.report[m.key] != null && (
            <p key={m.key} style={{ color: m.color }}>
              {m.label}: {parseFloat(tooltip.report[m.key]).toFixed(1)} cm
            </p>
          ))}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-3">
        {METRICS.map(m => (
          <div key={m.key} className="flex items-center gap-1">
            <div className="w-4 h-0.5" style={{ backgroundColor: m.color }} />
            <span className="font-mono text-xs" style={{ color: m.color }}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BodyMeasurements({ onNavigate }) {
  const [reports, setReports]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [tab, setTab]                 = useState('chart')

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getBodyMeasurements()
        const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
        setReports(sorted)
        if (sorted.length > 0) setSelectedIdx(sorted.length - 1)
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

  if (!reports.length) return (
    <div className="min-h-screen px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// MEDIDAS CORPORALES" />
        <p className="text-[#888888] font-mono text-sm">sin medidas registradas</p>
      </div>
    </div>
  )

  const current = reports[selectedIdx]
  const prev    = selectedIdx > 0 ? reports[selectedIdx - 1] : null

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// MEDIDAS CORPORALES" />

        <Tabs options={[['GRÁFICA', 'chart'], ['TABLA', 'table']]} value={tab} onChange={setTab} />

        {tab === 'chart' ? (
          <MeasurementsChart reports={reports} />
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

            <div className="flex flex-col gap-px">
              <div className="flex bg-[#141414] border border-[#333333] px-4 py-2">
                <span className="flex-1 text-[#c8f500] font-mono text-xs">MEDIDA</span>
                {prev && <span className="w-16 text-center text-[#888888] font-mono text-xs">Δ</span>}
                <span className="w-16 text-right text-[#c8f500] font-mono text-xs">VALOR</span>
              </div>
              {METRICS.map(m => {
                const val     = current?.[m.key] != null ? parseFloat(current[m.key]) : null
                const prevVal = prev?.[m.key]    != null ? parseFloat(prev[m.key])    : null
                const delta   = val != null && prevVal != null ? val - prevVal : null
                return (
                  <div key={m.key} className="flex items-center bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 h-10">
                    <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="flex-1 text-[#888888] font-mono text-xs">{m.label}</span>
                    {prev && <span className="w-16 text-center font-mono text-xs font-bold" style={{ color: delta != null ? deltaColor(delta) : '#888888' }}>
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