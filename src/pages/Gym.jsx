import { SkeletonPage } from '../components/Skeleton'
import { useState, useEffect } from 'react'
import { getActiveGymLogs, getGymLogs, getExerciseTypes, getActivePhase, getProfile, getLastWeight, postGymLog, patchGymLog, deleteGymLog, postExerciseType } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Input from '../components/Input'
import StrengthTriangle from '../components/StrengthTriangle'
import { haptic } from '../utils/haptic'
import Toast from '../components/Toast'

const CATEGORY_LABELS = {
  push: 'EMPUJE',
  pull: 'TIRÓN',
  legs: 'PIERNAS',
  custom: 'CUSTOM',
}

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function progressColor(pct) {
  if (pct > 2) return '#3a9d4e'
  if (pct < -2) return '#d92020'
  return '#b87400'
}

function progressLabel(pct) {
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function calcProgress(allLogs, exerciseTypeId, phaseStartDate) {
  const history = allLogs
    .filter(l => l.exercise_type_id === exerciseTypeId && l.weight)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
  if (history.length < 2) return { phase: null, total: null, noData: true }
  const current = history[history.length - 1]
  const first = history[0]
  const totalPct = ((oneRM(current) - oneRM(first)) / oneRM(first)) * 100
  let phasePct = null
  if (phaseStartDate) {
    const phaseStart = parseDate(phaseStartDate)
    const phaseHistory = history.filter(l => parseDate(l.start_date) >= phaseStart)
    if (phaseHistory.length >= 2) {
      phasePct = ((oneRM(current) - oneRM(phaseHistory[0])) / oneRM(phaseHistory[0])) * 100
    } else if (phaseHistory.length === 1) {
      const beforePhase = history.filter(l => parseDate(l.start_date) < phaseStart)
      if (beforePhase.length > 0) {
        const lastBefore = beforePhase[beforePhase.length - 1]
        phasePct = ((oneRM(current) - oneRM(lastBefore)) / oneRM(lastBefore)) * 100
      }
    }
  }
  return { phase: phasePct, total: totalPct, noData: false }
}

function ProgressPill({ label, value, noData }) {
  const displayValue = noData ? 0 : value
  const color = progressColor(displayValue)
  return (
    <div className="flex-1 rounded-sm px-2.5 py-1.5 relative overflow-hidden" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
      <p className="text-[#444444] font-sans text-[9px] tracking-[0.15em] mb-0.5">{label}</p>
      <p className="font-sans text-xs font-bold" style={{ color }}>
        {noData ? '0.0%' : progressLabel(value)}
      </p>
    </div>
  )
}

export default function Gym({ onNavigate }) {
  const [logs, setLogs] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [exerciseTypes, setExerciseTypes] = useState([])
  const [activePhase, setActivePhase] = useState(null)
  const [profile, setProfile] = useState(null)
  const [lastWeight, setLastWeight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')
  const [editingLog, setEditingLog] = useState(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [logsData, allLogsData, typesData, phaseData, profileData, weightData] = await Promise.all([
        getActiveGymLogs(), getGymLogs(), getExerciseTypes(), getActivePhase(),
        getProfile().catch(() => null), getLastWeight().catch(() => null)
      ])
      setLogs(logsData)
      setAllLogs(allLogsData)
      setExerciseTypes(typesData)
      setActivePhase(phaseData)
      setProfile(profileData)
      setLastWeight(weightData)
    } catch {}
    finally { setLoading(false) }
  }

  function handleDrop(fromIdx, toIdx) {
    if (fromIdx === toIdx) return
    const items = [...logs]
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    setLogs(items)
    setDragIdx(null)
    setDragOverIdx(null)
    // Save order to localStorage
    try {
      const order = items.map(l => l.exercise_type_id)
      localStorage.setItem('gym_exercise_order', JSON.stringify(order))
    } catch {}
  }

  // Apply saved order on load
  useEffect(() => {
    if (logs.length === 0) return
    try {
      const saved = JSON.parse(localStorage.getItem('gym_exercise_order') || '[]')
      if (saved.length === 0) return
      const ordered = []
      saved.forEach(id => {
        const found = logs.find(l => l.exercise_type_id === id)
        if (found) ordered.push(found)
      })
      // Add any logs not in saved order
      logs.forEach(l => { if (!ordered.find(o => o.id === l.id)) ordered.push(l) })
      if (ordered.length === logs.length) setLogs(ordered)
    } catch {}
  }, [logs.length])

  const usedIds = new Set(logs.map(l => l.exercise_type_id))
  const availableTypes = exerciseTypes.filter(t => !usedIds.has(t.id))
  const grouped = logs.reduce((acc, log) => {
    const cat = log.category || 'custom'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(log)
    return acc
  }, {})

  async function handleAdd(e) {
    e.preventDefault()
    if (!selectedExerciseId) return
    setSubmitting(true)
    setMsg('')
    try {
      await postGymLog(parseInt(selectedExerciseId), weight ? parseFloat(weight.replace(',', '.')) : null, reps ? parseInt(reps) : null)
      haptic('success')
      setMsg('✓  ejercicio añadido')
      setSelectedExerciseId(''); setWeight(''); setReps('')
      await fetchData()
      setTimeout(() => { setMode('list'); setMsg('') }, 1000)
    } catch { setMsg('✗  error al añadir') }
    finally { setSubmitting(false) }
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    try {
      await patchGymLog(editingLog.id, editingLog.exercise_type_id, weight ? parseFloat(weight.replace(',', '.')) : null, reps ? parseInt(reps) : null)
      haptic('success')
      setMsg('✓  actualizado')
      await fetchData()
      setTimeout(() => { setMode('list'); setMsg('') }, 1000)
    } catch { setMsg('✗  error al actualizar') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(log) {
    try { await deleteGymLog(log.id); await fetchData() } catch {}
  }

  async function handleNewExercise(e) {
    e.preventDefault()
    if (!newExerciseName.trim()) return
    setSubmitting(true)
    try {
      await postExerciseType(newExerciseName.trim())
      setNewExerciseName(''); await fetchData(); setMode('add')
    } catch { setMsg('✗  error al crear ejercicio') }
    finally { setSubmitting(false) }
  }

  function startEdit(log) {
    setEditingLog(log)
    setWeight(log.weight ? String(log.weight) : '')
    setReps(log.reps ? String(log.reps) : '')
    setMode('edit')
  }

  if (loading) return (
    <SkeletonPage />
  )

  if (mode === 'list') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton />
        <PageHeader title="GYM" sub="progreso en 1RM estimado (Epley)" />

        {/* Triángulo de fuerza */}
        <StrengthTriangle
          logs={allLogs}
          bodyWeight={lastWeight?.weight}
          sex={profile?.sex === 'female' ? 'female' : 'male'}
        />

        {logs.length === 0 ? (
          <p className="text-[#555555] font-sans text-sm mb-6">no hay ejercicios añadidos</p>
        ) : (
          Object.entries(grouped).map(([cat, catLogs]) => (
            <div key={cat} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px flex-1 bg-[#1a1a1a]" />
                <span className="text-[#333333] font-sans text-[10px] tracking-[0.2em]">{CATEGORY_LABELS[cat] || cat.toUpperCase()}</span>
                <span className="h-px flex-1 bg-[#1a1a1a]" />
              </div>
              <div className="flex flex-col gap-2">
                {catLogs.map((log, logIdx) => {
                  const progress = calcProgress(allLogs, log.exercise_type_id, activePhase?.start_date)
                  const rm = oneRM(log)
                  return (
                    <div key={log.id}
                      draggable
                      onDragStart={() => setDragIdx(logs.indexOf(log))}
                      onDragOver={e => { e.preventDefault(); setDragOverIdx(logs.indexOf(log)) }}
                      onDragEnd={() => { if (dragIdx !== null && dragOverIdx !== null) handleDrop(dragIdx, dragOverIdx); setDragIdx(null); setDragOverIdx(null) }}
                      onTouchStart={e => setDragIdx(logs.indexOf(log))}
                      className={`glass-card rounded-sm p-3 group hover:border-[#333333] transition-all duration-200 cursor-grab active:cursor-grabbing ${dragOverIdx === logs.indexOf(log) ? 'border-[#c8f500]/30 bg-[#c8f500]/3' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <p className="text-[#41434a] font-sans text-sm font-bold tracking-wide truncate uppercase">{log.name}</p>
                          <p className="text-[#c8f500] font-sans text-xs mt-0.5">
                            {log.weight ? `${log.weight} kg` : '—'}
                            {log.weight && log.reps ? ` × ${log.reps} reps` : ''}
                            {rm && log.reps ? <span className="text-[#444444]"> · 1RM ~{rm.toFixed(1)}</span> : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                          <button onClick={() => startEdit(log)}
                            className="px-2 h-6 rounded-sm border border-[#222222] text-[#555555] font-sans text-[10px] hover:border-[#c8f500] hover:text-[#c8f500] transition-colors">
                            EDIT
                          </button>
                          <button onClick={() => handleDelete(log)}
                            className="w-6 h-6 rounded-sm border border-[#222222] text-[#444444] font-sans text-xs hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-colors flex items-center justify-center">
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <ProgressPill label="FASE" value={progress.phase} noData={progress.noData || progress.phase === null} />
                        <ProgressPill label="TOTAL" value={progress.total} noData={progress.noData} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <button onClick={() => setMode('add')}
          className="w-full h-11 glass-card glass-sheen card-hover click-press rounded-sm text-[#6c6e76] font-sans text-xs transition-all duration-200 mt-4 mb-4">
          + AÑADIR EJERCICIO
        </button>
        <Separator className="mt-2 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )

  if (mode === 'add') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('list')} />
        <PageHeader title="AÑADIR EJERCICIO" />
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
              EJERCICIO
            </label>
            <select value={selectedExerciseId} onChange={e => setSelectedExerciseId(e.target.value)}
              className="input-frosted text-[#41434a] font-sans text-sm px-4 h-12 outline-none transition-all duration-300 rounded-sm" required>
              <option value="">— selecciona —</option>
              {['push', 'pull', 'legs', 'custom'].map(cat => {
                const opts = availableTypes.filter(t => t.category === cat)
                if (!opts.length) return null
                return (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat.toUpperCase()}>
                    {opts.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                )
              })}
            </select>
          </div>
          <Input label="PESO (kg) — opcional" type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} placeholder="100" />
          <Input label="REPETICIONES — opcional" type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="5" />
          {msg && <Toast message={msg} type={msg.startsWith('✓') ? 'success' : 'error'} onDone={() => setMsg('')} />}
          <Button type="submit" disabled={submitting}>{submitting ? '...' : 'AÑADIR'}</Button>
        </form>
        <button onClick={() => setMode('new-exercise')}
          className="w-full h-10 mt-4 glass-card glass-sheen card-hover click-press rounded-sm text-[#6c6e76] font-sans text-xs transition-all duration-200">
          + CREAR EJERCICIO PERSONALIZADO
        </button>
        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )

  if (mode === 'edit') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('list')} />
        <PageHeader title="ACTUALIZAR" />
        <div className="glass-card rounded-sm p-4 mb-6" style={{ borderLeft: '3px solid #c8f500' }}>
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] mb-1">EJERCICIO</p>
          <p className="text-[#41434a] font-mono text-xl font-bold uppercase">{editingLog?.name}</p>
          <p className="text-[#555555] font-sans text-xs mt-1.5">
            actual: <span className="text-[#c8f500]">
              {editingLog?.weight ? `${editingLog.weight} kg` : '—'}
              {editingLog?.weight && editingLog?.reps ? ` × ${editingLog.reps} reps` : ''}
            </span>
            {editingLog && oneRM(editingLog) && editingLog.reps &&
              <span className="text-[#444444]"> · 1RM ~{oneRM(editingLog).toFixed(1)} kg</span>}
          </p>
        </div>
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <Input label="NUEVO PESO (kg)" type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} placeholder="100" />
          <Input label="NUEVAS REPETICIONES" type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="5" />
          {msg && <Toast message={msg} type={msg.startsWith('✓') ? 'success' : 'error'} onDone={() => setMsg('')} />}
          <Button type="submit" disabled={submitting}>{submitting ? '...' : 'GUARDAR'}</Button>
        </form>
        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )

  if (mode === 'new-exercise') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('add')} />
        <PageHeader title="NUEVO EJERCICIO" />
        <form onSubmit={handleNewExercise} className="flex flex-col gap-4">
          <Input label="NOMBRE DEL EJERCICIO" type="text" value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)} placeholder="Mi ejercicio" required />
          {msg && <Toast message={msg} type={msg.startsWith('✓') ? 'success' : 'error'} onDone={() => setMsg('')} />}
          <Button type="submit" disabled={submitting}>{submitting ? '...' : 'CREAR EJERCICIO'}</Button>
        </form>
        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}