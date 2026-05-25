export default function Separator({ className = '', accent = false }) {
  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
      <span
        className="w-1.5 h-1.5 rotate-45"
        style={{
          backgroundColor: accent ? '#c8f500' : '#2a2a2a',
          boxShadow: accent ? '0 0 8px rgba(200,245,0,0.3)' : 'none',
        }}
      />
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
    </div>
  )
}