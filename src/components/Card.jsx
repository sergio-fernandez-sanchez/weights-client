export default function Card({ children, className = '', accent = null, label = null, glow = false }) {
  return (
    <div
      className={`relative glass-card glass-sheen rounded-sm p-4 card-hover overflow-hidden ${glow ? 'glass-inner-glow' : ''} ${className}`}
      style={accent ? { borderColor: `${accent}33` } : undefined}
    >
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)` }} />
      )}
      {label && (
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-[3px] h-3.5 rounded-full" style={{ backgroundColor: accent || '#5f8a00' }} />
          <span className="text-[#71727a] font-sans text-[10px] font-medium tracking-[0.2em] uppercase">{label}</span>
        </div>
      )}
      {children}
    </div>
  )
}
