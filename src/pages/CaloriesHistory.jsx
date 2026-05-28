import { useState, useEffect } from 'react'
import { getCalories, getPhases, getWeights } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Input from '../components/Input'
import EmptyState from '../components/EmptyState'
import Toast from '../components/Toast'

const PHASE_COLORS = {
  bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00', unknown: '#888888',
}
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTEN.' }

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function fmt(d) {
  if (!d) return 'actual'
  return parseDate(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function daysBetween(start, end) {
  const s = parseDate(start)
  const e = end ? parseDate(end) : new Date()
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)))
}

function getPhasesInPeriod(phases, startDate, endDate) {
  const start = parseDate(startDate)
  const end = endDate ? parseDate(endDate) : new Date()
  const result = []
  for (const p of phases) {
    const pStart = parseDate(p.start_date)
    const pEnd = p.end_date ? parseDate(p.end_date) : new Date()
    if (pStart < end && pEnd > start) result.push(p.phase_type)
  }
  return [...new Set(result)]
}

function getWeightDelta(weights, startDate, endDate) {
  const start = parseDate(startDate)
  const end = endDate ? parseDate(endDate) : new Date()

  const sorted = [...weights]
    .filter(w => {
      const d = parseDate(w.date)
      return d >= start && d <= end
    })
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))

  if (sorted.length < 2) return null

  const first = parseFloat(sorted[0].weight)
  const last = parseFloat(sorted[sorted.length - 1].weight)
  return parseFloat((last - first).toFixed(2))
}

function deltaColor(delta) {
  if (delta === null) return '#444444'
  if (delta > 0.2) return '#c8f500'
  if (delta < -0.2) return '#ff2d2d'
  return '#ff9f00'
}

const STORAGE_KEY = 'weights_calorie_references'

function loadRefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { cut: '', maintenance: '', bulk: '' }
}

function saveRefs(refs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(refs)) } catch {}
}

function CalorieRefCard({ refs, onEdit }) {
  const hasData = refs.cut || refs.maintenance || refs.bulk
  const items = [
    { key: 'cut',         label: 'DÉFICIT',  color: '#ff2d2d' },
    { key: 'maintenance', label: 'MANTEN.',  color: '#ff9f00' },
    { key: 'bulk',        label: 'VOLUMEN',  color: '#c8f500' },
  ]

  return (
    <div className="relative glass-card-elevated rounded-sm p-4 mb-5 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c8f500] via-[#ff9f00] to-[#ff2d2d] opacity-50" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-[3px] h-3.5 rounded-full bg-[#c8f500]" />
          <span className="text-[#888888] font-sans text-[10px] tracking-[0.2em] font-bold">MIS CALORÍAS DE REFERENCIA</span>
        </div>
        <button
          onClick={onEdit}
          className="px-2.5 h-6 rounded-sm border border-[#252525] text-[#555555] font-sans text-[10px] font-bold tracking-wider hover:border-[#c8f500] hover:text-[#c8f500] transition-colors"
        >
          EDITAR
        </button>
      </div>

      {!hasData ? (
        <p className="text-[#333333] font-sans text-xs">Añade tus calorías orientativas para cada fase</p>
      ) : (
        <div className="flex gap-2">
          {items.map(item => (
            <div key={item.key} className="flex-1 rounded-sm p-2.5 relative overflow-hidden"
              style={{ backgroundColor: `${item.color}08`, border: `1px solid ${item.color}15` }}>
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ backgroundColor: item.color, opacity: 0.3 }} />
              <p className="font-sans text-[9px] tracking-[0.15em] mb-1" style={{ color: `${item.color}99` }}>{item.label}</p>
              <p className="font-mono text-base font-bold leading-none" style={{ color: refs[item.key] ? item.color : '#2a2a2a' }}>
                {refs[item.key] || '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EditRefsModal({ refs, onSave, onCancel }) {
  const [form, setForm] = useState({ ...refs })

  return (
    <div className="glass-card-elevated rounded-sm p-4 mb-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c8f500] to-transparent opacity-60" />
      <p className="text-[#888888] font-sans text-[10px] tracking-[0.2em] font-bold mb-4">EDITAR REFERENCIAS</p>

      <div className="flex flex-col gap-3 mb-4">
        <Input label="DÉFICIT (kcal)" type="number" value={form.cut} onChange={e => setForm(f => ({ ...f, cut: e.target.value }))} placeholder="1800" />
        <Input label="MANTENIMIENTO (kcal)" type="number" value={form.maintenance} onChange={e => setForm(f => ({ ...f, maintenance: e.target.value }))} placeholder="2200" />
        <Input label="VOLUMEN (kcal)" type="number" value={form.bulk} onChange={e => setForm(f => ({ ...f, bulk: e.target.value }))} placeholder="2800" />
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 h-10 rounded-sm border border-[#252525] text-[#555555] font-sans text-xs font-bold tracking-wider hover:border-[#888888] hover:text-[#888888] transition-colors">
          CANCELAR
        </button>
        <button onClick={() => onSave(form)}
          className="flex-1 h-10 rounded-sm bg-[#c8f500] text-[#0a0a0a] font-sans text-xs font-bold tracking-wider hover:bg-[#deff33] transition-colors">
          GUARDAR
        </button>
      </div>
    </div>
  )
}

export default function CaloriesHistory({ onNavigate }) {
  const [calories, setCalories] = useState([])
  const [phases, setPhases] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [refs, setRefs] = useState(loadRefs())
  const [editingRefs, setEditingRefs] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [calData, phaseData, weightData] = await Promise.all([
          getCalories(), getPhases(), getWeights()
        ])
        setCalories([...calData].sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date)))
        setPhases(phaseData)
        setWeights(weightData)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  function handleSaveRefs(newRefs) {
    setRefs(newRefs)
    saveRefs(newRefs)
    setEditingRefs(false)
    setToast({ msg: '✓  referencias guardadas', type: 'success' })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#555555] font-sans text-sm animate-pulse">cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="CALORÍAS" sub="historial de objetivos calóricos" />

        {/* Reference card */}
        {editingRefs ? (
          <EditRefsModal refs={refs} onSave={handleSaveRefs} onCancel={() => setEditingRefs(false)} />
        ) : (
          <CalorieRefCard refs={refs} onEdit={() => setEditingRefs(true)} />
        )}

        {/* History */}
        {calories.length === 0 ? (
          <EmptyState message="SIN REGISTROS DE CALORÍAS" icon="◇" />
        ) : (
          <div className="flex flex-col gap-3 stagger">
            {[...calories].reverse().map((c, i) => {
              const phaseTypes = getPhasesInPeriod(phases, c.start_date, c.end_date)
              const isActive = !c.end_date
              const days = daysBetween(c.start_date, c.end_date)
              const delta = getWeightDelta(weights, c.start_date, c.end_date)
              const dColor = deltaColor(delta)

              return (
                <div key={i} className="glass-card rounded-sm relative overflow-hidden">
                  {/* Top accent — active gets green, past gets gray */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      background: isActive
                        ? 'linear-gradient(90deg, #c8f500, transparent)'
                        : 'linear-gradient(90deg, #2a2a2a, transparent)',
                      opacity: isActive ? 0.7 : 0.4,
                    }}
                  />

                  {/* Main content */}
                  <div className="p-4 pb-0">
                    <div className="flex items-start justify-between mb-3">
                      {/* Calories — hero number */}
                      <div>
                        <p className="text-[#c8f500] font-mono text-3xl font-bold leading-none">
                          {c.calories}
                        </p>
                        <p className="text-[#555555] font-sans text-[10px] tracking-[0.15em] mt-1">KCAL / DÍA</p>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-end gap-1.5">
                        {isActive && (
                          <span className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest px-2 py-0.5 rounded-sm text-[#c8f500]"
                            style={{ backgroundColor: 'rgba(200,245,0,0.08)', border: '1px solid rgba(200,245,0,0.15)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f500] animate-pulse" />
                            ACTIVO
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          {phaseTypes.map((pt, j) => (
                            <span key={j} className="font-sans text-[9px] tracking-wider px-1.5 py-0.5 rounded-sm"
                              style={{
                                color: PHASE_COLORS[pt],
                                backgroundColor: `${PHASE_COLORS[pt]}10`,
                                border: `1px solid ${PHASE_COLORS[pt]}18`,
                              }}>
                              {PHASE_LABELS[pt] || pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom stats bar */}
                  <div className="flex border-t border-[#ffffff06]">
                    {/* Dates */}
                    <div className="flex-1 px-4 py-2.5 border-r border-[#ffffff06]">
                      <p className="text-[#333333] font-sans text-[9px] tracking-[0.15em] mb-0.5">PERIODO</p>
                      <p className="text-[#888888] font-sans text-[11px]">
                        {fmt(c.start_date)} → {fmt(c.end_date)}
                      </p>
                    </div>

                    {/* Days */}
                    <div className="px-4 py-2.5 border-r border-[#ffffff06]" style={{ minWidth: '60px' }}>
                      <p className="text-[#333333] font-sans text-[9px] tracking-[0.15em] mb-0.5">DÍAS</p>
                      <p className="text-[#888888] font-mono text-[11px] font-bold">{days}</p>
                    </div>

                    {/* Weight delta */}
                    <div className="px-4 py-2.5" style={{ minWidth: '70px' }}>
                      <p className="text-[#333333] font-sans text-[9px] tracking-[0.15em] mb-0.5">Δ PESO</p>
                      <p className="font-mono text-[11px] font-bold" style={{ color: dColor }}>
                        {delta !== null ? `${delta > 0 ? '+' : ''}${delta} kg` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </div>
  )
}