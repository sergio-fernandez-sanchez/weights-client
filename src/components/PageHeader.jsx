export default function PageHeader({ title, className = '', blink = false, sub = null }) {
  return (
    <div className={`relative mb-8 animate-fade-in-up ${className}`}>
      {/* Top accent line */}
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#c8f500] opacity-40 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c8f500]" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-[#c8f500] to-transparent opacity-30 animate-line-expand" />
      </div>

      <h1 className={`text-[#c8f500] font-mono font-bold tracking-widest glow-text text-2xl sm:text-3xl leading-tight ${blink ? 'cursor-blink' : ''}`}>
        {title}
      </h1>

      {sub && (
        <p className="text-[#555555] font-mono text-xs mt-2 tracking-wide">{sub}</p>
      )}

      {/* Bottom gradient line */}
      <div className="mt-3 h-px bg-gradient-to-r from-[#c8f500] via-[#333333] to-transparent opacity-40 animate-line-expand" style={{ animationDelay: '0.2s' }} />
    </div>
  )
}