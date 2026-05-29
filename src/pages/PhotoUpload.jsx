import { useState, useRef } from 'react'
import { uploadPhoto } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'

const TYPES = [
  { key: 'front', label: 'FRENTE' },
  { key: 'side',  label: 'PERFIL' },
  { key: 'back',  label: 'ESPALDA' },
]

export default function PhotoUpload({ onNavigate }) {
  const [photos, setPhotos] = useState({ front: null, side: null, back: null })
  const [uploadDate, setUploadDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRefs = { front: useRef(null), side: useRef(null), back: useRef(null) }

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
        await uploadPhoto(date, type, base64)
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
      <BackButton onClick={() => onNavigate('home')} />
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
          className="bg-[#111111] border border-[#222222] text-[#e8e8e8] font-sans text-sm px-4 h-12 outline-none focus:border-[#c8f500] focus:shadow-[0_0_20px_rgba(200,245,0,0.12)] transition-all duration-300 rounded-sm"
        />
        <p className="text-[#333333] font-sans text-[10px]">vacío = hoy</p>
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
        className="w-full h-14 bg-[#c8f500] text-[#0a0a0a] font-sans font-bold tracking-widest rounded-sm disabled:opacity-40 transition-colors hover:bg-[#deff33] flex items-center justify-center mb-4">
        {uploading ? '...' : `GUARDAR ${photoCount} FOTO${photoCount !== 1 ? 'S' : ''}`}
      </button>

      <button onClick={() => onNavigate('photos')}
        className="w-full h-10 glass-card rounded-sm text-[#555555] font-sans text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-all duration-200">
        VER GALERÍA DE FOTOS
      </button>

      <Separator className="mt-8 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </PageWrapper>
  )
}