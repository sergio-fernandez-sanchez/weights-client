// Componente reutilizable de tabs/filtros con estética cyberpunk
// Uso:
//   <Tabs options={[['LABEL', 'value']]} value={current} onChange={setVal} />

export default function Tabs({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-0 mb-4 ${className}`}>
      {options.map(([label, val], i) => {
        const active = value === val
        const isFirst = i === 0
        const isLast  = i === options.length - 1
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`flex-1 h-9 font-mono text-[10px] font-bold tracking-[0.15em] transition-all duration-200 relative ${
              active
                ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500] z-10'
                : 'bg-[#141414] text-[#666666] border-[#333333] hover:border-[#c8f500] hover:text-[#c8f500]'
            }`}
            style={{
              borderTop:    '1px solid',
              borderBottom: '1px solid',
              borderLeft:   isFirst ? '1px solid' : 'none',
              borderRight:  '1px solid',
            }}
          >
            {active && (
              <>
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-[#0a0a0a]" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-[#0a0a0a]" />
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px]">▸</span>
              </>
            )}
            {label}
          </button>
        )
      })}
    </div>
  )
}