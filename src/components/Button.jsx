import { haptic } from '../utils/haptic'

/**
 * Button — tres variantes coherentes iOS 26:
 *   primary   → btn-liquid (CTA lima glossy)
 *   secondary → glass-card con hover-lift y barra de acento
 *   ghost     → texto con hover de acento
 * API y comportamiento intactos.
 */
export default function Button({ children, onClick, type = 'button', disabled = false, variant = 'primary' }) {
  const base = 'group relative font-sans font-semibold tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none w-full overflow-hidden rounded-sm flex items-center click-press'

  const variants = {
    primary:   'h-14 text-[#2a3a00] text-sm btn-liquid justify-center',
    secondary: 'h-13 text-[#41434a] text-sm px-5 glass-card glass-sheen card-hover justify-between',
    ghost:     'bg-transparent text-[#71727a] border-none hover:text-[#5f8a00] h-auto font-normal text-xs tracking-normal justify-center py-2',
  }

  return (
    <button
      type={type}
      onClick={e => { haptic(variant === 'primary' ? 'medium' : 'light'); onClick?.(e) }}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      <span className="relative z-10 flex items-center gap-2 group-hover:text-[#5f8a00] transition-colors">
        {children}
      </span>
      {variant === 'secondary' && (
        <span className="relative z-10 text-[#a8a9b0] group-hover:text-[#5f8a00] transition-colors duration-200">›</span>
      )}
    </button>
  )
}
