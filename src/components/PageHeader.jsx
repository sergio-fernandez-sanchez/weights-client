export default function PageHeader({ title, className = '', blink = false }) {
  return (
    <div className={`relative mb-6 animate-fade-in-up ${className}`}>
      {/* Corner brackets en la esquina superior izquierda y derecha */}
      <span className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-[#c8f500] opacity-40" />
      <span className="absolute -top-1 -right-1 w-3 h-3 border-r border-t border-[#c8f500] opacity-40" />

      <div className="flex items-baseline gap-3 pl-1">
        {/* Indicador de status pulsante */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#c8f500] opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c8f500]" />
        </span>

        <h1 className={`text-[#c8f500] font-mono font-bold tracking-widest whitespace-nowrap glow-text text-3xl md:text-4xl ${blink ? 'cursor-blink' : ''}`}>
          {title}
        </h1>
      </div>

      {/* Línea inferior con gradiente y bracket */}
      <div className="relative mt-3 flex items-center gap-2 pl-1">
        <span className="h-px flex-1 bg-gradient-to-r from-[#c8f500] via-[#333333] to-transparent opacity-60" />
        <span className="text-[#333333] font-mono text-xs tracking-widest">◄</span>
      </div>
    </div>
  )
}