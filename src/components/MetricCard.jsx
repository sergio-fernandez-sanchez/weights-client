import AnimatedNumber from './AnimatedNumber'

export default function MetricCard({ label, value, sub, valueColor = '#c8f500', icon = null }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  const isNumeric = !isNaN(numericValue) && value !== '—' && value !== null

  return (
    <div className="relative glass-card rounded-sm p-4 group hover:border-[#333333] transition-all duration-300 overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${valueColor}, transparent)` }}
      />
      <div
        className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ backgroundColor: valueColor }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          {icon && <span className="text-xs opacity-50">{icon}</span>}
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.2em] uppercase">{label}</p>
        </div>
        <p className="font-mono text-xl font-bold leading-none tracking-tight" style={{ color: valueColor }}>
          {isNumeric ? (
            <AnimatedNumber value={numericValue} decimals={value?.includes?.('.') ? (value.split('.')[1]?.length || 2) : 0} />
          ) : (
            value
          )}
        </p>
        {sub && <p className="text-[#555555] font-sans text-[10px] mt-2 leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}