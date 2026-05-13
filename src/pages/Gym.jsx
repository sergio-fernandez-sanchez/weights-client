import { useState, useEffect } from 'react'
import { getActiveGymLogs, getGymLogs, getExerciseTypes, getActivePhase, postGymLog, patchGymLog, deleteGymLog, postExerciseType } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Input from '../components/Input'

const CATEGORY_LABELS = {
  push: 'EMPUJE',
  pull: 'TIRÓN',
  legs: 'PIERNAS',
  custom: 'CUSTOM',
}

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

function progressColor(pct) {
  if (pct > 2) return '#4caf50'
  if (pct < -2) return '#ff2d2d'
  return '#ff9f00'
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
  const totalPct = ((current.weight - first.weight) / first.weight) * 100

  let phasePct = null
  if (phaseStartDate) {
    const phaseStart = parseDate(phaseStartDate)
    const phaseHistory = history.filter(l => parseDate(l.start_date) >= phaseStart)
    if (phaseHistory.length >= 2) {
      phasePct = ((current.weight - phaseHistory[0].weight) / phaseHistory[0].weight) * 100
    } else if (phaseHistory.length === 1) {
      const beforePhase = history.filter(l => parseDate(l.start_date) < phaseStart)
      if (beforePhase.length > 0) {
        const lastBefore = beforePhase[beforePhase.length - 1]
        phasePct = ((current.weight - lastBefore.weight) / lastBefore.weight) * 100
      }
    }
  }

  return { phase: phasePct, total: totalPct, noData: false }
}

function ProgressCard({ label, value, noData }) {
  const displayValue = noData ? 0 : value
  return (
    <div className="flex-1 bg-[#0a0a0a] border border-[#1e1e1e] px-3 py-2 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ backgroundColor: progressColor(displayValue) }}
      />
      <p className="text-[#3a3a3a] font-mono text-xs tracking-widest mb-1">{label}</p>
      <p className="font-mono text-base font-bold" style={{ color: progressColor(displayValue) }}>
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
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')
  const [editingLog, setEditingLog] = useState(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [logsData, allLogsData, typesData, phaseData] = await Promise.all([
        getActiveGymLogs(), getGymLogs(), getExerciseTypes(), getActivePhase()
      ])
      setLogs(logsData)
      setAllLogs(allLogsData)
      setExerciseTypes(typesData)
      setActivePhase(phaseData)
    } catch {}
    finally { setLoading(false) }
  }

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
      await postGymLog(
        parseInt(selectedExerciseId),
        weight ? parseFloat(weight.replace(',', '.')) : null,
        reps ? parseInt(reps) : null
      )
      setMsg('✓  ejercicio añadido')
      setSelectedExerciseId('')
      setWeight('')
      setReps('')
      await fetchData()
      setTimeout(() => { setMode('list'); setMsg('') }, 1000)
    } catch {
      setMsg('✗  error al añadir')
    } finally { setSubmitting(false) }
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    try {
      await patchGymLog(
        editingLog.id,
        editingLog.exercise_type_id,
        weight ? parseFloat(weight.replace(',', '.')) : null,
        reps ? parseInt(reps) : null
      )
      setMsg('✓  actualizado')
      await fetchData()
      setTimeout(() => { setMode('list'); setMsg('') }, 1000)
    } catch {
      setMsg('✗  error al actualizar')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(log) {
    try {
      await deleteGymLog(log.id)
      await fetchData()
    } catch {}
  }

  async function handleNewExercise(e) {
    e.preventDefault()
    if (!newExerciseName.trim()) return
    setSubmitting(true)
    try {
      await postExerciseType(newExerciseName.trim())
      setNewExerciseName('')
      await fetchData()
      setMode('add')
    } catch {
      setMsg('✗  error al crear ejercicio')
    } finally { setSubmitting(false) }
  }

  function startEdit(log) {
    setEditingLog(log)
    setWeight(log.weight ? String(log.weight) : '')
    setReps(log.reps ? String(log.reps) : '')
    setMode('edit')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#888888] font-mono text-sm">cargando...</p>
    </div>
  )

  if (mode === 'list') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="// GYM" />

        {logs.length === 0 ? (
          <p className="text-[#888888] font-mono text-sm mb-6">no hay ejercicios añadidos</p>
        ) : (
          Object.entries(grouped).map(([cat, catLogs]) => (
            <div key={cat} className="mb-5">
              <p className="text-[#333333] font-mono text-xs mb-2 tracking-widest">
                ── {CATEGORY_LABELS[cat] || cat.toUpperCase()}
              </p>
              <div className="flex flex-col gap-px">
                {catLogs.map(log => {
                  const progress = calcProgress(allLogs, log.exercise_type_id, activePhase?.start_date)
                  return (
                    <div key={log.id} className="flex items-stretch bg-[#141414] border-b border-[#1a1a1a] hover:bg-[#181818] transition-colors group">
                      <div className="w-0.5 flex-shrink-0 bg-[#c8f500] opacity-30 group-hover:opacity-80 transition-opacity" />
                      <div className="flex-1 px-4 py-3 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-[#e8e8e8] font-mono text-sm font-bold tracking-wide truncate uppercase">
                              {log.name}
                            </p>
                            <p className="text-[#c8f500] font-mono text-xs mt-0.5">
                              {log.weight ? `${log.weight} kg` : '—'}
                              {log.weight && log.reps ? ` × ${log.reps} reps` : ''}
                              {log.reps && !log.weight ? `${log.reps} reps` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                            <button
                              onClick={() => startEdit(log)}
                              className="px-2 h-6 border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDelete(log)}
                              className="w-6 h-6 border border-[#333333] text-[#444444] font-mono text-xs hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-colors flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <ProgressCard
                            label="FASE"
                            value={progress.phase}
                            noData={progress.noData || progress.phase === null}
                          />
                          <ProgressCard
                            label="TOTAL"
                            value={progress.total}
                            noData={progress.noData}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => setMode('add')}
          className="w-full h-11 bg-transparent border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors mt-4 mb-4"
        >
          + AÑADIR EJERCICIO
        </button>

        <Separator className="mt-2 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )

  if (mode === 'add') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('list')} />
        <PageHeader title="// AÑADIR EJERCICIO" />
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[#888888] font-mono text-sm">EJERCICIO</label>
            <select
              value={selectedExerciseId}
              onChange={e => setSelectedExerciseId(e.target.value)}
              className="bg-[#141414] border border-[#333333] text-[#e8e8e8] font-mono text-sm px-4 h-12 outline-none focus:border-[#c8f500] transition-colors"
              required
            >
              <option value="">— selecciona —</option>
              {['push', 'pull', 'legs', 'custom'].map(cat => {
                const opts = availableTypes.filter(t => t.category === cat)
                if (!opts.length) return null
                return (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat.toUpperCase()}>
                    {opts.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>
          <Input label="PESO (kg) — opcional" type="number" step="0.5"
            value={weight} onChange={e => setWeight(e.target.value)} placeholder="100" />
          <Input label="REPETICIONES — opcional" type="number"
            value={reps} onChange={e => setReps(e.target.value)} placeholder="5" />
          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? '...' : 'AÑADIR'}</Button>
        </form>
        <button
          onClick={() => setMode('new-exercise')}
          className="w-full h-10 mt-4 bg-transparent border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors"
        >
          + CREAR EJERCICIO PERSONALIZADO
        </button>
        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )

  if (mode === 'edit') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('list')} />
        <PageHeader title="// ACTUALIZAR" />
        <div className="border-l-2 border-[#c8f500] pl-4 mb-6">
          <p className="text-[#888888] font-mono text-xs mb-1">EJERCICIO</p>
          <p className="text-[#e8e8e8] font-mono text-xl font-bold uppercase">{editingLog?.name}</p>
          <p className="text-[#888888] font-mono text-xs mt-1">
            actual: <span className="text-[#c8f500]">
              {editingLog?.weight ? `${editingLog.weight} kg` : '—'}
              {editingLog?.weight && editingLog?.reps ? ` × ${editingLog.reps} reps` : ''}
            </span>
          </p>
        </div>
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <Input label="NUEVO PESO (kg)" type="number" step="0.5"
            value={weight} onChange={e => setWeight(e.target.value)} placeholder="100" />
          <Input label="NUEVAS REPETICIONES" type="number"
            value={reps} onChange={e => setReps(e.target.value)} placeholder="5" />
          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? '...' : 'GUARDAR'}</Button>
        </form>
        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )

  if (mode === 'new-exercise') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('add')} />
        <PageHeader title="// NUEVO EJERCICIO" />
        <form onSubmit={handleNewExercise} className="flex flex-col gap-4">
          <Input label="NOMBRE DEL EJERCICIO" type="text"
            value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)}
            placeholder="Mi ejercicio" required />
          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? '...' : 'CREAR EJERCICIO'}</Button>
        </form>
        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}