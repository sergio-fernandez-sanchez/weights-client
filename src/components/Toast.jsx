import { useState, useEffect } from 'react'

export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    setExiting(false)
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        setVisible(false)
        setExiting(false)
        onDone?.()
      }, 300)
    }, 2200)
    return () => clearTimeout(timer)
  }, [message])

  if (!visible || !message) return null

  const isError = type === 'error'
  const color = isError ? '#d92020' : '#5f8a00'

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9000] pointer-events-none font-sans text-sm font-bold tracking-wider"
      style={{
        transform: exiting
          ? 'translateX(-50%) translateY(12px) scale(0.95)'
          : 'translateX(-50%) translateY(0) scale(1)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="glass-tooltip px-5 py-3 rounded-sm relative overflow-hidden" style={{ color }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />
        {message}
      </div>
    </div>
  )
}