import { useState, useEffect } from 'react'
import { login, register } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import Tabs from '../components/Tabs'

const BOOT_LINES = [
  '> initializing weights v1.0...',
  '> loading tracking modules...',
  '> connecting to server...',
  '> system ready_',
]

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [bootStep, setBootStep] = useState(0)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    if (bootStep < BOOT_LINES.length) {
      const timer = setTimeout(() => setBootStep(s => s + 1), 400)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setBooted(true), 300)
      return () => clearTimeout(timer)
    }
  }, [bootStep])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        onLogin()
      } else {
        await register(email, password)
        setSuccess('✓  cuenta creada, inicia sesión')
        setMode('login')
        setPassword('')
      }
    } catch {
      setError(mode === 'login' ? '✗  credenciales incorrectas' : '✗  error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      {/* Boot sequence */}
      {!booted && (
        <div className="mb-8">
          {BOOT_LINES.slice(0, bootStep).map((line, i) => (
            <p key={i} className="text-[#333333] font-mono text-[11px] leading-relaxed overflow-hidden"
              style={{
                animation: `fadeInUp 0.3s ease-out forwards`,
                animationDelay: `${i * 0.05}s`,
              }}>
              <span className={i === bootStep - 1 ? 'text-[#c8f500]' : 'text-[#2a2a2a]'}>{line}</span>
            </p>
          ))}
        </div>
      )}

      {/* Main content — fades in after boot */}
      <div style={{
        opacity: booted ? 1 : 0,
        transform: booted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <PageHeader title="W E I G H T S" blink sub="tracking de peso & rendimiento" />

        <Tabs options={[['INICIAR SESIÓN', 'login'], ['REGISTRARSE', 'register']]} value={mode} onChange={(m) => { setMode(m); setError(''); setSuccess('') }} className="mb-6" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input required label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input required label="CONTRASEÑA" type="password" value={password} onChange={e => setPassword(e.target.value)} />

          {error && <p className="text-[#ff4444] font-sans text-sm animate-slide-down">{error}</p>}
          {success && <p className="text-[#c8f500] font-sans text-sm animate-slide-down">{success}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
          </Button>
        </form>

        <Separator className="mt-12 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
      </div>
    </PageWrapper>
  )
}