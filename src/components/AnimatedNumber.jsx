import { useState, useEffect, useRef } from 'react'

export default function AnimatedNumber({ value, decimals = 2, duration = 600, prefix = '', suffix = '', className = '', style = {} }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const frameRef = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to = typeof value === 'number' ? value : parseFloat(value) || 0
    if (from === to) { setDisplay(to); return }

    const start = performance.now()
    const diff = to - from

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + diff * eased
      setDisplay(current)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
        prevRef.current = to
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value, duration])

  return (
    <span className={`odometer-enter ${className}`} style={style}>
      {prefix}{typeof display === 'number' ? display.toFixed(decimals) : display}{suffix}
    </span>
  )
}