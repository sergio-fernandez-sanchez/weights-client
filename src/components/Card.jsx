export default function Card({ children, className = '', accent = null, label = null, glow = false }) {
  return (
    <div
      className={`relative glass-card rounded-sm p-4 transition-all duration-300 overflow-hidden ${glow ? 'shadow-[0_0_20px_rgba(200,245,0,0.08)]' : ''} ${className}`}
      style={accent ? { borderColor: `${accent}30` } : undefined}
    >
      {/* Top accent line */}
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
      )}

      {/* Label con barra lateral */}
      {label && (
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-[3px] h-3.5 rounded-full" style={{ backgroundColor: accent || '#c8f500' }} />
          <span className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase">{label}</span>
        </div>
      )}

      {children}
    </div>
  )
}