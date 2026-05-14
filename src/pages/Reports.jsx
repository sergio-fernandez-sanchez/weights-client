import { useState, useEffect, useRef } from 'react'
import { getReports, getWeights, getPhases } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const METRICS = [
  ['body_fat_pct',         '% GRASA',        false],
  ['skeletal_muscle_mass', 'M.M. ESQ.',       true],
  ['fat_free_mass',        'M. LIBRE GRASA',  true],
  ['visceral_fat_index',   'GRASA VISCERAL',  false],
  ['muscle_quality',       'CAL. MUSCULAR',   true],
  ['trunk_fat_kg',         'TRONCO kg',       false],
  ['trunk_fat_pct',        'TRONCO %',        false],
  ['total_body_water',     'AGUA CORP.',      true],
  ['neck_cm',              'CUELLO cm',       null],
  ['chest_cm',             'PECHO cm',        null],
  ['bicep_cm',             'BÍCEP cm',        true],
  ['hip_cm',               'CADERA cm',       null],
  ['thigh_cm',             'MUSLO cm',        true],
]

const BODY_METRICS = [
  { key: 'body_fat_pct',         label: '% GRASA',         color: '#ff6b35' },
  { key: 'skeletal_muscle_mass', label: 'M.M. ESQUELÉTICA', color: '#4a9eff' },
  { key: 'fat_free_mass',        label: 'M. LIBRE GRASA',  color: '#c8f500' },
]

const PHASE_COLORS = {
  bulk:        '#c8f500',
  cut:         '#ff2d2d',
  maintenance: '#ff9f00',
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
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeDate(date) {
  // Normaliza cualquier formato de fecha a string YYYY-MM-DD
  if (!date) return null
  if (typeof date === 'string') return date.split('T')[0]
  return toISO(new Date(date))
}

function getWeightOnDate(weights, date) {
  const dateStr = normalizeDate(date)
  // Buscar peso exacto ese día, si no el último disponible anterior
  const sorted = [...weights].sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)))
  const exact = sorted.find(w => normalizeDate(w.date) === dateStr)
  if (exact) return exact.weight
  // Último peso anterior a esa fecha
  const before = sorted.find(w => normalizeDate(w.date) < dateStr)
  return before?.weight ?? null
}

function getPhaseOnDate(phases, date) {
  const dateStr = normalizeDate(date)
  // Buscar la fase del día ANTERIOR al informe (el informe se hace al final de una fase)
  const [y, m, d] = dateStr.split('-').map(Number)
  const prevDay = new Date(y, m - 1, d - 1)
  const prevStr = toISO(prevDay)
  for (const phase of phases) {
    const startStr = normalizeDate(phase.start_date)
    const endStr   = phase.end_date ? normalizeDate(phase.end_date) : '2099-01-01'
    if (prevStr >= startStr && prevStr <= endStr) return phase.phase_type
  }
  return null
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
      <p className="font-mono text-xs mb-1" style={{ color }}>{label}</p>
      <p className="text-[#555555] font-mono text-xs">sin suficientes datos</p>
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

export default function Reports({ onNavigate }) {
  const [reports, setReports]       = useState([])
  const [weights, setWeights]       = useState([])
  const [phases, setPhases]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [tab, setTab]               = useState('reports')

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportData, weightData, phaseData] = await Promise.all([
          getReports(), getWeights(), getPhases()
        ])
        const sorted = [...reportData].sort((a, b) => new Date(a.date) - new Date(b.date))
        setReports(sorted)
        setWeights(weightData)
        setPhases(phaseData)
        if (sorted.length > 0) setSelectedIndex(sorted.length - 1)
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

  if (reports.length === 0) return (
    <div className="min-h-screen px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// INFORMES" />
        <p className="text-[#888888] font-mono text-sm">no hay informes registrados</p>
      </div>
    </div>
  )

  const current = reports[selectedIndex]
  const prev    = selectedIndex > 0 ? reports[selectedIndex - 1] : null

  const weightOnDate  = current ? getWeightOnDate(weights, current.date) : null
  const phaseOnDate   = current ? getPhaseOnDate(phases, current.date) : null
  const phaseColor    = phaseOnDate ? (PHASE_COLORS[phaseOnDate] || '#888888') : '#888888'

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// INFORMES" />

        {/* Pestañas */}
        <div className="flex gap-1 mb-4">
          {[['VER INFORMES', 'reports'], ['GRÁFICAS', 'charts']].map(([label, val]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`flex-1 h-9 font-mono text-xs border transition-colors ${
                tab === val
                  ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                  : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
              }`}>{label}</button>
          ))}
        </div>

        {tab === 'charts' ? (
          BODY_METRICS.map(m => (
            <MetricChart key={m.key} reports={reports} metricKey={m.key} label={m.label} color={m.color} />
          ))
        ) : (
          <>
            {/* Selector de fecha */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {reports.map((r, i) => (
                <button key={i} onClick={() => setSelectedIndex(i)}
                  className={`flex-shrink-0 px-3 h-9 font-mono text-xs border transition-colors whitespace-nowrap ${
                    selectedIndex === i
                      ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                      : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
                  }`}>
                  {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </button>
              ))}
            </div>

            {/* Peso y fase */}
            {current && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#141414] border border-[#333333] p-3">
                  <p className="text-[#888888] font-mono text-xs mb-1">PESO ESE DÍA</p>
                  <p className="text-[#c8f500] font-mono text-xl font-bold">
                    {weightOnDate ? `${parseFloat(weightOnDate).toFixed(2)} kg` : '—'}
                  </p>
                </div>
                <div className="bg-[#141414] border border-[#333333] p-3">
                  <p className="text-[#888888] font-mono text-xs mb-1">FASE</p>
                  <p className="font-mono text-xl font-bold" style={{ color: phaseColor }}>
                    {phaseOnDate ? phaseOnDate.toUpperCase() : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Métricas */}
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
                    {prev && (
                      <span className="w-16 text-center font-mono text-xs font-bold"
                        style={{ color: delta != null ? deltaColor(delta, upIsGood) : '#888888' }}>
                        {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}
                      </span>
                    )}
                    <span className="w-16 text-right text-[#e8e8e8] font-mono text-sm font-bold">
                      {val != null ? val.toFixed(1) : '—'}
                    </span>
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