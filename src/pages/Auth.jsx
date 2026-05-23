import { useState } from 'react'
import { login, register } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

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
      <PageHeader title="// W E I G H T S" blink />

      <div className="flex w-full mb-6">
        {['login', 'register'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); setSuccess('') }}
            className={`flex-1 h-10 font-mono text-sm border transition-colors ${
              mode === m
                ? 'bg-[#c8f500] text-[#0a0a0a] border-[#c8f500]'
                : 'bg-[#141414] text-[#888888] border-[#333333] hover:border-[#c8f500]'
            }`}
          >
            {m === 'login' ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input required label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input required label="CONTRASEÑA" type="password" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p className="text-[#ff4444] font-mono text-sm">{error}</p>}
        {success && <p className="text-[#c8f500] font-mono text-sm">{success}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
        </Button>
      </form>

      <Separator className="mt-12 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}