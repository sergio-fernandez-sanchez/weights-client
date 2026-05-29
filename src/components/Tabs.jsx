export default function Tabs({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 mb-4 p-1 rounded-sm ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,10,0.8) 0%, rgba(14,14,14,0.7) 100%)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.03)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
      }}>
      {options.map(([label, val]) => {
        const active = value === val
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`flex-1 h-8 font-sans text-[10px] font-bold tracking-[0.15em] transition-all duration-200 relative rounded-sm ${
              active
                ? 'text-[#0a0a0a]'
                : 'bg-transparent text-[#555555] hover:text-[#888888] hover:bg-[#ffffff04]'
            }`}
            style={active ? {
              background: 'linear-gradient(180deg, #d4ff1a 0%, #c8f500 100%)',
              boxShadow: '0 2px 8px rgba(200,245,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            } : undefined}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}