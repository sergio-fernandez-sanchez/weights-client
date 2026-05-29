import AnimatedNumber from './AnimatedNumber'

export default function MetricCard({ label, value, sub, valueColor = '#c8f500', icon = null }) {
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
    <div className="relative glass-card glass-sheen rounded-sm p-4 group card-hover overflow-hidden">
      {/* Top accent — liquid gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-80 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${valueColor}, ${valueColor}40, transparent)`,
        }}
      />

      {/* Ambient hover glow */}
      <div
        className="absolute -top-10 -left-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl"
        style={{ backgroundColor: valueColor }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          {icon && <span className="text-xs opacity-50">{icon}</span>}
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] uppercase">{label}</p>
        </div>
        <p className="font-mono text-xl font-bold leading-none tracking-tight" style={{ color: valueColor }}>
          {isNumeric ? (
            <AnimatedNumber value={numericValue} decimals={decimalPlaces} />
          ) : (
            value
          )}
        </p>
        {sub && <p className="text-[#555555] font-sans text-[10px] mt-2 leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}