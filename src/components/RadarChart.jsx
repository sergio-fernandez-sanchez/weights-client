export default function RadarChart({ data, size = 260, className = '' }) {
  if (!data || data.length < 3) return null

  const cx = size / 2, cy = size / 2
  const radius = size / 2 - 30
  const levels = 4
  const n = data.length
  const maxVal = Math.max(...data.map(d => d.value), 1)

  function polarToCart(angle, r) {
    const a = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  const angleStep = 360 / n

  // Grid
  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const r = (radius / levels) * (i + 1)
    const points = Array.from({ length: n }, (_, j) => {
      const p = polarToCart(j * angleStep, r)
      return `${p.x},${p.y}`
    }).join(' ')
    return { r, points }
  })

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const p = polarToCart(i * angleStep, radius)
    return { x1: cx, y1: cy, x2: p.x, y2: p.y }
  })

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.value / maxVal) * radius
    return polarToCart(i * angleStep, r)
  })
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Labels
  const labels = data.map((d, i) => {
    const p = polarToCart(i * angleStep, radius + 16)
    return { ...d, x: p.x, y: p.y }
  })

  return (
    <div className={`flex justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="chart-fade-up" style={{ "--reveal-delay": "0.15s" }}>
        {/* Grid */}
        {gridLevels.map((level, i) => (
          <polygon key={i} points={level.points} fill="none" stroke="#1a1a1a" strokeWidth="1" />
        ))}
        {/* Axes */}
        {axes.map((axis, i) => (
          <line key={i} x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2} stroke="#1a1a1a" strokeWidth="1" />
        ))}
        {/* Data fill */}
        <polygon points={dataPolygon} fill="rgba(200,245,0,0.08)" stroke="none"
          />
        {/* Data outline */}
        <polygon points={dataPolygon} fill="none" stroke="#c8f500" strokeWidth="1.5" strokeLinejoin="round"
          />
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c8f500"
            />
        ))}
        {/* Labels */}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central"
            fill="#555555" fontSize="9" fontFamily="Inter, sans-serif"
           >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  )
}