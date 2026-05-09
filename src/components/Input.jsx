export default function Input({ label, type = 'text', value, onChange, placeholder, step, required = false }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[#888888] font-mono text-sm">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        required={required}
        className="bg-[#141414] border border-[#333333] text-[#e8e8e8] font-mono text-base px-4 h-12 outline-none focus:border-[#c8f500] transition-colors"
      />
    </div>
  )
}