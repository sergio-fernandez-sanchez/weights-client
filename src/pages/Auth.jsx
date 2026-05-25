import { useState } from 'react'
import { login, register } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Separator from '../components/Separator'
import Tabs from '../components/Tabs'

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
      <PageHeader title="W E I G H T S" blink sub="tracking de peso & rendimiento" />

      <Tabs options={[['INICIAR SESIÓN', 'login'], ['REGISTRARSE', 'register']]} value={mode} onChange={(m) => { setMode(m); setError(''); setSuccess('') }} className="mb-6" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input required label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input required label="CONTRASEÑA" type="password" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p className="text-[#ff4444] font-mono text-sm animate-slide-down">{error}</p>}
        {success && <p className="text-[#c8f500] font-mono text-sm animate-slide-down">{success}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
        </Button>
      </form>

      <Separator className="mt-12 mb-4" />
      <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
    </PageWrapper>
  )
}