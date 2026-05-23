import { useState, useEffect } from 'react'
import { getBodyMeasurements } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const METRICS = [
  ['neck_cm',      'CUELLO (cm)'],
  ['shoulders_cm', 'HOMBROS (cm)'],
  ['chest_cm',     'PECHO (cm)'],
  ['bicep_cm',     'BÍCEP (cm)'],
  ['waist_cm',     'CINTURA (cm)'],
  ['hip_cm',       'CADERA (cm)'],
  ['thigh_cm',     'MUSLO (cm)'],
]

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function deltaColor(delta) {
  if (delta === 0) return '#888888'
  return delta > 0 ? '#4a9eff' : '#c8f500'
}

export default function BodyMeasurements({ onNavigate }) {
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getBodyMeasurements()
        const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
        setReports(sorted)
        if (sorted.length > 0) setSelectedIdx(sorted.length - 1)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-[#888888] font-mono text-sm">cargando...</p></div>
  if (!reports.length) return (
    <div className="min-h-screen px-6 pb-10"><div className="w-full max-w-sm mx-auto pt-10">
      <BackButton onClick={() => onNavigate('data')} /><PageHeader title="// MEDIDAS CORPORALES" />
      <p className="text-[#888888] font-mono text-sm">sin medidas registradas</p>
    </div></div>
  )

  const current = reports[selectedIdx]
  const prev    = selectedIdx > 0 ? reports[selectedIdx - 1] : null

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// MEDIDAS CORPORALES" />

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {reports.map((r, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className={`flex-shrink-0 px-3 h-9 font-mono text-xs border transition-colors whitespace-nowrap ${selectedIdx === i ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]' : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'}`}>
              {parseDate(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-px">
          <div className="flex bg-[#141414] border border-[#333333] px-4 py-2">
            <span className="flex-1 text-[#c8f500] font-mono text-xs">MEDIDA</span>
            {prev && <span className="w-16 text-center text-[#888888] font-mono text-xs">Δ</span>}
            <span className="w-16 text-right text-[#c8f500] font-mono text-xs">VALOR</span>
          </div>
          {METRICS.map(([key, label]) => {
            const val     = current?.[key] != null ? parseFloat(current[key]) : null
            const prevVal = prev?.[key]    != null ? parseFloat(prev[key])    : null
            const delta   = val != null && prevVal != null ? val - prevVal : null
            return (
              <div key={key} className="flex items-center bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 h-10">
                <span className="flex-1 text-[#888888] font-mono text-xs">{label}</span>
                {prev && <span className="w-16 text-center font-mono text-xs font-bold" style={{ color: delta != null ? deltaColor(delta) : '#888888' }}>
                  {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}
                </span>}
                <span className="w-16 text-right text-[#e8e8e8] font-mono text-sm font-bold">{val != null ? val.toFixed(1) : '—'}</span>
              </div>
            )
          })}
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}