export default function EmptyState({ message = 'sin datos', icon = '◇' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative mb-4">
        <span className="text-[#1a1a1a] text-5xl font-mono select-none">{icon}</span>
        <span className="absolute inset-0 text-5xl font-mono select-none text-[#c8f500] opacity-10 blur-sm">{icon}</span>
      </div>
      <p className="text-[#333333] font-mono text-xs tracking-[0.2em]">{message}</p>
    </div>
  )
}