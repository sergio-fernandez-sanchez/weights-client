import { createContext, useContext, useState, useEffect } from 'react'
import { getActivePhase } from '../api/client'

const PHASE_COLORS = { bulk: '#c8f500', cut: '#ff2d2d', maintenance: '#ff9f00' }
const DEFAULT_COLOR = '#c8f500'

const PhaseContext = createContext({
  activePhase: null,
  phaseColor: DEFAULT_COLOR,
  refreshPhase: () => {},
})

export function PhaseProvider({ children }) {
  const [activePhase, setActivePhase] = useState(null)

  async function refreshPhase() {
    try {
      const data = await getActivePhase()
      setActivePhase(data)
    } catch {}
  }

  useEffect(() => { refreshPhase() }, [])

  const phaseColor = activePhase
    ? (PHASE_COLORS[activePhase.phase_type] || DEFAULT_COLOR)
    : DEFAULT_COLOR

  return (
    <PhaseContext.Provider value={{ activePhase, phaseColor, refreshPhase }}>
      {children}
    </PhaseContext.Provider>
  )
}

export function usePhase() {
  return useContext(PhaseContext)
}

export { PHASE_COLORS }