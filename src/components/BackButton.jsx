export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[#888888] font-mono text-sm hover:text-[#c8f500] hover:translate-x-[-3px] transition-all duration-200 mb-6 click-press"
    >
      ← VOLVER
    </button>
  )
}