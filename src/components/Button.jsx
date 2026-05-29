import { haptic } from '../utils/haptic'

export default function Button({ children, onClick, type = 'button', disabled = false, variant = 'primary' }) {
  const base = 'group relative font-sans font-bold tracking-widest transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none w-full overflow-hidden rounded-sm flex items-center'

  const variants = {
    primary:   'h-14 bg-[#c8f500] text-[#0a0a0a] border border-[#c8f500] hover:bg-[#deff33] text-base btn-glow justify-center',
    secondary: 'h-13 bg-transparent text-[#999999] border border-[#252525] hover:border-[#c8f500] hover:text-[#c8f500] text-sm px-5',
    ghost:     'bg-transparent text-[#555555] border-none hover:text-[#c8f500] h-auto font-normal text-xs tracking-normal justify-center',
  }

  return (
    <button
      type={type}
      onClick={e => { haptic(variant === "primary" ? "medium" : "light"); onClick?.(e) }}
      disabled={disabled}
      className={`${base} ${variants[variant]} click-press`}
    >
      {/* Left accent bar on hover — secondary only */}
      {variant === 'secondary' && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c8f500] opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-r-sm" />
      )}

      {/* Scan line on hover — secondary */}
      {variant === 'secondary' && !disabled && (
        <span
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8f500] to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          style={{ top: '50%' }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {variant === 'secondary' && (
          <span className="text-[#333333] group-hover:text-[#c8f500] transition-colors duration-200">›</span>
        )}
        {children}
      </span>
    </button>
  )
}