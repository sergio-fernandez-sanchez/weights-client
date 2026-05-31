// Deepens very-light accent colors (e.g. lime) so they stay legible as TEXT on
// the light background, while leaving already-dark colors (red/orange) intact.
function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
function toHex(r, g, b) {
  const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
export function readableOnLight(hex, threshold = 0.55) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return hex
  const { r, g, b } = hexToRgb(hex)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (lum <= threshold) return hex
  const factor = (0.42 / lum) * 0.95
  return toHex(r * factor, g * factor, b * factor)
}
