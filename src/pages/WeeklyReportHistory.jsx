import { useState, useEffect } from 'react'
import { getWeeklyReports } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function fmtWeek(isoDate) {
  const monday = parseDate(isoDate)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = d => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function completeness(report) {
  const fields = ['training_days', 'avg_daily_steps', 'avg_water_liters']
  const filled = fields.filter(f => report[f] != null).length
  return Math.round((filled / fields.length) * 100)
}

export default function WeeklyReportHistory({ onNavigate }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getWeeklyReports()
        setReports(data || [])
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#555555] font-sans text-sm animate-pulse">cargando...</p>
    </div>
  )

  // Build list of all weeks from earliest report to last week
  const reportMap = {}
  reports.forEach(r => { reportMap[r.week_start] = r })

  const lastMonday = getMonday(new Date())
  lastMonday.setDate(lastMonday.getDate() - 7)

  // Find earliest Monday
  let earliest = lastMonday
  if (reports.length > 0) {
    const dates = reports.map(r => parseDate(r.week_start))
    const min = new Date(Math.min(...dates))
    const minMonday = getMonday(min)
    if (minMonday < earliest) earliest = minMonday
  }

  // Generate weeks from earliest to lastMonday
  const weeks = []
  const cursor = new Date(lastMonday)
  while (cursor >= earliest) {
    const key = toISO(cursor)
    weeks.push({
      key,
      label: fmtWeek(key),
      report: reportMap[key] || null,
    })
    cursor.setDate(cursor.getDate() - 7)
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="INFORMES SEMANALES" sub="historial de todas las semanas" />

        {weeks.length === 0 ? (
          <EmptyState message="SIN INFORMES SEMANALES" icon="◇" />
        ) : (
          <div className="flex flex-col gap-2 stagger">
            {weeks.map((w, i) => {
              const filled = !!w.report
              const pct = w.report ? completeness(w.report) : 0
              const statusColor = filled ? '#5f8a00' : '#d92020'

              return (
                <button key={w.key}
                  onClick={() => onNavigate('weeklyReport', { weekStart: w.key, from: 'weeklyReportHistory' })}
                  className="w-full glass-card glass-sheen card-hover click-press rounded-sm p-3.5 flex items-center gap-3 group text-left relative overflow-hidden"
                >
                  {/* Left status bar */}
                  <div className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: statusColor, opacity: filled ? 0.7 : 0.25 }} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[#1d1d1f] font-sans text-sm font-bold">{w.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {filled ? (
                        <>
                          {w.report.training_days != null && (
                            <span className="text-[#6c6e76] font-sans text-[10px]">
                              {w.report.training_days}d gym
                            </span>
                          )}
                          {w.report.avg_daily_steps != null && (
                            <span className="text-[#6c6e76] font-sans text-[10px]">
                              {Math.round(w.report.avg_daily_steps / 1000)}k pasos
                            </span>
                          )}
                          {w.report.avg_water_liters != null && (
                            <span className="text-[#6c6e76] font-sans text-[10px]">
                              {w.report.avg_water_liters}L
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[#9a9ba2] font-sans text-[10px]">sin rellenar</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {filled && (
                      <span className="font-sans text-[9px] tracking-widest px-2 py-0.5 rounded-sm"
                        style={{ color: statusColor, backgroundColor: `${statusColor}10`, border: `1px solid ${statusColor}18` }}>
                        {pct === 100 ? '✓' : `${pct}%`}
                      </span>
                    )}
                    <span className="text-[#a8a9b0] group-hover:text-[#5f8a00] transition-colors">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}