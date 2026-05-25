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
  const color = isError ? '#ff2d2d' : '#c8f500'

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9000] pointer-events-none font-mono text-sm font-bold tracking-wider"
      style={{
        transform: exiting
          ? 'translateX(-50%) translateY(12px)'
          : 'translateX(-50%) translateY(0)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}
    >
      <div
        className="px-5 py-3 rounded-sm relative overflow-hidden"
        style={{
          backgroundColor: '#0e0e0e',
          border: `1px solid ${color}30`,
          color,
          boxShadow: `0 0 24px ${color}20, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
        {message}
      </div>
    </div>
  )
}