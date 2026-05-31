import { useState, useEffect } from 'react'
import { getPhotoDates, getPhotosByDate, deletePhoto, getWeights, getBodyMeasurements, getPhases } from '../api/client'
import { SkeletonPage } from '../components/Skeleton'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'
import EmptyState from '../components/EmptyState'
import { readableOnLight } from '../utils/color'

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

const TYPE_LABELS = { front: 'FRENTE', side: 'PERFIL', back: 'ESPALDA' }
const TYPE_ORDER = ['front', 'side', 'back']

const PHASE_COLORS = { bulk: '#a4c400', cut: '#e23535', maintenance: '#e88c00' }
const PHASE_LABELS = { bulk: 'VOLUMEN', cut: 'DEFINICIÓN', maintenance: 'MANTENIMIENTO' }

function getPhaseOnDate(phases, dateStr) {
  const d = parseDate(dateStr)
  for (const p of phases) {
    const start = parseDate(p.start_date)
    const end = p.end_date ? parseDate(p.end_date) : new Date(8640000000000000)
    if (d >= start && d <= end) return p.phase_type
  }
  return null
}

const MEASUREMENT_LABELS = {
  neck_cm: 'Cuello', shoulders_cm: 'Hombros', chest_cm: 'Pecho',
  bicep_cm: 'Bícep', waist_cm: 'Cintura', hip_cm: 'Cadera', thigh_cm: 'Muslo',
}

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

export default function Photos({ onNavigate }) {
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [photos, setPhotos] = useState([])
  const [weights, setWeights] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [datesData, wData, mData, pData] = await Promise.all([
        getPhotoDates(), getWeights(), getBodyMeasurements().catch(() => []), getPhases().catch(() => [])
      ])
      setDates(datesData || [])
      setWeights(wData || [])
      setMeasurements(mData || [])
      setPhases(pData || [])
      if (datesData?.length > 0 && !selectedDate) {
        const first = datesData[0]
        setSelectedDate(typeof first.date === 'string' ? first.date : first.date?.toISOString?.()?.split('T')[0] || String(first.date))
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
  // Fase de la foto: la guardada con la foto; si es antigua y no tiene, se
  // deduce por la fecha como respaldo.
  const storedPhase = photos.find(p => p.phase_type)?.phase_type || null
  const datePhase = storedPhase || (selectedDate ? getPhaseOnDate(phases, selectedDate) : null)

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="FOTOGRAFÍAS" sub="progreso visual" />

        {dates.length === 0 ? (
          <EmptyState message="SIN FOTOGRAFÍAS" icon="◇" />
        ) : (
          <>
            {/* Date selector */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
              {dates.map((d, i) => {
                const dateStr = typeof d.date === 'string' ? d.date : d.date?.toISOString?.()?.split('T')[0] || String(d.date)
                const active = dateStr === selectedDate
                return (
                  <button key={i} onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex-shrink-0 px-3 h-9 font-sans text-xs font-bold rounded-sm transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#c8f500] text-[#0a0a0a] shadow-[0_0_12px_rgba(164,196,0,0.2)]'
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

            {/* Context bar */}
            <div className="glass-card rounded-sm p-3 mb-4">
              {datePhase && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[rgba(70,80,115,0.1)]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[datePhase], boxShadow: `0 0 6px ${PHASE_COLORS[datePhase]}` }} />
                  <span className="font-sans text-[10px] font-bold tracking-[0.18em]"
                    style={{ color: readableOnLight(PHASE_COLORS[datePhase]) }}>
                    {PHASE_LABELS[datePhase]}
                  </span>
                  {!storedPhase && (
                    <span className="font-sans text-[8px] text-[#9a9ba2] tracking-wider">(según fecha)</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {dateWeight && (
                  <div>
                    <p className="text-[#9a9ba2] font-sans text-[9px] tracking-wider">PESO</p>
                    <p className="text-[#5f8a00] font-mono text-sm font-bold">{dateWeight.toFixed(1)} kg</p>
                  </div>
                )}
                {dateMeasurements && Object.entries(MEASUREMENT_LABELS).map(([key, label]) => {
                  const val = dateMeasurements[key]
                  if (!val) return null
                  return (
                    <div key={key}>
                      <p className="text-[#9a9ba2] font-sans text-[8px] tracking-wider">{label.toUpperCase()}</p>
                      <p className="text-[#41434a] font-mono text-[11px] font-bold">{parseFloat(val).toFixed(1)}</p>
                    </div>
                  )
                })}
                {!dateWeight && !dateMeasurements && (
                  <p className="text-[#9a9ba2] font-sans text-[10px]">sin datos de peso/medidas para esta fecha</p>
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
                      <div className="relative rounded-sm overflow-hidden border border-[#222222] group aspect-[3/4] cursor-pointer"
                        onClick={() => setLightbox({ src: `data:image/jpeg;base64,${photo.image_data}`, type })}>
                        <img
                          src={`data:image/jpeg;base64,${photo.image_data}`}
                          alt={type}
                          className="w-full h-full object-cover"
                        />
                        <button onClick={e => { e.stopPropagation(); handleDelete(photo.id) }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-sm bg-[#0a0a0a]/70 text-[#555555] text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-[#ff2d2d] transition-all">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-[#1a1a1a] aspect-[3/4] flex items-center justify-center">
                        <span className="text-[#1a1a1a] text-xl">—</span>
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

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <div className="relative max-w-[90vw] max-h-[85vh] animate-fade-in" onClick={e => e.stopPropagation()}>
              <img
                src={lightbox.src}
                alt={lightbox.type}
                className="max-w-full max-h-[85vh] object-contain rounded-sm"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-[#0a0a0a]/80 border border-[#333333]">
                <span className="text-[#c8f500] font-sans text-[10px] font-bold tracking-wider">{TYPE_LABELS[lightbox.type]}</span>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-sm bg-[#0a0a0a]/80 border border-[#333333] text-[#888888] flex items-center justify-center hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}