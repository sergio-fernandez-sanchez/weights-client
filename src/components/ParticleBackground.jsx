import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const burstsRef = useRef([])

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

    // Partículas base más visibles
    const particleCount = window.innerWidth < 600 ? 50 : 90
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.6,
      opacity: Math.random() * 0.6 + 0.25,
    }))

    // Listener para clicks/taps — crea ráfagas de partículas
    function handleInteraction(e) {
      const x = e.touches ? e.touches[0].clientX : e.clientX
      const y = e.touches ? e.touches[0].clientY : e.clientY
      
      for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15 + (Math.random() * 0.5)
        const speed = Math.random() * 3 + 1.5
        burstsRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2 + 1,
          life: 1,
          decay: Math.random() * 0.015 + 0.01,
        })
      }
    }

    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)

    function animate() {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      const bursts = burstsRef.current

      // Render partículas base
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 245, 0, ${p.opacity})`
        ctx.fill()
      })

      // Líneas conectando partículas cercanas — más visibles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(200, 245, 0, ${0.18 * (1 - dist / 140)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Render bursts (ráfagas de click)
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        b.x += b.vx
        b.y += b.vy
        b.vx *= 0.96
        b.vy *= 0.96
        b.life -= b.decay

        if (b.life <= 0) {
          bursts.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(b.x, b.y, b.size * b.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 245, 0, ${b.life * 0.9})`
        ctx.fill()

        // Glow alrededor
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.size * b.life * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 245, 0, ${b.life * 0.15})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
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