export default function HomeHeader({ onNavigate }) {
  return (
    <div className="mb-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-[#c8f500] font-mono text-3xl md:text-4xl font-bold tracking-widest whitespace-nowrap glow-text cursor-blink">
          // W E I G H T S
        </h1>
        <button
          onClick={() => onNavigate('profile')}
          className="text-[#444444] hover:text-[#c8f500] transition-colors ml-4 flex-shrink-0"
          title="Perfil"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
      </div>
      <p className="text-[#333333] font-mono text-sm mt-2">
        ────────────────────────────────
      </p>
    </div>
  )
}