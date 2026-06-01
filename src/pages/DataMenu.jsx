import { useState, useEffect } from 'react'
import { getLastWeight, getGymLogs, getActiveCalories, getBioimpedanceReports, getDexaReports, getBodyMeasurements, getWeeklyReports, getPhotoDates } from '../api/client'
import { usePhase, PHASE_COLORS } from '../context/PhaseContext'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const PHASE_LABELS = { bulk: 'VOL', cut: 'DEF', maintenance: 'MAN' }

function parseDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

// Calcula el % de progreso de un ejercicio en la fase activa:
// compara el 1RM más antiguo desde el inicio de la fase con el más reciente.
function calcPhaseProgress(logs, exerciseTypeId, phaseStartDate) {
  const phaseLogs = logs
    .filter(l => l.exercise_type_id === exerciseTypeId && parseDate(l.date) >= parseDate(phaseStartDate))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
  if (phaseLogs.length < 2) return null
  const base = oneRM(phaseLogs[0])
  const curr = oneRM(phaseLogs[phaseLogs.length - 1])
  if (!base || !curr || base === 0) return null
  return ((curr - base) / base) * 100
}

function gymPhaseAvg(logs, phaseStartDate) {
  if (!logs?.length || !phaseStartDate) return null
  // Un log por ejercicio (el más reciente de la fase)
  const byType = Object.values(
    Object.fromEntries(
      logs
        .filter(l => parseDate(l.date) >= parseDate(phaseStartDate))
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))
        .map(l => [l.exercise_type_id, l])
    )
  )
  const pcts = byType.map(l => calcPhaseProgress(logs, l.exercise_type_id, phaseStartDate)).filter(v => v !== null)
  if (!pcts.length) return null
  return pcts.reduce((a, b) => a + b, 0) / pcts.length
}

function DataItem({ label, preview, sub, onClick, color }) {
  return (
    <button onClick={onClick}
      className="w-full glass-card glass-sheen card-hover click-press rounded-sm p-3.5 flex items-center justify-between group text-left">
      <div className="min-w-0">
        <p className="text-[#3c3e45] font-sans text-xs font-bold tracking-[0.12em] group-hover:text-[#5f8a00] transition-colors">{label}</p>
        {sub && <p className="text-[#9a9ba2] font-sans text-[10px] mt-0.5 truncate">{sub}</p>}
      </div>
      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
        {preview && (
          <span className="font-mono text-sm font-bold" style={{ color: color || '#80828a' }}>{preview}</span>
        )}
        <span className="text-[#a8a9b0] group-hover:text-[#5f8a00] transition-colors">›</span>
      </div>
    </button>
  )
}

export default function DataMenu({ onNavigate }) {
  const { activePhase, phaseColor } = usePhase()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPreviews() {
      try {
        const [weight, gym, cal, bio, dexa, body, weekly, photos] = await Promise.all([
          getLastWeight().catch(() => null),
          getGymLogs().catch(() => []),
          getActiveCalories().catch(() => null),
          getBioimpedanceReports().catch(() => []),
          getDexaReports().catch(() => []),
          getBodyMeasurements().catch(() => []),
          getWeeklyReports().catch(() => []),
          getPhotoDates().catch(() => []),
        ])
        const gymPhasePct = gymPhaseAvg(gym, activePhase?.start_date)

        setStats({
          lastWeight: weight ? `${weight.weight} kg` : null,
          weightDate: weight?.date,
          phaseLabel: activePhase ? (PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type) : null,
          phaseDays: activePhase ? Math.floor((new Date() - parseDate(activePhase.start_date)) / (1000*60*60*24)) : null,
          bestRM: gymPhasePct === null && gym?.length > 0
            ? gym.reduce((best, log) => {
                const rm = oneRM(log)
                return rm && (!best || rm > best.rm) ? { name: log.name, rm: Math.round(rm) } : best
              }, null)
            : null,
          gymPhasePct,
          calories: cal?.calories,
          bioCount: bio?.length || 0,
          dexaCount: dexa?.length || 0,
          bodyCount: body?.length || 0,
          gymCount: new Set(gym?.map(l => l.exercise_type_id) || []).size,
          weeklyCount: weekly?.length || 0,
          photoCount: photos?.reduce((sum, p) => sum + (p.count || 0), 0) || 0,
          photoDates: photos?.length || 0,
        })
      } catch {}
      finally { setLoading(false) }
    }
    fetchPreviews()
  }, [activePhase])

  const s = stats

  return (
    <PageWrapper>
      <BackButton />
      <PageHeader title="DATOS" sub="historial y métricas" />

      {loading ? (
        <p className="text-[#555555] font-sans text-sm animate-pulse">cargando...</p>
      ) : (
        <div className="flex flex-col gap-2 stagger">
          <DataItem
            label="PESO"
            preview={s.lastWeight}
            sub={s.weightDate ? parseDate(s.weightDate).toLocaleDateString('es-ES') : null}
            onClick={() => onNavigate('weightHistory')}
            color="#5f8a00"
          />
          <DataItem
            label="FASES"
            preview={s.phaseLabel ? `${s.phaseLabel} · ${s.phaseDays}d` : null}
            sub={s.phaseLabel ? 'fase activa' : 'sin fase activa'}
            onClick={() => onNavigate('currentPhase')}
            color={phaseColor}
          />
          <DataItem
            label="GYM"
            preview={s.gymPhasePct !== null
              ? `${s.gymPhasePct > 0 ? '+' : ''}${s.gymPhasePct.toFixed(1)}%`
              : s.bestRM ? `${s.bestRM.rm} kg` : s.gymCount > 0 ? `${s.gymCount}` : null}
            sub={s.gymPhasePct !== null ? 'progreso fase activa' : s.bestRM ? `mejor 1RM · ${s.bestRM.name.toLowerCase()}` : s.gymCount > 0 ? 'ejercicios activos' : null}
            color={s.gymPhasePct !== null ? (s.gymPhasePct > 2 ? '#3a9d4e' : s.gymPhasePct < -2 ? '#d92020' : '#b87400') : '#5f8a00'}
            onClick={() => onNavigate('gymHistory')}
          />
          <DataItem
            label="CALORÍAS"
            preview={s.calories ? `${s.calories} kcal` : null}
            sub={s.calories ? 'objetivo actual' : null}
            onClick={() => onNavigate('caloriesHistory')}
            color="#5f8a00"
          />
          <DataItem
            label="BIOIMPEDANCIA"
            preview={s.bioCount > 0 ? `${s.bioCount}` : null}
            sub={s.bioCount > 0 ? `informe${s.bioCount > 1 ? 's' : ''}` : null}
            onClick={() => onNavigate('bioimpedanceReports')}
          />
          <DataItem
            label="DEXA"
            preview={s.dexaCount > 0 ? `${s.dexaCount}` : null}
            sub={s.dexaCount > 0 ? `informe${s.dexaCount > 1 ? 's' : ''}` : null}
            onClick={() => onNavigate('dexaReports')}
          />
          <DataItem
            label="MEDIDAS"
            preview={s.bodyCount > 0 ? `${s.bodyCount}` : null}
            sub={s.bodyCount > 0 ? `registro${s.bodyCount > 1 ? 's' : ''}` : null}
            onClick={() => onNavigate('bodyMeasurements')}
          />
          <DataItem
            label="FOTOGRAFÍAS"
            preview={s.photoCount > 0 ? `${s.photoCount}` : null}
            sub={s.photoDates > 0 ? `${s.photoDates} sesión${s.photoDates > 1 ? 'es' : ''}` : null}
            onClick={() => onNavigate('photos')}
            color="#5f8a00"
          />
          <DataItem
            label="INFORMES SEMANALES"
            preview={s.weeklyCount > 0 ? `${s.weeklyCount}` : null}
            sub={s.weeklyCount > 0 ? `semana${s.weeklyCount > 1 ? 's' : ''}` : null}
            onClick={() => onNavigate('weeklyReportHistory')}
          />
          <DataItem
            label="RESUMEN MENSUAL"
            preview={null}
            sub="datos agregados por mes"
            onClick={() => onNavigate('monthlySummary')}
          />
        </div>
      )}

      <Separator className="mt-8 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
    </PageWrapper>
  )
}