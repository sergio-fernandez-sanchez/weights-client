import { usePhase } from '../context/PhaseContext'
import { readableOnLight } from '../utils/color'

/**
 * PageHeader — encabezado terminal/iOS 26. Título en mono (ADN cyberpunk) con
 * color de fase legible sobre claro; dot/líneas conservan el color vibrante.
 */
export default function PageHeader({ title, className = '', blink = false, sub = null }) {
  const { phaseColor } = usePhase()
  const ink = readableOnLight(phaseColor)

  return (
    <div className={`relative mb-8 animate-fade-in-up ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping" style={{ backgroundColor: phaseColor }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: phaseColor, boxShadow: `0 0 8px ${phaseColor}` }} />
        </span>
        <span className="h-px flex-1 opacity-50 animate-line-expand" style={{ background: `linear-gradient(90deg, ${phaseColor}, transparent)` }} />
      </div>

      <h1 className={`font-mono font-bold tracking-widest text-2xl sm:text-3xl leading-tight ${blink ? 'cursor-blink' : ''}`}
        style={{ color: ink, textShadow: `0 1px 16px ${phaseColor}1f` }}>
        {title}
      </h1>

      {sub && (
        <p className="text-[#71727a] font-mono text-xs mt-2 tracking-wide">{sub}</p>
      )}

      <div className="mt-3 h-px opacity-50 animate-line-expand" style={{ animationDelay: '0.2s', background: `linear-gradient(90deg, ${phaseColor}, rgba(70,80,115,0.18), transparent)` }} />
    </div>
  )
}
