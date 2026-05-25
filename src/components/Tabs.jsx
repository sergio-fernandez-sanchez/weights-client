export default function Tabs({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 mb-4 p-1 bg-[#0e0e0e] rounded-sm border border-[#1a1a1a] ${className}`}>
      {options.map(([label, val]) => {
        const active = value === val
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`flex-1 h-8 font-mono text-[10px] font-bold tracking-[0.15em] transition-all duration-200 relative rounded-sm ${
              active
                ? 'bg-[#c8f500] text-[#0a0a0a] shadow-[0_0_12px_rgba(200,245,0,0.2)]'
                : 'bg-transparent text-[#555555] hover:text-[#888888] hover:bg-[#161616]'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}