import { useState, useEffect } from 'react'
import { getLastWeight, getActivePhase, getActiveGymLogs, getActiveCalories, getBioimpedanceReports, getDexaReports, getBodyMeasurements } from '../api/client'
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

function DataItem({ label, preview, sub, onClick, color }) {
  return (
    <button onClick={onClick}
      className="w-full glass-card rounded-sm p-3.5 flex items-center justify-between group hover:border-[#333333] transition-all duration-200 text-left">
      <div className="min-w-0">
        <p className="text-[#999999] font-sans text-xs font-bold tracking-[0.12em] group-hover:text-[#c8f500] transition-colors">{label}</p>
        {sub && <p className="text-[#333333] font-sans text-[10px] mt-0.5 truncate">{sub}</p>}
      </div>
      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
        {preview && (
          <span className="font-mono text-sm font-bold" style={{ color: color || '#555555' }}>{preview}</span>
        )}
        <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors">›</span>
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
        const [weight, gym, cal, bio, dexa, body] = await Promise.all([
          getLastWeight().catch(() => null),
          getActiveGymLogs().catch(() => []),
          getActiveCalories().catch(() => null),
          getBioimpedanceReports().catch(() => []),
          getDexaReports().catch(() => []),
          getBodyMeasurements().catch(() => []),
        ])
        const bestRM = gym?.length > 0
          ? gym.reduce((best, log) => {
              const rm = oneRM(log)
              return rm && (!best || rm > best.rm) ? { name: log.name, rm: Math.round(rm) } : best
            }, null)
          : null

        setStats({
          lastWeight: weight ? `${weight.weight} kg` : null,
          weightDate: weight?.date,
          phaseLabel: activePhase ? (PHASE_LABELS[activePhase.phase_type] || activePhase.phase_type) : null,
          phaseDays: activePhase ? Math.floor((new Date() - parseDate(activePhase.start_date)) / (1000*60*60*24)) : null,
          bestRM,
          calories: cal?.calories,
          bioCount: bio?.length || 0,
          dexaCount: dexa?.length || 0,
          bodyCount: body?.length || 0,
          gymCount: gym?.length || 0,
        })
      } catch {}
      finally { setLoading(false) }
    }
    fetchPreviews()
  }, [activePhase])

  const s = stats

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
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
            color="#c8f500"
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
            preview={s.bestRM ? `${s.bestRM.rm} kg` : s.gymCount > 0 ? `${s.gymCount}` : null}
            sub={s.bestRM ? `mejor 1RM · ${s.bestRM.name.toLowerCase()}` : s.gymCount > 0 ? 'ejercicios activos' : null}
            onClick={() => onNavigate('gymHistory')}
            color="#c8f500"
          />
          <DataItem
            label="CALORÍAS"
            preview={s.calories ? `${s.calories} kcal` : null}
            sub={s.calories ? 'objetivo actual' : null}
            onClick={() => onNavigate('caloriesHistory')}
            color="#c8f500"
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
        </div>
      )}

      <Separator className="mt-8 mb-4" />
      <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
    </PageWrapper>
  )
}