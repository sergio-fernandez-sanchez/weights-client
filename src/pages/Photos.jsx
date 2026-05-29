import { useState, useEffect, useRef } from 'react'
import { getPhotoDates, getPhotosByDate, uploadPhoto, deletePhoto, getWeights, getBodyMeasurements } from '../api/client'
import { SkeletonPage } from '../components/Skeleton'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'
import EmptyState from '../components/EmptyState'

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

const TYPE_LABELS = { front: 'FRENTE', side: 'PERFIL', back: 'ESPALDA' }
const TYPE_ORDER = ['front', 'side', 'back']

function getWeightOnDate(weights, dateStr) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const exact = sorted.find(w => w.date === dateStr)
  if (exact) return parseFloat(exact.weight)
  const before = sorted.filter(w => w.date < dateStr)
  return before.length > 0 ? parseFloat(before[before.length - 1].weight) : null
}

function getMeasurementsOnDate(measurements, dateStr) {
  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date))
  const exact = sorted.find(m => m.date === dateStr)
  if (exact) return exact
  const before = sorted.filter(m => m.date < dateStr)
  return before.length > 0 ? before[before.length - 1] : null
}

const MEASUREMENT_LABELS = {
  neck_cm: 'Cuello', shoulders_cm: 'Hombros', chest_cm: 'Pecho',
  bicep_cm: 'Bícep', waist_cm: 'Cintura', hip_cm: 'Cadera', thigh_cm: 'Muslo',
}

export default function Photos({ onNavigate }) {
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [photos, setPhotos] = useState([])
  const [weights, setWeights] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [mode, setMode] = useState('view') // 'view' | 'upload'
  const [uploadType, setUploadType] = useState('front')
  const [uploadDate, setUploadDate] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [datesData, wData, mData] = await Promise.all([
        getPhotoDates(), getWeights(), getBodyMeasurements().catch(() => [])
      ])
      setDates(datesData || [])
      setWeights(wData || [])
      setMeasurements(mData || [])
      if (datesData?.length > 0 && !selectedDate) {
        setSelectedDate(datesData[0].date)
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!selectedDate) return
    async function loadPhotos() {
      try {
        const data = await getPhotosByDate(selectedDate)
        setPhotos(data || [])
      } catch { setPhotos([]) }
    }
    loadPhotos()
  }, [selectedDate])

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
      setMode('view')
      await fetchAll()
      setSelectedDate(date)
    } catch {
      setToast({ msg: '✗  error al subir', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoId) {
    try {
      await deletePhoto(photoId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      setToast({ msg: '✓  foto eliminada', type: 'success' })
      fetchAll()
    } catch {
      setToast({ msg: '✗  error al eliminar', type: 'error' })
    }
  }

  if (loading) return <SkeletonPage />

  const dateWeight = selectedDate ? getWeightOnDate(weights, selectedDate) : null
  const dateMeasurements = selectedDate ? getMeasurementsOnDate(measurements, selectedDate) : null

  // Upload mode
  if (mode === 'upload') return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => { setMode('view'); setPreview(null) }} />
        <PageHeader title="NUEVA FOTO" />

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
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          
          {preview ? (
            <div className="relative rounded-sm overflow-hidden border border-[#222222]">
              <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: '300px' }} />
              <button onClick={() => setPreview(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-sm bg-[#0a0a0a]/80 border border-[#333333] text-[#888888] flex items-center justify-center hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-32 glass-card rounded-sm border-dashed border-[#333333] flex flex-col items-center justify-center gap-2 hover:border-[#c8f500] transition-colors">
              <span className="text-[#555555] text-2xl">📷</span>
              <span className="text-[#555555] font-sans text-xs">Toca para seleccionar foto</span>
            </button>
          )}

          <button onClick={handleUpload} disabled={!preview || uploading}
            className="w-full h-14 bg-[#c8f500] text-[#0a0a0a] font-sans font-bold tracking-widest rounded-sm disabled:opacity-40 transition-colors hover:bg-[#deff33] flex items-center justify-center">
            {uploading ? '...' : 'GUARDAR FOTO'}
          </button>
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </div>
  )

  // View mode
  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="FOTOGRAFÍAS" sub="progreso visual" />

        {/* Add photo button */}
        <button onClick={() => setMode('upload')}
          className="w-full h-11 glass-card rounded-sm text-[#555555] font-sans text-xs font-bold tracking-widest hover:border-[#c8f500] hover:text-[#c8f500] transition-all duration-200 mb-5">
          + NUEVA FOTO
        </button>

        {dates.length === 0 ? (
          <EmptyState message="SIN FOTOGRAFÍAS" icon="📷" />
        ) : (
          <>
            {/* Date selector */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
              {dates.map((d, i) => {
                const dateStr = typeof d.date === 'string' ? d.date : d.date.toISOString?.()?.split('T')[0] || String(d.date)
                const active = dateStr === selectedDate
                return (
                  <button key={i} onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex-shrink-0 px-3 h-9 font-sans text-xs font-bold rounded-sm transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#c8f500] text-[#0a0a0a] shadow-[0_0_12px_rgba(200,245,0,0.2)]'
                        : 'glass-card text-[#555555] hover:text-[#888888]'
                    }`}>
                    {parseDate(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    <span className={`block text-[8px] ${active ? 'text-[#0a0a0a]/60' : 'text-[#333333]'}`}>
                      {d.count} foto{d.count > 1 ? 's' : ''}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Context bar — weight + measurements */}
            <div className="glass-card rounded-sm p-3 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                {dateWeight && (
                  <div>
                    <p className="text-[#333333] font-sans text-[9px] tracking-wider">PESO</p>
                    <p className="text-[#c8f500] font-mono text-sm font-bold">{dateWeight.toFixed(1)} kg</p>
                  </div>
                )}
                {dateMeasurements && (
                  <>
                    {Object.entries(MEASUREMENT_LABELS).map(([key, label]) => {
                      const val = dateMeasurements[key]
                      if (!val) return null
                      return (
                        <div key={key}>
                          <p className="text-[#333333] font-sans text-[8px] tracking-wider">{label.toUpperCase()}</p>
                          <p className="text-[#888888] font-mono text-[11px] font-bold">{parseFloat(val).toFixed(1)}</p>
                        </div>
                      )
                    })}
                  </>
                )}
                {!dateWeight && !dateMeasurements && (
                  <p className="text-[#333333] font-sans text-[10px]">sin datos de peso/medidas para esta fecha</p>
                )}
              </div>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {TYPE_ORDER.map(type => {
                const photo = photos.find(p => p.photo_type === type)
                return (
                  <div key={type} className="flex flex-col gap-1">
                    <p className="text-[#444444] font-sans text-[9px] tracking-[0.15em] text-center">{TYPE_LABELS[type]}</p>
                    {photo ? (
                      <div className="relative rounded-sm overflow-hidden border border-[#222222] group aspect-[3/4]">
                        <img
                          src={`data:image/jpeg;base64,${photo.image_data}`}
                          alt={type}
                          className="w-full h-full object-cover"
                        />
                        <button onClick={() => handleDelete(photo.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-sm bg-[#0a0a0a]/70 text-[#555555] text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-[#ff2d2d] transition-all">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-[#1a1a1a] aspect-[3/4] flex items-center justify-center">
                        <span className="text-[#1a1a1a] text-xl">+</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </div>
  )
}