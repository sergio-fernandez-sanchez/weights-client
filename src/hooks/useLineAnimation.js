import { useEffect, useRef } from 'react'

export default function useLineAnimation(duration = 1500) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const polylines = svg.querySelectorAll('polyline[data-animate]')
    const polygons = svg.querySelectorAll('polygon[data-animate]')
    const circles = svg.querySelectorAll('circle[data-animate]')

    polylines.forEach(line => {
      const length = line.getTotalLength?.() || 1000
      line.style.strokeDasharray = length
      line.style.strokeDashoffset = length
      line.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
      requestAnimationFrame(() => {
        line.style.strokeDashoffset = '0'
      })
    })

    polygons.forEach(poly => {
      poly.style.opacity = '0'
      poly.style.transition = `opacity ${duration * 0.6}ms ease ${duration * 0.3}ms`
      requestAnimationFrame(() => {
        poly.style.opacity = '1'
      })
    })

    circles.forEach((circle, i) => {
      circle.style.opacity = '0'
      circle.style.transform = 'scale(0)'
      circle.style.transformOrigin = 'center'
      circle.style.transformBox = 'fill-box'
      circle.style.transition = `opacity 300ms ease ${duration * 0.5 + i * 60}ms, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${duration * 0.5 + i * 60}ms`
      requestAnimationFrame(() => {
        circle.style.opacity = '1'
        circle.style.transform = 'scale(1)'
      })
    })
  }, [duration])

  return svgRef
}