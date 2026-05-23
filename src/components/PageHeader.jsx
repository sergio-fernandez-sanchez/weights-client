export default function PageHeader({ title, className = '', blink = false, home = false }) {
  return (
    <div className={`mb-6 animate-fade-in-up ${className}`}>
      <h1 className={`text-[#c8f500] font-mono font-bold tracking-widest whitespace-nowrap glow-text ${home ? 'text-3xl md:text-4xl cursor-blink' : 'text-3xl md:text-4xl'} ${blink ? 'cursor-blink' : ''}`}>
        {title}
      </h1>
      <p className="text-[#333333] font-mono text-sm mt-2">
        ────────────────────────────────
      </p>
    </div>
  )
}