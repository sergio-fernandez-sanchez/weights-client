import { useState } from 'react'

/**
 * Input — campo frosted iOS 26 (light). Texto en tinta, label con punto de
 * acento, línea de reflexión inferior en focus. API intacta.
 */
export default function Input({ label, type = 'text', value, onChange, placeholder, step, min, max, required = false }) {
  const [focused, setFocused] = useState(false)
  const isNumeric = type === 'number'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[#71727a] font-sans text-[10px] font-medium tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#c8f500] opacity-60" />
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
          className={`w-full input-frosted text-[#1d1d1f] ${isNumeric ? 'font-mono' : 'font-sans'} text-base px-4 h-12 outline-none rounded-sm transition-all duration-200`}
        />
        <span className={`absolute left-3 right-3 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#c8f500] to-transparent transition-opacity duration-300 ${focused ? 'opacity-50' : 'opacity-0'}`} />
      </div>
    </div>
  )
}
