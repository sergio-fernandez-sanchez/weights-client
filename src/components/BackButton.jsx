export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[#888888] font-mono text-sm hover:text-[#c8f500] transition-colors mb-6"
    >
      ← VOLVER
    </button>
  )
}
