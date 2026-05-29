export default function DonutChart({ segments, size = 140, strokeWidth = 18, className = '' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2, cy = size / 2
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  let offset = 0
  const arcs = segments.filter(s => s.value > 0).map((s, i) => {
    const pct = s.value / total
    const dash = circumference * pct
    const gap = circumference - dash
    const rotation = offset * 360
    offset += pct
    return { ...s, dash, gap, rotation, pct, index: i }
  })

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="chart-reveal" style={{ "--reveal-delay": "0.2s" }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeLinecap="round"
            transform={`rotate(${-90 + arc.rotation} ${cx} ${cy})`}

          />
        ))}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {segments[0] && (
          <>
            <span className="font-mono text-lg font-bold" style={{ color: segments[0].color }}>
              {segments[0].value.toFixed(1)}
            </span>
            <span className="text-[#444444] font-sans text-[8px] tracking-[0.15em]">{segments[0].label}</span>
          </>
        )}
      </div>
    </div>
  )
}