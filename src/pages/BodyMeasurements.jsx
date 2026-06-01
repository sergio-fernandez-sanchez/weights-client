import { SkeletonPage } from '../components/Skeleton'
import { useState, useEffect, useRef } from 'react'
import { getBodyMeasurements } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import EmptyState from '../components/EmptyState'

const METRICS = [
  { key: 'neck_cm',      label: 'CUELLO',   color: '#5f8a00' },
  { key: 'shoulders_cm', label: 'HOMBROS',  color: '#3a82d6' },
  { key: 'chest_cm',     label: 'PECHO',    color: '#e07a3c' },
  { key: 'bicep_cm',     label: 'BÍCEP',    color: '#d92020' },
  { key: 'waist_cm',     label: 'CINTURA',  color: '#b87400' },
  { key: 'hip_cm',       label: 'CADERA',   color: '#a25ce0' },
  { key: 'thigh_cm',     label: 'MUSLO',    color: '#0093b8' },
]

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function deltaColor(delta) {
  if (delta === 0) return '#71727a'
  return delta > 0 ? '#3a82d6' : '#5f8a00'
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
        onMouseLeave={() => setTooltip(null)} className="chart-reveal">
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
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#d6d8e0" strokeWidth="1" />
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
            stroke="#a4c400" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.3" />
        )}
      </svg>
      {tooltip && (
        <div className="absolute top-3 right-3 glass-tooltip rounded-sm px-3 py-2 font-sans text-xs pointer-events-none max-w-[160px]">
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
        <BackButton />
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
        <BackButton />
        <PageHeader title="MEDIDAS" />

        {/* Report selector */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
          {reports.map((r, i) => {
            const active = i === selectedIdx
            return (
              <button key={i} onClick={() => setSelectedIdx(i)}
                className={`relative flex-shrink-0 px-3 h-9 font-sans text-xs font-bold rounded-sm transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#c8f500] text-[#0a0a0a] shadow-[0_0_12px_rgba(164,196,0,0.2)]'
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

        {/* Body Ratios */}
        {report && (() => {
          const ratios = []

          if (report.waist_cm && report.hip_cm) {
            const val = (parseFloat(report.waist_cm) / parseFloat(report.hip_cm)).toFixed(3)
            const prevVal = prevReport?.waist_cm && prevReport?.hip_cm
              ? (parseFloat(prevReport.waist_cm) / parseFloat(prevReport.hip_cm)).toFixed(3)
              : null
            ratios.push({
              label: 'CINTURA / CADERA',
              value: val,
              prev: prevVal,
              desc: 'Indicador de distribución de grasa y riesgo cardiovascular. Relaciona la grasa abdominal con la de caderas.',
              optimal: 'Hombres: < 0.90 (ideal 0.80–0.85). Mujeres: < 0.85 (ideal 0.70–0.80).',
              risk: 'Valores altos indican mayor acumulación de grasa visceral y riesgo metabólico.',
              color: parseFloat(val) < 0.90 ? '#5f8a00' : parseFloat(val) < 0.95 ? '#b87400' : '#d92020',
            })
          }

          if (report.shoulders_cm && report.waist_cm) {
            const val = (parseFloat(report.shoulders_cm) / parseFloat(report.waist_cm)).toFixed(3)
            const prevVal = prevReport?.shoulders_cm && prevReport?.waist_cm
              ? (parseFloat(prevReport.shoulders_cm) / parseFloat(prevReport.waist_cm)).toFixed(3)
              : null
            ratios.push({
              label: 'HOMBROS / CINTURA',
              value: val,
              prev: prevVal,
              desc: 'Mide la proporción torso en V. Cuanto mayor, más ancho es el torso respecto a la cintura.',
              optimal: 'Ratio de Adonis: 1.618 (proporción áurea). Buen rango: 1.40–1.60.',
              risk: 'Valores < 1.30 indican poca diferencia entre hombros y cintura.',
              color: parseFloat(val) >= 1.40 ? '#5f8a00' : parseFloat(val) >= 1.30 ? '#b87400' : '#d92020',
            })
          }

          if (report.chest_cm && report.waist_cm) {
            const val = (parseFloat(report.chest_cm) / parseFloat(report.waist_cm)).toFixed(3)
            const prevVal = prevReport?.chest_cm && prevReport?.waist_cm
              ? (parseFloat(prevReport.chest_cm) / parseFloat(prevReport.waist_cm)).toFixed(3)
              : null
            ratios.push({
              label: 'PECHO / CINTURA',
              value: val,
              prev: prevVal,
              desc: 'Refleja el desarrollo del torso superior respecto al abdomen.',
              optimal: 'Buen rango: 1.15–1.35. Valores altos indican buen desarrollo pectoral con cintura estrecha.',
              risk: 'Valores < 1.10 sugieren falta de desarrollo pectoral o cintura ancha.',
              color: parseFloat(val) >= 1.15 ? '#5f8a00' : parseFloat(val) >= 1.05 ? '#b87400' : '#d92020',
            })
          }

          if (report.thigh_cm && report.waist_cm) {
            const val = (parseFloat(report.thigh_cm) / parseFloat(report.waist_cm)).toFixed(3)
            const prevVal = prevReport?.thigh_cm && prevReport?.waist_cm
              ? (parseFloat(prevReport.thigh_cm) / parseFloat(prevReport.waist_cm)).toFixed(3)
              : null
            ratios.push({
              label: 'MUSLO / CINTURA',
              value: val,
              prev: prevVal,
              desc: 'Indica el desarrollo muscular de piernas en relación al abdomen.',
              optimal: 'Buen rango: 0.60–0.75. Valores altos indican piernas desarrolladas proporcionalmente.',
              risk: 'Valores bajos pueden indicar desproporción entre tren superior e inferior.',
              color: parseFloat(val) >= 0.60 ? '#5f8a00' : parseFloat(val) >= 0.50 ? '#b87400' : '#d92020',
            })
          }

          if (ratios.length === 0) return null

          return (
            <div className="mt-5">
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-3">RATIOS CORPORALES</p>
              <div className="flex flex-col gap-3">
                {ratios.map((r, i) => {
                  const delta = r.prev ? (parseFloat(r.value) - parseFloat(r.prev)).toFixed(3) : null
                  return (
                    <div key={i} className="glass-card rounded-sm p-3.5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: `linear-gradient(90deg, ${r.color}, transparent)` }} />
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[#888888] font-sans text-[10px] tracking-[0.15em] font-bold">{r.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold" style={{ color: r.color }}>{r.value}</span>
                          {delta && (
                            <span className="font-mono text-[10px]" style={{ color: parseFloat(delta) > 0 ? '#3a82d6' : '#b87400' }}>
                              {parseFloat(delta) > 0 ? '↑' : '↓'}{Math.abs(parseFloat(delta)).toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[#555555] font-sans text-[11px] leading-relaxed mb-2">{r.desc}</p>
                      <div className="rounded-sm p-2 bg-[#0e0e0e] border border-[#1a1a1a]">
                        <p className="text-[#c8f500] font-sans text-[10px] leading-relaxed mb-1">✦ {r.optimal}</p>
                        <p className="text-[#555555] font-sans text-[10px] leading-relaxed">{r.risk}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}