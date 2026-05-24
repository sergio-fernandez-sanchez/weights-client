// MetricCard con estética cyberpunk: label arriba, valor grande, sub opcional, accent vertical
export default function MetricCard({ label, value, sub, valueColor = '#c8f500' }) {
  return (
    <div className="relative bg-[#141414] border border-[#333333] p-4 transition-all duration-200 hover:border-[#444444]">
      {/* Corner brackets sutiles */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-[#444444]" />
      <span className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-[#444444]" />
      <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-[#444444]" />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-[#444444]" />

      {/* Barra lateral con color del valor */}
      <div className="absolute top-2 bottom-2 left-0 w-px" style={{ backgroundColor: valueColor, opacity: 0.4 }} />

      <div className="pl-2">
        <p className="text-[#666666] font-mono text-[10px] tracking-widest mb-1">{label}</p>
        <p className="font-mono text-xl font-bold leading-none" style={{ color: valueColor }}>{value}</p>
        {sub && <p className="text-[#666666] font-mono text-xs mt-2">{sub}</p>}
      </div>
    </div>
  )
}