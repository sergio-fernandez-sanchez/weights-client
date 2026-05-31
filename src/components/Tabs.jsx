import { useEffect, useRef, useState } from 'react'

/**
 * Tabs — segmented control iOS 26 (light).
 * Track translúcido con inset suave; indicador deslizante de cristal blanco
 * que se anima con la curva estándar. Sin cambiar API ni datos.
 */
export default function Tabs({ options, value, onChange, className = '' }) {
  const containerRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const update = () => {
      const idx = options.findIndex(([, v]) => v === value)
      if (idx === -1) return
      const btns = containerRef.current.querySelectorAll('[data-tab]')
      const el = btns[idx]
      if (!el) return
      const cRect = containerRef.current.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      setIndicator({ left: r.left - cRect.left, width: r.width, opacity: 1 })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [value, options])

  return (
    <div
      ref={containerRef}
      className={`relative flex gap-0 mb-4 p-1 rounded-full ${className}`}
      style={{
        background: 'rgba(70, 80, 115, 0.08)',
        backdropFilter: 'blur(16px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
        border: '0.5px solid rgba(255,255,255,0.5)',
        boxShadow: 'inset 0 1px 2px rgba(70,80,115,0.12), inset 0 0.5px 0 rgba(255,255,255,0.5)',
      }}
    >
      <div
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.opacity,
          background: 'rgba(255, 255, 255, 0.92)',
          border: '0.5px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 8px rgba(70,80,115,0.2), inset 0 0.5px 0 rgba(255,255,255,1)',
          transition: 'left 0.32s cubic-bezier(0.32,0.72,0,1), width 0.32s cubic-bezier(0.32,0.72,0,1)',
        }}
      />
      {options.map(([label, val]) => {
        const active = value === val
        return (
          <button
            key={val}
            data-tab
            onClick={() => onChange(val)}
            className={`relative z-[1] flex-1 h-8 font-sans text-[10px] font-semibold tracking-[0.15em] uppercase rounded-full transition-colors duration-200 ${
              active ? 'text-[#5f8a00]' : 'text-[#71727a]'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
