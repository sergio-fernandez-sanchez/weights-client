import { useState, useEffect } from 'react'
import { getWeights, getCalories, getGymLogs, getWeeklyReports, getPhases } from '../api/client'
import { SkeletonPage } from '../components/Skeleton'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'
import { readableOnLight } from '../utils/color'

const PHASE_COLORS = { bulk: '#a4c400', cut: '#e23535', maintenance: '#e88c00' }
const PHASE_LABELS = { bulk: 'VOL', cut: 'DEF', maintenance: 'MAN' }

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
  return `${months[parseInt(m) - 1]} ${y}`
}

export default function MonthlySummary({ onNavigate }) {
  const [months, setMonths] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [weights, calories, gymLogs, weeklyReports, phases] = await Promise.all([
          getWeights(), getCalories(), getGymLogs(), getWeeklyReports(), getPhases()
        ])

        // Group weights by month
        const weightsByMonth = {}
        weights.forEach(w => {
          const k = monthKey(parseDate(w.date))
          if (!weightsByMonth[k]) weightsByMonth[k] = []
          weightsByMonth[k].push(parseFloat(w.weight))
        })

        // Group weekly reports by month (using week_start)
        const reportsByMonth = {}
        weeklyReports.forEach(r => {
          const k = monthKey(parseDate(r.week_start))
          if (!reportsByMonth[k]) reportsByMonth[k] = []
          reportsByMonth[k].push(r)
        })

        // Get all month keys
        const allKeys = new Set()
        Object.keys(weightsByMonth).forEach(k => allKeys.add(k))
        Object.keys(reportsByMonth).forEach(k => allKeys.add(k))
        const sortedKeys = [...allKeys].sort().reverse()

        // Media de peso por mes (para comparar mes vs mes anterior)
        const avgByMonth = {}
        Object.keys(weightsByMonth).forEach(k => {
          const arr = weightsByMonth[k]
          avgByMonth[k] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
        })
        // Key del mes calendario anterior a uno dado
        function prevMonthKey(key) {
          const [y, m] = key.split('-').map(Number)
          const d = new Date(y, m - 2, 1) // m-1 es el mes actual (0-idx), m-2 el anterior
          return monthKey(d)
        }

        const result = sortedKeys.map(key => {
          const ws = weightsByMonth[key] || []
          const avg = ws.length > 0 ? ws.reduce((a, b) => a + b, 0) / ws.length : null
          const min = ws.length > 0 ? Math.min(...ws) : null
          const max = ws.length > 0 ? Math.max(...ws) : null

          // Δ MES = media de este mes − media del mes anterior
          const prevAvg = avgByMonth[prevMonthKey(key)]
          const monthDelta = (avg != null && prevAvg != null)
            ? parseFloat((avg - prevAvg).toFixed(2))
            : null

          const [y, m] = key.split('-').map(Number)
          const monthStart = new Date(y, m - 1, 1)
          const monthEnd = new Date(y, m, 0)

          // TODAS las calorías activas durante el mes, en orden cronológico
          const monthCalories = calories
            .filter(c => {
              const cs = parseDate(c.start_date)
              const ce = c.end_date ? parseDate(c.end_date) : new Date()
              return cs <= monthEnd && ce >= monthStart
            })
            .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
            .map(c => c.calories)

          // Gym: training days from weekly reports
          const reps = reportsByMonth[key] || []
          const trainingDays = reps.reduce((sum, r) => sum + (r.training_days || 0), 0)
          const avgSteps = reps.length > 0
            ? Math.round(reps.filter(r => r.avg_daily_steps).reduce((sum, r) => sum + r.avg_daily_steps, 0) / reps.filter(r => r.avg_daily_steps).length)
            : null

          // TODAS las fases por las que se pasó durante el mes, orden cronológico
          const monthPhases = phases
            .filter(p => {
              const ps = parseDate(p.start_date)
              const pe = p.end_date ? parseDate(p.end_date) : new Date()
              return ps <= monthEnd && pe >= monthStart
            })
            .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
            .map(p => p.phase_type)

          return {
            key, avg, min, max, delta: monthDelta,
            calories: monthCalories,
            trainingDays: reps.length > 0 ? trainingDays : null,
            avgSteps,
            phases: monthPhases,
            weightsCount: ws.length,
            reportsCount: reps.length,
          }
        })

        setMonths(result)
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return <SkeletonPage />

  if (months.length === 0) return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="RESUMEN MENSUAL" />
        <EmptyState message="SIN DATOS SUFICIENTES" icon="◇" />
      </div>
    </div>
  )

  function deltaColor(d) {
    if (d === null) return '#9a9ba2'
    if (d > 0.2) return '#3a9d4e'
    if (d < -0.2) return '#d92020'
    return '#b87400'
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('data')} />
        <PageHeader title="RESUMEN MENSUAL" sub="datos agregados por mes" />

        <div className="flex flex-col gap-3 stagger">
          {months.map((m, i) => (
            <div key={m.key} className="glass-card rounded-sm relative overflow-hidden">
              {/* Top accent — primera fase del mes */}
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
                style={{ background: m.phases.length ? `linear-gradient(90deg, ${PHASE_COLORS[m.phases[0]]}, transparent)` : 'linear-gradient(90deg, rgba(70,80,115,0.3), transparent)' }} />

              <div className="p-4 pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[#1d1d1f] font-mono text-base font-bold tracking-wider">{monthLabel(m.key)}</p>
                    <p className="text-[#9a9ba2] font-sans text-[10px] mt-0.5">
                      {m.weightsCount} registro{m.weightsCount !== 1 ? 's' : ''} de peso
                    </p>
                  </div>
                  {/* Todas las fases del mes, en orden, con flechas */}
                  {m.phases.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap justify-end max-w-[55%]">
                      {m.phases.map((ph, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-[#a8a9b0] text-[9px]">→</span>}
                          <span className="font-sans text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm"
                            style={{ color: readableOnLight(PHASE_COLORS[ph]), backgroundColor: `${PHASE_COLORS[ph]}1a`, border: `1px solid ${PHASE_COLORS[ph]}33` }}>
                            {PHASE_LABELS[ph]}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight stats */}
                {m.avg && (
                  <div className="flex items-end gap-3 mb-2">
                    <div>
                      <p className="text-[#71727a] font-sans text-[9px] tracking-wider">MEDIA</p>
                      <p className="text-[#5f8a00] font-mono text-xl font-bold">{m.avg.toFixed(1)} <span className="text-xs opacity-50">kg</span></p>
                    </div>
                    {m.delta !== null && (
                      <div className="mb-0.5">
                        <p className="text-[#71727a] font-sans text-[9px] tracking-wider">Δ MES</p>
                        <p className="font-mono text-sm font-bold" style={{ color: deltaColor(m.delta) }}>
                          {m.delta > 0 ? '+' : ''}{m.delta} kg
                        </p>
                      </div>
                    )}
                    <div className="mb-0.5">
                      <p className="text-[#71727a] font-sans text-[9px] tracking-wider">RANGO</p>
                      <p className="text-[#71727a] font-mono text-sm">{m.min?.toFixed(1)}–{m.max?.toFixed(1)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom stats */}
              <div className="flex border-t border-[rgba(70,80,115,0.1)]">
                {m.calories.length > 0 && (
                  <div className="flex-1 px-4 py-2 border-r border-[rgba(70,80,115,0.1)]">
                    <p className="text-[#9a9ba2] font-sans text-[8px] tracking-wider mb-0.5">KCAL</p>
                    <p className="text-[#41434a] font-mono text-[11px] font-bold flex items-center gap-1 flex-wrap">
                      {m.calories.map((c, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-[#a8a9b0]">→</span>}
                          {c}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
                {m.trainingDays !== null && (
                  <div className="flex-1 px-4 py-2 border-r border-[rgba(70,80,115,0.1)]">
                    <p className="text-[#9a9ba2] font-sans text-[8px] tracking-wider mb-0.5">GYM</p>
                    <p className="text-[#41434a] font-mono text-[11px] font-bold">{m.trainingDays}d</p>
                  </div>
                )}
                {m.avgSteps && (
                  <div className="flex-1 px-4 py-2">
                    <p className="text-[#9a9ba2] font-sans text-[8px] tracking-wider mb-0.5">PASOS</p>
                    <p className="text-[#41434a] font-mono text-[11px] font-bold">{Math.round(m.avgSteps / 1000)}k</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </div>
  )
}