import { usePhase } from '../context/PhaseContext'

/**
 * Fondo global (light · iOS 26):
 *   · base luminosa + wash blanco superior
 *   · aurora ribbons (3 cintas de color que ondulan lento)
 *   · HUD radar (anillos concéntricos centrados) con respiración sutil (4.0s)
 *
 * Todo vive detrás del contenido (z-0) para que el liquid glass de las cards
 * lo refracte al pasar. Los estilos y animaciones están en index.css.
 *
 * El color de los ribbons se mantiene fijo (multicolor) pero teñimos el primer
 * ribbon con el color de fase activo para dar identidad sutil a cada modo.
 */
export default function ParticleBackground() {
  const { phaseColor } = usePhase()

  return (
    <div className="aurora-stage" aria-hidden="true">
      <div className="aurora-base" />
      <div
        className="aurora-ribbon r1"
        style={{
          background: `linear-gradient(90deg, transparent, ${phaseColor}80, rgba(120,200,255,0.45), transparent)`,
        }}
      />
      <div className="aurora-ribbon r2" />
      <div className="aurora-ribbon r3" />
      <div className="hud-radar" />
      <div className="aurora-wash" />
    </div>
  )
}
