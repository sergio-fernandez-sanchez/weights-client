import AnimatedNumber from './AnimatedNumber'
import { readableOnLight } from '../utils/color'

export default function MetricCard({ label, value, sub, valueColor = '#5f8a00', icon = null }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  const isNumeric = !isNaN(numericValue) && value !== '—' && value !== null
  // Extract decimal places from the numeric part only
  const decimalPlaces = (() => {
    if (!isNumeric || typeof value !== 'string') return 2
    const numStr = value.match(/[\d.]+/)?.[0] || ''
    const parts = numStr.split('.')
    return parts.length > 1 ? parts[1].length : 0
  })()

  return (
    <div className="relative glass-card glass-sheen rounded-sm p-4 group card-hover overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${valueColor}12, rgba(255,255,255,0.03) 60%)` }}>
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-90 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${valueColor}, ${valueColor}40, transparent)` }}
      />
      {/* Corner glow: gradiente radial desde la esquina, respeta el border-radius */}
      <div
        className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none rounded-sm"
        style={{ background: `radial-gradient(ellipse 80% 70% at 0% 0%, ${valueColor}, transparent)` }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          {icon && <span className="text-xs opacity-50">{icon}</span>}
          <p className="text-[#71727a] font-sans text-[10px] font-medium tracking-[0.2em] uppercase">{label}</p>
        </div>
        <p className="font-mono text-xl font-bold leading-none tracking-tight" style={{ color: readableOnLight(valueColor) }}>
          {isNumeric ? (
            <AnimatedNumber value={numericValue} decimals={decimalPlaces} />
          ) : (
            value
          )}
        </p>
        {sub && <p className="text-[#71727a] font-sans text-[10px] mt-2 leading-relaxed whitespace-pre-line">{sub}</p>}
      </div>
    </div>
  )
}