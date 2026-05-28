import { usePhase } from '../context/PhaseContext'

export default function PageHeader({ title, className = '', blink = false, sub = null }) {
  const { phaseColor } = usePhase()

  return (
    <div className={`relative mb-8 animate-fade-in-up ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ backgroundColor: phaseColor }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: phaseColor }} />
        </span>
        <span className="h-px flex-1 opacity-30 animate-line-expand" style={{ background: `linear-gradient(90deg, ${phaseColor}, transparent)` }} />
      </div>

      <h1 className={`font-mono font-bold tracking-widest glow-text text-2xl sm:text-3xl leading-tight ${blink ? 'cursor-blink' : ''}`}
        style={{ color: phaseColor }}>
        {title}
      </h1>

      {sub && (
        <p className="text-[#555555] font-mono text-xs mt-2 tracking-wide">{sub}</p>
      )}

      <div className="mt-3 h-px opacity-40 animate-line-expand" style={{ animationDelay: '0.2s', background: `linear-gradient(90deg, ${phaseColor}, #333333, transparent)` }} />
    </div>
  )
}