import { useState } from 'react'

export default function Input({ label, type = 'text', value, onChange, placeholder, step, min, max, required = false }) {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' && value !== null && value !== undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[#666666] font-sans text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
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
          className={`w-full input-frosted text-[#e8e8e8] font-sans text-base px-4 h-12 outline-none rounded-sm ${
            focused
              ? 'border-[#c8f500]/30 shadow-[0_0_0_3px_rgba(200,245,0,0.06),0_0_20px_rgba(200,245,0,0.08)]'
              : hasValue
                ? 'border-[#ffffff08]'
                : ''
          }`}
        />
        {/* Bottom reflection line */}
        <span className={`absolute left-3 right-3 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#c8f500] to-transparent transition-opacity duration-300 ${focused ? 'opacity-40' : 'opacity-0'}`} />
      </div>
    </div>
  )
}