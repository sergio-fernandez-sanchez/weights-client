export default function Separator({ className = '', accent = false }) {
  return (
    <div className={`relative ${className}`}>
      <div className="glass-separator" />
      {accent && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="block w-1.5 h-1.5 rotate-45 bg-[#c8f500] shadow-[0_0_8px_rgba(200,245,0,0.3)]" />
        </div>
      )}
    </div>
  )
}