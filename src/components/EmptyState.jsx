const ICONS = {
  scale: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <rect x="8" y="16" width="32" height="24" rx="4" />
      <circle cx="24" cy="28" r="8" />
      <path d="M20 28h8" />
      <path d="M24 24v8" />
      <path d="M16 16V12a8 8 0 0116 0v4" />
    </svg>
  ),
  dumbbell: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <rect x="6" y="18" width="6" height="12" rx="1" />
      <rect x="36" y="18" width="6" height="12" rx="1" />
      <rect x="1" y="20" width="5" height="8" rx="1" />
      <rect x="42" y="20" width="5" height="8" rx="1" />
      <line x1="12" y1="24" x2="36" y2="24" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <path d="M6 16a4 4 0 014-4h4l3-4h14l3 4h4a4 4 0 014 4v18a4 4 0 01-4 4H10a4 4 0 01-4-4V16z" />
      <circle cx="24" cy="25" r="7" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <path d="M6 38h36" />
      <path d="M10 30l8-10 8 6 12-16" />
      <circle cx="10" cy="30" r="2" />
      <circle cx="18" cy="20" r="2" />
      <circle cx="26" cy="26" r="2" />
      <circle cx="38" cy="10" r="2" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <rect x="6" y="10" width="36" height="30" rx="4" />
      <line x1="6" y1="20" x2="42" y2="20" />
      <line x1="16" y1="6" x2="16" y2="14" />
      <line x1="32" y1="6" x2="32" y2="14" />
      <rect x="14" y="26" width="4" height="4" rx="0.5" />
      <rect x="22" y="26" width="4" height="4" rx="0.5" />
      <rect x="30" y="26" width="4" height="4" rx="0.5" />
    </svg>
  ),
  body: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <circle cx="24" cy="8" r="5" />
      <path d="M24 13v12" />
      <path d="M16 20l8 5 8-5" />
      <path d="M18 38l6-13 6 13" />
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <path d="M24 4L44 24L24 44L4 24Z" />
      <path d="M4 24h40" />
      <path d="M24 4l10 20-10 20-10-20z" />
    </svg>
  ),
}

const ICON_MAP = {
  '◇': 'diamond',
  '◈': 'diamond',
  '◆': 'dumbbell',
  '⬡': 'scale',
  '⬢': 'chart',
  '◎': 'body',
  '▣': 'body',
  '📷': 'camera',
}

export default function EmptyState({ message = 'sin datos', icon = '◇' }) {
  const svgIcon = ICONS[ICON_MAP[icon] || icon] || ICONS[icon] || ICONS.diamond

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative mb-4 text-[#c2c3c8]">
        {svgIcon}
        <div className="absolute inset-0 text-[#c8f500] opacity-[0.12] blur-md">
          {svgIcon}
        </div>
      </div>
      <p className="text-[#9a9ba2] font-sans text-xs tracking-[0.2em]">{message}</p>
    </div>
  )
}