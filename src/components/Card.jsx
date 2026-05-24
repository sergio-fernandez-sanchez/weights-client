// Componente base para cards con estética cyberpunk
// Uso:
//   <Card><contenido></Card>
//   <Card accent="#c8f500" label="ETIQUETA"><contenido></Card>

export default function Card({ children, className = '', accent = null, label = null, glow = false }) {
  return (
    <div
      className={`relative bg-[#141414] border border-[#333333] p-4 transition-all duration-200 ${glow ? 'shadow-[0_0_16px_rgba(200,245,0,0.08)]' : ''} ${className}`}
      style={accent ? { borderColor: `${accent}40` } : undefined}
    >
      {/* Corner brackets sutiles */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t" style={{ borderColor: accent || '#444444' }} />
      <span className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t" style={{ borderColor: accent || '#444444' }} />
      <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b" style={{ borderColor: accent || '#444444' }} />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b" style={{ borderColor: accent || '#444444' }} />

      {/* Label opcional con barra lateral */}
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1 h-3" style={{ backgroundColor: accent || '#c8f500' }} />
          <span className="text-[#888888] font-mono text-xs tracking-widest">{label}</span>
        </div>
      )}

      {children}
    </div>
  )
}