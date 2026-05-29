import { useState, useRef } from 'react'
import { uploadPhoto } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'

const TYPE_LABELS = { front: 'FRENTE', side: 'PERFIL', back: 'ESPALDA' }

export default function PhotoUpload({ onNavigate }) {
  const [uploadType, setUploadType] = useState('front')
  const [uploadDate, setUploadDate] = useState('')
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setToast({ msg: '✗  máximo 5MB', type: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!preview) return
    setUploading(true)
    setToast(null)
    try {
      const base64 = preview.split(',')[1]
      const date = uploadDate || new Date().toISOString().split('T')[0]
      await uploadPhoto(date, uploadType, base64)
      setToast({ msg: '✓  foto guardada', type: 'success' })
      setPreview(null)
      // Reset for next photo
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      setToast({ msg: '✗  error al subir', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="NUEVA FOTO" sub="añade una foto de progreso" />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
            TIPO
          </label>
          <Tabs options={[['FRENTE', 'front'], ['PERFIL', 'side'], ['ESPALDA', 'back']]} value={uploadType} onChange={setUploadType} />
        </div>

        <div className="flex flex-col gap-1.5">
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

        {/* File input */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {preview ? (
          <div className="relative rounded-sm overflow-hidden border border-[#222222]">
            <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: '340px' }} />
            <div className="absolute top-2 left-2 px-2 py-1 rounded-sm bg-[#0a0a0a]/80 border border-[#333333]">
              <span className="text-[#c8f500] font-sans text-[10px] font-bold tracking-wider">{TYPE_LABELS[uploadType]}</span>
            </div>
            <button onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
              className="absolute top-2 right-2 w-8 h-8 rounded-sm bg-[#0a0a0a]/80 border border-[#333333] text-[#888888] flex items-center justify-center hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-colors">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full h-36 glass-card rounded-sm border-dashed border-[#333333] flex flex-col items-center justify-center gap-2 hover:border-[#c8f500] transition-colors group">
            <span className="text-[#333333] text-3xl group-hover:text-[#555555] transition-colors">+</span>
            <span className="text-[#444444] font-sans text-xs group-hover:text-[#888888] transition-colors">Seleccionar foto de la galería</span>
          </button>
        )}

        <button onClick={handleUpload} disabled={!preview || uploading}
          className="w-full h-14 bg-[#c8f500] text-[#0a0a0a] font-sans font-bold tracking-widest rounded-sm disabled:opacity-40 transition-colors hover:bg-[#deff33] flex items-center justify-center">
          {uploading ? '...' : 'GUARDAR FOTO'}
        </button>

        <button onClick={() => onNavigate('photos')}
          className="w-full h-10 glass-card rounded-sm text-[#555555] font-sans text-xs hover:border-[#c8f500] hover:text-[#c8f500] transition-all duration-200">
          VER GALERÍA DE FOTOS
        </button>
      </div>

      <Separator className="mt-8 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </PageWrapper>
  )
}