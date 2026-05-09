export default function Button({ children, onClick, type = 'button', disabled = false, variant = 'primary' }) {
  const base = 'h-14 font-mono font-bold text-base tracking-widest transition-colors disabled:opacity-50 w-full'
  const variants = {
    primary: 'bg-[#c8f500] text-[#0a0a0a] border border-[#c8f500] hover:bg-[#0a0a0a] hover:text-[#c8f500]',
    secondary: 'bg-[#141414] text-[#e8e8e8] border border-[#333333] hover:bg-[#1f1f1f] text-left px-6',
    ghost: 'bg-transparent text-[#888888] border-none hover:text-[#c8f500] h-auto font-normal text-xs tracking-normal',
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
