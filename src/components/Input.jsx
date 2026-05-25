import { useState } from 'react'

export default function Input({ label, type = 'text', value, onChange, placeholder, step, min, max, required = false }) {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' && value !== null && value !== undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[#666666] font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-40" />
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          required={required}
          className={`w-full bg-[#111111] border text-[#e8e8e8] font-mono text-base px-4 h-12 outline-none transition-all duration-300 rounded-sm ${
            focused
              ? 'border-[#c8f500] shadow-[0_0_20px_rgba(200,245,0,0.12),_inset_0_0_12px_rgba(200,245,0,0.03)]'
              : hasValue
                ? 'border-[#333333]'
                : 'border-[#222222] hover:border-[#333333]'
          }`}
        />

        {/* Bottom glow bar */}
        <span className={`absolute left-2 right-2 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#c8f500] to-transparent transition-opacity duration-300 rounded-full ${focused ? 'opacity-60' : 'opacity-0'}`} />
      </div>
    </div>
  )
}