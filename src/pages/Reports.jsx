import { useState, useEffect } from 'react'
import { getReports } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const METRICS = [
  ['body_fat_pct',         '% GRASA',        false],
  ['skeletal_muscle_mass', 'M.M. ESQ.',       true],
  ['fat_free_mass',        'M. LIBRE GRASA',  true],
  ['visceral_fat_index',   'GRASA VISCERAL',  false],
  ['muscle_quality',       'CAL. MUSCULAR',   true],
  ['trunk_fat_kg',         'TRONCO kg',       false],
  ['trunk_fat_pct',        'TRONCO %',        false],
  ['total_body_water',     'AGUA CORP.',      true],
  ['neck_cm',              'CUELLO cm',       null],
  ['chest_cm',             'PECHO cm',        null],
  ['bicep_cm',             'BÍCEP cm',        true],
  ['hip_cm',               'CADERA cm',       null],
  ['thigh_cm',             'MUSLO cm',        true],
]

function deltaColor(delta, upIsGood) {
  if (upIsGood === null || delta === 0) return '#888888'
  if ((delta > 0 && upIsGood) || (delta < 0 && !upIsGood)) return '#4caf50'
  return '#f44336'
}

export default function Reports({ onNavigate }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReports()
        const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
        setReports(sorted)
        if (sorted.length > 0) setSelectedIndex(sorted.length - 1)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-[#888888] font-mono text-sm">cargando...</p>
    </div>
  )

  if (reports.length === 0) return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// INFORMES" />
        <p className="text-[#888888] font-mono text-sm">no hay informes registrados</p>
      </div>
    </div>
  )

  const current = reports[selectedIndex]
  const prev = selectedIndex > 0 ? reports[selectedIndex - 1] : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="// INFORMES" />

        {/* Date selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {reports.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 px-3 h-9 font-mono text-xs border transition-colors whitespace-nowrap ${
                selectedIndex === i
                  ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                  : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
              }`}
            >
              {new Date(r.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </button>
          ))}
        </div>

        {/* Metrics */}
        <div className="flex flex-col gap-px">
          {/* Header */}
          <div className="flex bg-[#141414] border border-[#333333] px-4 py-2">
            <span className="flex-1 text-[#c8f500] font-mono text-xs">MÉTRICA</span>
            {prev && <span className="w-16 text-center text-[#888888] font-mono text-xs">Δ</span>}
            <span className="w-16 text-right text-[#c8f500] font-mono text-xs">VALOR</span>
          </div>

          {METRICS.map(([key, label, upIsGood]) => {
            const val = current?.[key] != null ? parseFloat(current[key]) : null
            const prevVal = prev?.[key] != null ? parseFloat(prev[key]) : null
            const delta = val != null && prevVal != null ? val - prevVal : null

            return (
              <div key={key} className="flex items-center bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 h-10">
                <span className="flex-1 text-[#888888] font-mono text-xs">{label}</span>
                {prev && (
                  <span
                    className="w-16 text-center font-mono text-xs font-bold"
                    style={{ color: delta != null ? deltaColor(delta, upIsGood) : '#888888' }}
                  >
                    {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}
                  </span>
                )}
                <span className="w-16 text-right text-[#e8e8e8] font-mono text-sm font-bold">
                  {val != null ? val.toFixed(1) : '—'}
                </span>
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