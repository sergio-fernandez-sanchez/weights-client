export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 text-[#71727a] font-sans text-xs hover:text-[#5f8a00] transition-colors duration-200 mb-6 click-press"
    >
      <span className="inline-flex items-center justify-center w-7 h-7 glass-pill group-hover:border-[#c8f500]/30 transition-all duration-200">
        <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
      </span>
      <span className="tracking-widest font-medium">VOLVER</span>
    </button>
  )
}
