import { useEffect, useRef } from 'react'
import { usePhase } from '../context/PhaseContext'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const { phaseColor } = usePhase()
  const colorRef = useRef(phaseColor)
  const scrollRef = useRef(0)

  useEffect(() => { colorRef.current = phaseColor }, [phaseColor])

  useEffect(() => {
    function onScroll() { scrollRef.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particleCount = window.innerWidth < 600 ? 55 : 90
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.5 + 0.1,
      depth: Math.random() * 0.5 + 0.5,
    }))

    function animate() {
      const { r, g, b } = hexToRgb(colorRef.current)
      const scrollOffset = scrollRef.current * 0.02

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Subtle phase-colored radial glow
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.1, 0,
        canvas.width * 0.2, canvas.height * 0.1, canvas.width * 0.7
      )
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.03)`)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Parallax offset based on scroll and particle depth
        const parallaxY = scrollOffset * p.depth
        const drawY = ((p.y - parallaxY) % canvas.height + canvas.height) % canvas.height

        ctx.beginPath()
        ctx.arc(p.x, drawY, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i], pj = particles[j]
          const piY = ((pi.y - scrollOffset * pi.depth) % canvas.height + canvas.height) % canvas.height
          const pjY = ((pj.y - scrollOffset * pj.depth) % canvas.height + canvas.height) % canvas.height
          const dx = pi.x - pj.x
          const dy = piY - pjY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(pi.x, piY)
            ctx.lineTo(pj.x, pjY)
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.09 * (1 - dist / 130)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}