import { SkeletonPage } from '../components/Skeleton'
import { useState, useEffect, useRef } from 'react'
import { getBioimpedanceReports, getWeights, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import MetricCard from '../components/MetricCard'
import EmptyState from '../components/EmptyState'
import DonutChart from '../components/DonutChart'

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

// Métricas que se muestran como líneas en la comparativa
const LINE_METRICS = [
  { key: 'body_fat_pct',         label: '% GRASA',          color: '#e07a3c', upIsGood: false },
  { key: 'skeletal_muscle_mass', label: 'M.M. ESQ. kg',     color: '#3a82d6', upIsGood: true  },
  { key: 'fat_free_mass',        label: 'M. LIBRE GRASA kg', color: '#5f8a00', upIsGood: true  },
  { key: 'total_body_water',     label: 'AGUA kg',           color: '#0093b8', upIsGood: true  },
]

const PHASE_COLORS = { bulk: '#a4c400', cut: '#e23535', maintenance: '#e88c00', unknown: '#8a8c94' }

function deltaColor(delta, upIsGood) {
  if (upIsGood === null || delta === 0) return '#71727a'
  if ((delta > 0 && upIsGood) || (delta < 0 && !upIsGood)) return '#3a9d4e'
  return '#d92020'
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

// ── Gráfico de líneas por métrica (vista comparativa) ──
function MetricLineChart({ reports, metric }) {
  const sorted = [...reports].sort((a, b) => parseDate(a.date) - parseDate(b.date))
  const vals = sorted.map(r => r[metric.key] != null ? parseFloat(r[metric.key]) : null)
  const defined = vals.filter(v => v !== null)
  if (defined.length < 1) return null

  const W = 300, H = 44
  const PAD = { l: 0, r: 0, t: 6, b: 16 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const minV = Math.min(...defined) * 0.995
  const maxV = Math.max(...defined) * 1.005
  const range = maxV - minV || 1

  function xPos(i) { return PAD.l + (sorted.length > 1 ? (i / (sorted.length - 1)) * cW : cW / 2) }
  function yPos(v) { return PAD.t + cH - ((v - minV) / range) * cH }

  // Solo puntos con valor
  const points = sorted.map((r, i) => ({ x: xPos(i), y: vals[i] != null ? yPos(vals[i]) : null, val: vals[i], date: r.date }))
    .filter(p => p.val !== null)

  const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${points[0].x.toFixed(1)},${H} ${polyline} ${points[points.length-1].x.toFixed(1)},${H}`

  const first = defined[0], last = defined[defined.length - 1]
  const delta = parseFloat((last - first).toFixed(2))
  const deltaStr = `${delta > 0 ? '+' : ''}${delta}`
  const dColor = deltaColor(delta, metric.upIsGood)

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.15em', color: metric.color, textTransform: 'uppercase' }}>{metric.label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: metric.color }}>{last.toFixed(defined[0] % 1 === 0 ? 0 : 1)}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: dColor }}>{deltaStr}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id={`area-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metric.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {points.length > 1 && <polygon points={area} fill={`url(#area-${metric.key})`} />}
        {points.length > 1 && <polyline points={polyline} fill="none" stroke={metric.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={i === points.length - 1 ? 3.5 : 2.5}
            fill={i === points.length - 1 ? metric.color : 'rgba(255,255,255,.9)'}
            stroke={metric.color} strokeWidth="1.5" />
        ))}
        {/* Fechas en eje X */}
        {sorted.map((r, i) => (
          <text key={i} x={xPos(i).toFixed(1)} y={H} textAnchor="middle"
            fill={i === sorted.length - 1 ? metric.color : '#8a8c94'}
            fontSize="7" fontFamily="'JetBrains Mono',monospace"
            fontWeight={i === sorted.length - 1 ? '700' : '400'}>
            {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ── Gráfico combinado antiguo (para vista detalle) ──
function BioChart({ reports }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  if (reports.length < 2) return null

  const CHART_METRICS = [
    { key: 'body_fat_pct',         label: '% GRASA',          color: '#e07a3c' },
    { key: 'skeletal_muscle_mass', label: 'M.M. ESQUELÉTICA',  color: '#3a82d6' },
    { key: 'fat_free_mass',        label: 'M. LIBRE GRASA',    color: '#5f8a00' },
  ]

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

  function handleMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scaleX = W / rect.width
    const mx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const mxScaled = mx * scaleX
    let closest = null, minDist = Infinity
    sorted.forEach(r => {
      CHART_METRICS.forEach(m => {
        if (r[m.key] == null) return
        const x = xPos(r.date), y = yPos(parseFloat(r[m.key]))
        const dist = Math.abs(mxScaled - x)
        if (dist < minDist) { minDist = dist; closest = { x, y, val: parseFloat(r[m.key]).toFixed(1), label: m.label, color: m.color, date: parseDate(r.date).toLocaleDateString('es-ES') } }
      })
    })
    if (closest && minDist < 30) setTooltip(closest)
    else setTooltip(null)
  }

  return (
    <div className="glass-card rounded-sm p-4 mb-4 relative">
      <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-2">EVOLUCIÓN</p>
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} onMouseMove={handleMove} onTouchMove={handleMove} onMouseLeave={() => setTooltip(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = PAD.top + chartH * (1 - t)
            const v = (minVal + valRange * t).toFixed(1)
            return <g key={i}><line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(70,80,115,.1)" strokeWidth="1" /><text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="#8a8c94" fontSize="8" fontFamily="'JetBrains Mono',monospace">{v}</text></g>
          })}
          {CHART_METRICS.map(m => {
            const pts = sorted.filter(r => r[m.key] != null)
            if (pts.length < 2) return null
            const polyline = pts.map(r => `${xPos(r.date).toFixed(1)},${yPos(parseFloat(r[m.key])).toFixed(1)}`).join(' ')
            return (
              <g key={m.key}>
                <polyline points={polyline} fill="none" stroke={m.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((r, i) => <circle key={i} cx={xPos(r.date).toFixed(1)} cy={yPos(parseFloat(r[m.key])).toFixed(1)} r="3" fill={m.color} />)}
              </g>
            )
          })}
          {tooltip && <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom} stroke={tooltip.color} strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />}
        </svg>
        {tooltip && (
          <div className="absolute top-2 right-2 glass-tooltip rounded-sm px-3 py-2 font-sans text-xs pointer-events-none">
            <p className="text-[#555555]">{tooltip.date}</p>
            <p className="font-bold" style={{ color: tooltip.color }}>{tooltip.label}: {tooltip.val}</p>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-2 flex-wrap">
        {CHART_METRICS.map(m => (
          <div key={m.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-[#555555] font-sans text-[10px]">{m.label}</span>
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
  const [mode, setMode] = useState('overview') // 'overview' | 'detail'
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

  if (loading) return <SkeletonPage />

  if (reports.length === 0) return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton />
        <PageHeader title="BIOIMPEDANCIA" />
        <EmptyState message="SIN INFORMES DE BIOIMPEDANCIA" icon="◎" />
      </div>
    </div>
  )

  // ── Vista detalle ──
  if (mode === 'detail') {
    const report = reports[selectedIdx]
    const prevReport = selectedIdx > 0 ? reports[selectedIdx - 1] : null
    const firstReport = reports[0]
    const bodyWeight = getWeightOnDate(weights, report.date)
    const phaseType = getPhaseOnPrevDay(phases, report.date)

    return (
      <div className="min-h-screen px-6 md:px-16 pb-10">
        <div className="w-full max-w-sm mx-auto pt-10">
          <button onClick={() => setMode('overview')}
            className="group flex items-center gap-2 text-[#71727a] font-sans text-xs hover:text-[#5f8a00] transition-colors duration-200 mb-6 click-press">
            <span className="inline-flex items-center justify-center w-7 h-7 glass-pill group-hover:border-[#c8f500]/30 transition-all duration-200">
              <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
            </span>
            <span className="tracking-widest font-medium">VOLVER</span>
          </button>
          <PageHeader title="BIOIMPEDANCIA"
            sub={parseDate(report.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />

          {/* Selector de informes */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
            {reports.map((r, i) => {
              const active = i === selectedIdx
              return (
                <button key={i} onClick={() => setSelectedIdx(i)}
                  className={`relative flex-shrink-0 px-3 h-9 font-sans text-xs font-bold rounded-sm transition-all whitespace-nowrap click-press ${
                    active ? 'btn-liquid text-[#2a3a00]' : 'glass-card card-hover text-[#41434a]'
                  }`}>
                  {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </button>
              )
            })}
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {bodyWeight && (
              <span className="text-[#555555] font-sans text-[10px] tracking-wide">
                peso: <span className="text-[#41434a]">{parseFloat(bodyWeight).toFixed(1)} kg</span>
              </span>
            )}
            {phaseType && (
              <span className="font-sans text-[10px] flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
                style={{ color: PHASE_COLORS[phaseType], backgroundColor: `${PHASE_COLORS[phaseType]}10`, border: `1px solid ${PHASE_COLORS[phaseType]}20` }}>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: PHASE_COLORS[phaseType] }} />
                {phaseType.toUpperCase()}
              </span>
            )}
          </div>

          {/* Donut */}
          {report.body_fat_pct != null && (
            <div className="glass-card rounded-sm p-4 mb-4">
              <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-3">COMPOSICIÓN CORPORAL</p>
              <div className="flex items-center justify-center gap-6">
                <DonutChart
                  segments={[
                    { value: parseFloat(report.body_fat_pct), label: '% GRASA', color: '#e07a3c' },
                    { value: 100 - parseFloat(report.body_fat_pct), label: '% LIBRE', color: '#3a82d6' },
                  ]}
                  size={130} strokeWidth={16}
                />
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#e07a3c' }} />
                    <div>
                      <span className="text-[#555555] font-sans text-[9px] block tracking-wider">GRASA</span>
                      <span className="font-mono text-sm font-bold" style={{ color: '#e07a3c' }}>{parseFloat(report.body_fat_pct).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#3a82d6' }} />
                    <div>
                      <span className="text-[#555555] font-sans text-[9px] block tracking-wider">LIBRE DE GRASA</span>
                      <span className="font-mono text-sm font-bold" style={{ color: '#3a82d6' }}>{(100 - parseFloat(report.body_fat_pct)).toFixed(1)}%</span>
                    </div>
                  </div>
                  {report.skeletal_muscle_mass && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#5f8a00' }} />
                      <div>
                        <span className="text-[#555555] font-sans text-[9px] block tracking-wider">M. ESQUELÉTICA</span>
                        <span className="font-mono text-xs font-bold" style={{ color: '#5f8a00' }}>{parseFloat(report.skeletal_muscle_mass).toFixed(1)} kg</span>
                      </div>
                    </div>
                  )}
                  {report.total_body_water && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#0093b8' }} />
                      <div>
                        <span className="text-[#555555] font-sans text-[9px] block tracking-wider">AGUA CORPORAL</span>
                        <span className="font-mono text-xs font-bold" style={{ color: '#0093b8' }}>{parseFloat(report.total_body_water).toFixed(1)} kg</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <BioChart reports={reports} />

          <div className="grid grid-cols-2 gap-2 stagger">
            {METRICS.map(([key, label, upIsGood]) => {
              const val = report[key]
              if (val == null) return null
              const prev = prevReport?.[key]
              const delta = prev != null ? parseFloat(val) - parseFloat(prev) : null
              const firstVal = firstReport?.[key]
              const deltaFirst = (firstReport && firstReport !== report && firstVal != null)
                ? parseFloat(val) - parseFloat(firstVal) : null
              const subLines = []
              if (delta !== null) subLines.push(`${delta > 0 ? '+' : ''}${delta.toFixed(2)} vs ant.`)
              if (deltaFirst !== null) subLines.push(`${deltaFirst > 0 ? '+' : ''}${deltaFirst.toFixed(2)} vs 1ª`)
              return (
                <MetricCard
                  key={key}
                  label={label}
                  value={parseFloat(val).toFixed(2)}
                  sub={subLines.length ? subLines.join('\n') : undefined}
                  valueColor={delta !== null ? deltaColor(delta, upIsGood) : '#5f8a00'}
                />
              )
            })}
          </div>

          <Separator className="mt-8 mb-4" />
          <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
        </div>
      </div>
    )
  }

  // ── Vista overview (comparativa — Opción A) ──
  const first = reports[0]
  const last  = reports[reports.length - 1]

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton />
        <PageHeader title="BIOIMPEDANCIA" sub={`${reports.length} informes`} />

        {/* Líneas por métrica */}
        <div className="glass-card rounded-sm p-4 mb-4">
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-4">EVOLUCIÓN DE MÉTRICAS</p>
          {LINE_METRICS.map(m => {
            const hasData = reports.some(r => r[m.key] != null)
            if (!hasData) return null
            return <MetricLineChart key={m.key} reports={reports} metric={m} />
          })}
        </div>

        {/* Lista de informes clickables */}
        <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-3">INFORMES</p>
        <div className="flex flex-col gap-2">
          {[...reports].reverse().map((r, i) => {
            const realIdx = reports.length - 1 - i
            const isLast  = realIdx === reports.length - 1
            const prev    = realIdx > 0 ? reports[realIdx - 1] : null
            const fatVal  = r.body_fat_pct != null ? parseFloat(r.body_fat_pct).toFixed(1) : null
            const musVal  = r.skeletal_muscle_mass != null ? parseFloat(r.skeletal_muscle_mass).toFixed(1) : null
            const fatDelta = prev?.body_fat_pct != null && r.body_fat_pct != null
              ? parseFloat(r.body_fat_pct) - parseFloat(prev.body_fat_pct) : null
            const musDelta = prev?.skeletal_muscle_mass != null && r.skeletal_muscle_mass != null
              ? parseFloat(r.skeletal_muscle_mass) - parseFloat(prev.skeletal_muscle_mass) : null

            return (
              <button key={realIdx}
                onClick={() => { setSelectedIdx(realIdx); setMode('detail') }}
                className="w-full glass-card glass-sheen card-hover click-press rounded-sm p-3.5 text-left group"
                style={isLast ? { borderColor: 'rgba(164,196,0,.28)' } : undefined}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-sans text-sm font-bold text-[#41434a] group-hover:text-[#5f8a00] transition-colors">
                    {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {isLast && <span className="ml-2 text-[9px] font-mono text-[#5f8a00]">● último</span>}
                  </p>
                  <span className="text-[#a8a9b0] group-hover:text-[#5f8a00] transition-colors">›</span>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {fatVal && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-sans text-[9px] tracking-wider" style={{ color: '#e07a3c' }}>GRASA</span>
                      <span className="font-mono text-xs font-bold text-[#41434a]">{fatVal}%</span>
                      {fatDelta !== null && (
                        <span className="font-mono text-[9px] font-bold" style={{ color: deltaColor(fatDelta, false) }}>
                          {fatDelta > 0 ? '+' : ''}{fatDelta.toFixed(1)}
                        </span>
                      )}
                    </div>
                  )}
                  {musVal && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-sans text-[9px] tracking-wider" style={{ color: '#3a82d6' }}>MÚSCULO</span>
                      <span className="font-mono text-xs font-bold text-[#41434a]">{musVal} kg</span>
                      {musDelta !== null && (
                        <span className="font-mono text-[9px] font-bold" style={{ color: deltaColor(musDelta, true) }}>
                          {musDelta > 0 ? '+' : ''}{musDelta.toFixed(1)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}