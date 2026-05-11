import { useState, useEffect } from 'react'
import { getActiveGymLogs, getExerciseTypes, postGymLog, patchGymLog, deleteGymLog, postExerciseType } from '../api/client'
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

export default function Gym({ onNavigate }) {
  const [logs, setLogs] = useState([])
  const [exerciseTypes, setExerciseTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit' | 'new-exercise'
  const [editingLog, setEditingLog] = useState(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [logsData, typesData] = await Promise.all([getActiveGymLogs(), getExerciseTypes()])
      setLogs(logsData)
      setExerciseTypes(typesData)
    } catch {}
    finally { setLoading(false) }
  }

  // Ejercicios que el usuario aún no ha añadido
  const usedIds = new Set(logs.map(l => l.exercise_type_id))
  const availableTypes = exerciseTypes.filter(t => !usedIds.has(t.id))

  // Agrupar logs por categoría
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
    } finally {
      setSubmitting(false) }
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
    } finally {
      setSubmitting(false) }
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
    } finally {
      setSubmitting(false) }
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

  // ── Vista: lista ──────────────────────────────────────────────────────────
  if (mode === 'list') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="// GYM" />

        {logs.length === 0 ? (
          <p className="text-[#888888] font-mono text-sm mb-6">no hay ejercicios añadidos</p>
        ) : (
          Object.entries(grouped).map(([cat, catLogs]) => (
            <div key={cat} className="mb-4">
              <p className="text-[#888888] font-mono text-xs mb-2">{CATEGORY_LABELS[cat] || cat.toUpperCase()}</p>
              <div className="flex flex-col gap-px">
                {catLogs.map(log => (
                  <div key={log.id} className="flex items-center bg-[#141414] border border-[#333333] px-4 h-14 hover:border-[#c8f500] transition-colors">
                    <div className="flex-1">
                      <p className="text-[#e8e8e8] font-mono text-sm">{log.name}</p>
                      <p className="text-[#888888] font-mono text-xs">
                        {log.weight ? `${log.weight} kg` : '—'}
                        {log.weight && log.reps ? '  ×  ' : ''}
                        {log.reps ? `${log.reps} reps` : ''}
                        {!log.weight && !log.reps ? 'sin datos' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(log)}
                      className="text-[#888888] font-mono text-xs hover:text-[#c8f500] transition-colors px-2"
                    >
                      EDITAR
                    </button>
                    <button
                      onClick={() => handleDelete(log)}
                      className="text-[#888888] font-mono text-xs hover:text-[#ff2d2d] transition-colors px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => setMode('add')}
          className="w-full h-12 bg-transparent border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-colors mb-4"
        >
          + AÑADIR EJERCICIO
        </button>

        <Separator className="mt-4 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )

  // ── Vista: añadir ejercicio ───────────────────────────────────────────────
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

          <Input
            label="PESO (kg) — opcional"
            type="number"
            step="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="100"
          />
          <Input
            label="REPETICIONES — opcional"
            type="number"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="5"
          />

          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : 'AÑADIR'}
          </Button>
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

  // ── Vista: editar ejercicio ───────────────────────────────────────────────
  if (mode === 'edit') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('list')} />
        <PageHeader title="// EDITAR" />

        <div className="bg-[#141414] border border-[#333333] p-4 mb-6">
          <p className="text-[#888888] font-mono text-xs mb-1">EJERCICIO</p>
          <p className="text-[#c8f500] font-mono text-xl font-bold">{editingLog?.name}</p>
        </div>

        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <Input
            label="PESO (kg)"
            type="number"
            step="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="100"
          />
          <Input
            label="REPETICIONES"
            type="number"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="5"
          />

          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : 'GUARDAR'}
          </Button>
        </form>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )

  // ── Vista: nuevo ejercicio personalizado ──────────────────────────────────
  if (mode === 'new-exercise') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => setMode('add')} />
        <PageHeader title="// NUEVO EJERCICIO" />

        <form onSubmit={handleNewExercise} className="flex flex-col gap-4">
          <Input
            label="NOMBRE DEL EJERCICIO"
            type="text"
            value={newExerciseName}
            onChange={e => setNewExerciseName(e.target.value)}
            placeholder="Mi ejercicio"
            required
          />

          {msg && <p className={`font-mono text-sm ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>{msg}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : 'CREAR EJERCICIO'}
          </Button>
        </form>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}