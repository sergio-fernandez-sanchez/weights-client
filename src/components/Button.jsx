export default function Button({ children, onClick, type = 'button', disabled = false, variant = 'primary' }) {
  const base = 'h-14 font-mono font-bold text-base tracking-widest transition-all duration-200 disabled:opacity-50 w-full hover-lift click-press relative'
  const variants = {
    primary:   'bg-[#c8f500] text-[#0a0a0a] border border-[#c8f500] hover:bg-[#0a0a0a] hover:text-[#c8f500] btn-glow',
    secondary: 'bg-[#141414] text-[#e8e8e8] border border-[#333333] hover:bg-[#1f1f1f] hover:border-[#c8f500] hover:text-[#c8f500] hover:shadow-[0_0_16px_rgba(200,245,0,0.15)] text-left px-6',
    ghost:     'bg-transparent text-[#888888] border-none hover:text-[#c8f500] h-auto font-normal text-xs tracking-normal',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  )
}