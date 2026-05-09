export default function PageHeader({ title, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-[#c8f500] font-mono text-3xl md:text-4xl font-bold tracking-widest">
        {title}
      </h1>
      <p className="text-[#333333] font-mono text-sm mt-2">
        ────────────────────────────────
      </p>
    </div>
  )
}