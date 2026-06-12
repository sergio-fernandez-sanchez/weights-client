// StrengthTriangle — triángulo de fuerza con zonas de color
// Muestra pecho (push) / piernas (legs) / espalda (pull)
// Normaliza por ratio 1RM/peso corporal vs estándares por sexo

// Ratios de referencia por nivel y grupo (1RM / peso corporal)
// Fuente: Symmetric Strength / ExRx, ajustado por grupo muscular
const STANDARDS = {
  male: {
    push:  { inicio: 0.50, novato: 0.75, medio: 1.00, avanzado: 1.25, elite: 1.50 },
    pull:  { inicio: 0.75, novato: 1.00, medio: 1.25, avanzado: 1.60, elite: 2.00 },
    legs:  { inicio: 0.75, novato: 1.00, medio: 1.25, avanzado: 1.50, elite: 2.00 },
  },
  female: {
    push:  { inicio: 0.25, novato: 0.40, medio: 0.60, avanzado: 0.80, elite: 1.00 },
    pull:  { inicio: 0.40, novato: 0.60, medio: 0.80, avanzado: 1.10, elite: 1.40 },
    legs:  { inicio: 0.50, novato: 0.70, medio: 0.90, avanzado: 1.15, elite: 1.50 },
  },
}

const LEVEL_ORDER  = ['inicio', 'novato', 'medio', 'avanzado', 'elite']
const LEVEL_LABELS = { inicio: 'INICIO', novato: 'NOVATO', medio: 'MEDIO', avanzado: 'AVANZADO', elite: 'ÉLITE' }
const LEVEL_COLORS = {
  inicio:   { stroke: 'rgba(209,32,32,.22)',   fill: 'rgba(209,32,32,.10)',   text: '#d92020',  badge: 'rgba(209,32,32,.12)',  border: 'rgba(209,32,32,.25)'  },
  novato:   { stroke: 'rgba(184,116,0,.22)',   fill: 'rgba(184,116,0,.10)',   text: '#b87400',  badge: 'rgba(184,116,0,.12)',  border: 'rgba(184,116,0,.25)'  },
  medio:    { stroke: 'rgba(164,196,0,.22)',   fill: 'rgba(164,196,0,.09)',   text: '#5f8a00',  badge: 'rgba(164,196,0,.12)',  border: 'rgba(164,196,0,.25)'  },
  avanzado: { stroke: 'rgba(58,157,78,.22)',   fill: 'rgba(58,157,78,.09)',   text: '#3a9d4e',  badge: 'rgba(58,157,78,.12)',  border: 'rgba(58,157,78,.25)'  },
  elite:    { stroke: 'rgba(120,80,255,.20)',  fill: 'rgba(120,80,255,.06)',  text: '#7850ff',  badge: 'rgba(120,80,255,.12)', border: 'rgba(120,80,255,.25)' },
}

function oneRM(log) {
  if (log.weight && log.reps) return parseFloat(log.weight) * (1 + parseInt(log.reps) / 30)
  if (log.weight) return parseFloat(log.weight)
  return null
}

function getLevel(ratio, group, sex) {
  const std = STANDARDS[sex]?.[group] || STANDARDS.male[group]
  if (ratio >= std.elite)    return 'elite'
  if (ratio >= std.avanzado) return 'avanzado'
  if (ratio >= std.medio)    return 'medio'
  if (ratio >= std.novato)   return 'novato'
  return 'inicio'
}

function overallLevel(levels) {
  const scores = levels.map(l => LEVEL_ORDER.indexOf(l)).filter(s => s >= 0)
  if (scores.length === 0) return null
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  return LEVEL_ORDER[avg]
}

// Triángulo equilátero: top=pecho, bottom-left=piernas, bottom-right=espalda
// Vértices normalizados para viewBox 0 0 280 250
const CX = 140, CY = 120
const R  = 100  // radio exterior (élite = 100%)

function triVertex(angleFromTop, pct) {
  const angle = (angleFromTop - 90) * (Math.PI / 180)
  return {
    x: CX + R * pct * Math.cos(angle),
    y: CY + R * pct * Math.sin(angle),
  }
}

// Los tres ejes: pecho = arriba (270°), piernas = abajo-izq (30°), espalda = abajo-der (150°)
const AXES = { push: 270, legs: 30, pull: 150 }

function zonePolygon(pct) {
  const p = ['push', 'legs', 'pull'].map(g => triVertex(AXES[g], pct))
  return p.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')
}

export default function StrengthTriangle({ logs, bodyWeight, sex = 'male' }) {
  if (!logs || logs.length === 0 || !bodyWeight) return null

  const bw = parseFloat(bodyWeight)
  if (!bw || bw <= 0) return null

  // Para cada grupo: máximo 1RM entre todos los ejercicios de esa categoría
  function bestForGroup(cat) {
    const catLogs = logs.filter(l => l.category === cat && l.weight)
    if (catLogs.length === 0) return null
    let best = null
    catLogs.forEach(l => {
      const rm = oneRM(l)
      if (rm && (!best || rm > best.rm)) best = { rm, name: l.name }
    })
    return best
  }

  const push = bestForGroup('push')
  const pull = bestForGroup('pull')
  const legs = bestForGroup('legs')

  // Si no hay datos suficientes para al menos 2 grupos, no mostrar
  const hasGroups = [push, pull, legs].filter(Boolean).length
  if (hasGroups < 2) return null

  function ratioAndLevel(best, group) {
    if (!best) return { ratio: 0, pct: 0, level: null }
    const ratio = best.rm / bw
    const std   = STANDARDS[sex]?.[group] || STANDARDS.male[group]
    const pct   = Math.min(1, ratio / std.elite) // normalizado al 100% = élite
    const level = getLevel(ratio, group, sex)
    return { ratio: parseFloat(ratio.toFixed(2)), pct, level }
  }

  const pushData = ratioAndLevel(push, 'push')
  const pullData = ratioAndLevel(pull, 'pull')
  const legsData = ratioAndLevel(legs, 'legs')

  const overall = overallLevel([pushData.level, pullData.level, legsData.level].filter(Boolean))
  const overallColor = overall ? LEVEL_COLORS[overall] : null

  // Puntos del triángulo del usuario
  const pushPt = triVertex(AXES.push, pushData.pct || 0)
  const legsPt = triVertex(AXES.legs, legsData.pct || 0)
  const pullPt = triVertex(AXES.pull, pullData.pct || 0)
  const userPoly = `${pushPt.x.toFixed(1)},${pushPt.y.toFixed(1)} ${legsPt.x.toFixed(1)},${legsPt.y.toFixed(1)} ${pullPt.x.toFixed(1)},${pullPt.y.toFixed(1)}`

  // Vértices exteriores para labels (un poco más afuera)
  const pushLabel = triVertex(AXES.push, 1.18)
  const legsLabel = triVertex(AXES.legs, 1.18)
  const pullLabel = triVertex(AXES.pull, 1.18)

  const ZONES = [1, 0.8, 0.6, 0.4, 0.2]
  const ZONE_LEVELS = ['elite', 'avanzado', 'medio', 'novato', 'inicio']

  function GroupChip({ label, data, best }) {
    if (!data.level) return (
      <div style={{ background: 'rgba(70,80,115,.06)', border: '1px solid rgba(70,80,115,.12)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#8a8c94', letterSpacing: '.1em', marginBottom: 4 }}>{label}</p>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: '#8a8c94' }}>—</p>
        <p style={{ fontSize: 8, color: '#8a8c94', marginTop: 2 }}>sin datos</p>
      </div>
    )
    const c = LEVEL_COLORS[data.level]
    return (
      <div style={{ background: c.badge, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#5e6068', letterSpacing: '.1em', marginBottom: 4 }}>{label}</p>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700, color: c.text, lineHeight: 1 }}>{data.ratio}×</p>
        <p style={{ fontSize: 8, color: '#8a8c94', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {best?.name?.toLowerCase() || ''}
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', marginTop: 5, padding: '2px 7px', borderRadius: 999, background: c.badge, border: `1px solid ${c.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fontWeight: 700, color: c.text, letterSpacing: '.08em' }}>
          {LEVEL_LABELS[data.level]}
        </span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '16px 14px 14px', marginBottom: 20 }}
      className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: '#5e6068' }}>
          COMPOSICIÓN DE FUERZA
        </p>
        {overall && overallColor && (
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: overallColor.badge, border: `1px solid ${overallColor.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: overallColor.text, letterSpacing: '.1em' }}>
            {LEVEL_LABELS[overall]}
          </span>
        )}
      </div>

      {/* SVG Triángulo */}
      <svg viewBox="0 0 280 250" style={{ width: '100%', display: 'block', maxWidth: 280, margin: '0 auto' }}>
        {/* Zonas de color (de exterior a interior) */}
        {ZONES.map((pct, i) => {
          const c = LEVEL_COLORS[ZONE_LEVELS[i]]
          return <polygon key={i} points={zonePolygon(pct)} fill={c.fill} stroke={c.stroke} strokeWidth="0.8" />
        })}

        {/* Ejes */}
        {['push', 'legs', 'pull'].map(g => {
          const outer = triVertex(AXES[g], 1)
          return <line key={g} x1={CX} y1={CY} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="rgba(70,80,115,.18)" strokeWidth="1" />
        })}

        {/* Triángulo del usuario */}
        <polygon points={userPoly}
          fill="rgba(95,138,0,.2)" stroke="#5f8a00" strokeWidth="2.5" strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 5px rgba(95,138,0,.3))' }} />

        {/* Puntos */}
        {[pushPt, legsPt, pullPt].map((pt, i) => (
          <circle key={i} cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)} r="5" fill="#5f8a00" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" />
        ))}

        {/* Valores de ratio en los puntos */}
        {[
          { pt: pushPt, val: pushData.ratio, anchor: 'middle', dy: -10 },
          { pt: legsPt, val: legsData.ratio, anchor: 'end',    dy: 14 },
          { pt: pullPt, val: pullData.ratio, anchor: 'start',  dy: 14 },
        ].map((item, i) => item.val > 0 && (
          <text key={i}
            x={item.pt.x.toFixed(1)}
            y={(item.pt.y + item.dy).toFixed(1)}
            textAnchor={item.anchor}
            fill="#5f8a00" fontSize="8" fontFamily="'JetBrains Mono',monospace" fontWeight="700">
            {item.val}×
          </text>
        ))}

        {/* Labels de vértices */}
        <text x={pushLabel.x.toFixed(1)} y={(pushLabel.y - 2).toFixed(1)} textAnchor="middle" fill="#41434a" fontSize="10" fontFamily="'JetBrains Mono',monospace" fontWeight="700">PECHO</text>
        <text x={legsLabel.x.toFixed(1)} y={(legsLabel.y + 4).toFixed(1)} textAnchor="end"   fill="#41434a" fontSize="10" fontFamily="'JetBrains Mono',monospace" fontWeight="700">PIERNAS</text>
        <text x={pullLabel.x.toFixed(1)} y={(pullLabel.y + 4).toFixed(1)} textAnchor="start" fill="#41434a" fontSize="10" fontFamily="'JetBrains Mono',monospace" fontWeight="700">ESPALDA</text>

        {/* Leyenda de niveles */}
        {ZONE_LEVELS.slice().reverse().map((lvl, i) => {
          const c = LEVEL_COLORS[lvl]
          return (
            <g key={lvl}>
              <rect x="6" y={160 + i * 12} width="6" height="6" fill={c.badge} stroke={c.border} strokeWidth="0.5" rx="1" />
              <text x="15" y={166 + i * 12} fill={c.text} fontSize="7" fontFamily="'JetBrains Mono',monospace">{LEVEL_LABELS[lvl]}</text>
            </g>
          )
        })}
      </svg>

      {/* Chips por grupo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 6 }}>
        <GroupChip label="PECHO"   data={pushData} best={push} />
        <GroupChip label="PIERNAS" data={legsData} best={legs} />
        <GroupChip label="ESPALDA" data={pullData} best={pull} />
      </div>
      <p style={{ fontSize: 9, color: '#8a8c94', textAlign: 'center', marginTop: 10 }}>
        ratio 1RM / peso corporal · mejor ejercicio por grupo
      </p>
    </div>
  )
}
