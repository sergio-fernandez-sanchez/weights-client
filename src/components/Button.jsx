export default function Button({ children, onClick, type = 'button', disabled = false, variant = 'primary' }) {
  const base = 'group relative h-14 font-mono font-bold text-base tracking-widest transition-all duration-200 disabled:opacity-50 w-full overflow-hidden'

  const variants = {
    primary:   'bg-[#c8f500] text-[#0a0a0a] border border-[#c8f500] hover:bg-[#0a0a0a] hover:text-[#c8f500] btn-glow',
    secondary: 'bg-[#141414] text-[#e8e8e8] border border-[#333333] hover:border-[#c8f500] hover:text-[#c8f500] text-left px-6',
    ghost:     'bg-transparent text-[#888888] border-none hover:text-[#c8f500] h-auto font-normal text-xs tracking-normal',
  }

  // Corner brackets para secondary
  const showBrackets = variant === 'secondary' && !disabled

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} hover-lift click-press`}
    >
      {/* Corner brackets */}
      {showBrackets && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#c8f500] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <span className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#c8f500] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#c8f500] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#c8f500] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </>
      )}

      {/* Scan line on hover */}
      {variant === 'secondary' && !disabled && (
        <span className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8f500] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300"
              style={{ top: '50%' }} />
      )}

      <span className="relative z-10">{children}</span>
    </button>
  )
}