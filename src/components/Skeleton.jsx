export function SkeletonLine({ width = '100%', height = '12px', className = '' }) {
  return (
    <div
      className={`rounded-sm ${className}`}
      style={{
        width, height,
        background: 'linear-gradient(90deg, #161616 25%, #1e1e1e 50%, #161616 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass-card rounded-sm p-4 ${className}`}>
      <SkeletonLine width="40%" height="10px" className="mb-3" />
      <SkeletonLine width="60%" height="22px" className="mb-3" />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <SkeletonLine key={i} width={`${70 + Math.random() * 30}%`} height="10px" className="mb-2" />
      ))}
    </div>
  )
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`glass-card rounded-sm p-4 ${className}`}>
      <SkeletonLine width="30%" height="10px" className="mb-3" />
      <div className="flex items-end gap-1 h-[120px]">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex-1 rounded-t-sm"
            style={{
              height: `${30 + Math.random() * 70}%`,
              background: 'linear-gradient(90deg, #161616 25%, #1e1e1e 50%, #161616 75%)',
              backgroundSize: '200% 100%',
              animation: `shimmer 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonMetricGrid({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="glass-card rounded-sm p-4">
          <SkeletonLine width="50%" height="8px" className="mb-2" />
          <SkeletonLine width="70%" height="20px" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <SkeletonLine width="60px" height="10px" className="mb-6" />
        <SkeletonLine width="45%" height="28px" className="mb-2" />
        <SkeletonLine width="30%" height="10px" className="mb-8" />
        <SkeletonCard className="mb-4" />
        <SkeletonMetricGrid className="mb-4" />
        <SkeletonChart />
      </div>
    </div>
  )
}