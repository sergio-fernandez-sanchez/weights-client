import { useState } from 'react'

export default function Input({ label, type = 'text', value, onChange, placeholder, step, min, max, required = false }) {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' && value !== null && value !== undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[#888888] font-mono text-xs tracking-widest flex items-center gap-2">
          <span className="text-[#c8f500] opacity-60">▸</span>
          {label}
        </label>
      )}
      <div className="relative group">
        {/* Corner brackets */}
        <span className={`absolute top-0 left-0 w-2 h-2 border-l border-t transition-all duration-200 ${focused ? 'border-[#c8f500] opacity-100' : 'border-[#333333] opacity-0 group-hover:opacity-100'}`} />
        <span className={`absolute top-0 right-0 w-2 h-2 border-r border-t transition-all duration-200 ${focused ? 'border-[#c8f500] opacity-100' : 'border-[#333333] opacity-0 group-hover:opacity-100'}`} />
        <span className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b transition-all duration-200 ${focused ? 'border-[#c8f500] opacity-100' : 'border-[#333333] opacity-0 group-hover:opacity-100'}`} />
        <span className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b transition-all duration-200 ${focused ? 'border-[#c8f500] opacity-100' : 'border-[#333333] opacity-0 group-hover:opacity-100'}`} />

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
          className={`w-full bg-[#141414] border text-[#e8e8e8] font-mono text-base px-4 h-12 outline-none transition-all duration-200 ${
            focused
              ? 'border-[#c8f500] shadow-[0_0_16px_rgba(200,245,0,0.2)]'
              : hasValue
                ? 'border-[#444444]'
                : 'border-[#333333]'
          }`}
        />

        {/* Active indicator bar */}
        <span className={`absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c8f500] to-transparent transition-opacity duration-300 ${focused ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  )
}