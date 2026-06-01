import { useState, useRef, useEffect } from 'react'
import { uploadPhoto, getPhases } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'
import { readableOnLight } from '../utils/color'

const TYPES = [
  { key: 'front', label: 'FRENTE' },
  { key: 'side',  label: 'PERFIL' },
  { key: 'back',  label: 'ESPALDA' },
]

const PHASE_COLORS = { bulk: '#a4c400', cut: '#e23535', maintenance: '#e88c00' }
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTENIMIENTO' }
const PHASE_OPTS = ['bulk', 'cut', 'maintenance']

function parseDate(d) { return new Date(d + 'T00:00:00') }
function phaseOnDate(phases, dateStr) {
  const d = parseDate(dateStr)
  for (const p of phases) {
    const s = parseDate(p.start_date)
    const e = p.end_date ? parseDate(p.end_date) : new Date(8640000000000000)
    if (d >= s && d <= e) return p.phase_type
  }
  return null
}

export default function PhotoUpload({ onNavigate }) {
  const [photos, setPhotos] = useState({ front: null, side: null, back: null })
  const [uploadDate, setUploadDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [phases, setPhases] = useState([])
  const [phaseType, setPhaseType] = useState(null)
  const [phaseTouched, setPhaseTouched] = useState(false)
  const fileRefs = { front: useRef(null), side: useRef(null), back: useRef(null) }

  useEffect(() => {
    getPhases().then(p => setPhases(p || [])).catch(() => {})
  }, [])

  // Sugerir automáticamente la fase activa en la fecha elegida (si el usuario
  // no ha tocado el selector manualmente).
  useEffect(() => {
    if (phaseTouched) return
    const d = uploadDate || new Date().toISOString().split('T')[0]
    setPhaseType(phaseOnDate(phases, d))
  }, [uploadDate, phases, phaseTouched])

  function handleFileSelect(type, e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setToast({ msg: '✗  máximo 5MB', type: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhotos(prev => ({ ...prev, [type]: reader.result }))
    reader.readAsDataURL(file)
  }

  function removePhoto(type) {
    setPhotos(prev => ({ ...prev, [type]: null }))
    if (fileRefs[type].current) fileRefs[type].current.value = ''
  }

  const hasAnyPhoto = Object.values(photos).some(p => p !== null)
  const photoCount = Object.values(photos).filter(p => p !== null).length

  async function handleUpload() {
    if (!hasAnyPhoto) return
    setUploading(true)
    setToast(null)
    const date = uploadDate || new Date().toISOString().split('T')[0]
    let success = 0
    let errors = 0

    for (const type of TYPES.map(t => t.key)) {
      if (!photos[type]) continue
      try {
        const base64 = photos[type].split(',')[1]
        await uploadPhoto(date, type, base64, phaseType)
        success++
      } catch {
        errors++
      }
    }

    if (errors === 0) {
      setToast({ msg: `✓  ${success} foto${success > 1 ? 's' : ''} guardada${success > 1 ? 's' : ''}`, type: 'success' })
      setPhotos({ front: null, side: null, back: null })
      TYPES.forEach(t => { if (fileRefs[t.key].current) fileRefs[t.key].current.value = '' })
    } else {
      setToast({ msg: `✗  ${errors} error${errors > 1 ? 'es' : ''}, ${success} guardada${success > 1 ? 's' : ''}`, type: 'error' })
    }
    setUploading(false)
  }

  return (
    <PageWrapper>
      <BackButton />
      <PageHeader title="NUEVA FOTO" sub="añade fotos de progreso" />

      {/* Date */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
          FECHA
        </label>
        <input
          type="date"
          value={uploadDate}
          onChange={e => setUploadDate(e.target.value)}
          className="input-frosted text-[#1d1d1f] font-sans text-sm px-4 h-12 outline-none transition-all duration-300 rounded-sm"
        />
        <p className="text-[#333333] font-sans text-[10px]">vacío = hoy</p>
      </div>

      {/* Fase asociada */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: phaseType ? PHASE_COLORS[phaseType] : '#a4c400' }} />
          FASE ASOCIADA
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PHASE_OPTS.map(t => {
            const c = PHASE_COLORS[t]
            const ink = readableOnLight(c)
            const sel = phaseType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setPhaseTouched(true); setPhaseType(sel ? null : t) }}
                className="relative glass-card card-hover click-press rounded-sm py-2.5 px-2 flex flex-col items-center gap-1 overflow-hidden"
                style={sel ? { borderColor: `${c}88`, background: `${c}1a`, boxShadow: `0 8px 22px -8px ${c}66, inset 0 1px 1px rgba(255,255,255,0.7)` } : undefined}
              >
                <span className="absolute top-0 left-0 right-0 h-[2px] transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${c}, transparent)`, opacity: sel ? 1 : 0.25 }} />
                <span className="font-sans text-[9px] font-bold tracking-wider" style={{ color: sel ? ink : '#71727a' }}>{PHASE_LABELS[t]}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[#333333] font-sans text-[10px]">
          {phaseType ? 'toca de nuevo para quitar' : 'opcional · se sugiere según la fecha'}
        </p>
      </div>

      {/* 3 photo slots */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {TYPES.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <p className="text-[#444444] font-sans text-[9px] tracking-[0.15em] text-center">{label}</p>

            <input
              ref={fileRefs[key]}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.jpg,.jpeg,.png,.heic,.heif,.webp"
              onChange={e => handleFileSelect(key, e)}
              className="hidden"
            />

            {photos[key] ? (
              <div className="relative rounded-sm overflow-hidden border border-[#222222] aspect-[3/4]">
                <img src={photos[key]} alt={label} className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(key)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-sm bg-[#0a0a0a]/80 border border-[#333333] text-[#888888] text-xs flex items-center justify-center hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-colors">
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => fileRefs[key].current?.click()}
                className="rounded-sm border border-dashed border-[#2a2a2a] aspect-[3/4] flex flex-col items-center justify-center gap-1 hover:border-[#c8f500] transition-colors group">
                <span className="text-[#2a2a2a] text-xl group-hover:text-[#555555] transition-colors">+</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Upload button */}
      <button onClick={handleUpload} disabled={!hasAnyPhoto || uploading}
        className="w-full h-14 btn-liquid click-press text-[#2a3a00] font-sans font-bold tracking-widest rounded-sm disabled:opacity-40 flex items-center justify-center mb-4">
        {uploading ? '...' : `GUARDAR ${photoCount} FOTO${photoCount !== 1 ? 'S' : ''}`}
      </button>

      <button onClick={() => onNavigate('photos')}
        className="w-full h-10 glass-card glass-sheen card-hover click-press rounded-sm text-[#6c6e76] font-sans text-xs transition-all duration-200">
        VER GALERÍA DE FOTOS
      </button>

      <Separator className="mt-8 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </PageWrapper>
  )
}