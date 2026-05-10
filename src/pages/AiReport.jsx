import { useState } from 'react'
import { getAiReport } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function AiReport({ onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleDownload() {
    setLoading(true)
    setMsg('')
    try {
      const text = await getAiReport()
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe_weights_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
      setMsg('✓  informe descargado')
    } catch {
      setMsg('✗  error al generar el informe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="// INFORME IA" />

      <p className="text-[#888888] font-mono text-sm mb-8 leading-relaxed">
        Genera un archivo <span className="text-[#c8f500]">.txt</span> con todo tu historial — fases, pesos e informes del nutricionista — listo para pegarlo en cualquier IA y obtener un análisis personalizado.
      </p>

      <Button onClick={handleDownload} disabled={loading}>
        {loading ? 'GENERANDO...' : 'DESCARGAR INFORME'}
      </Button>

      {msg && (
        <p className={`font-mono text-sm mt-4 ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
          {msg}
        </p>
      )}

      <Separator className="mt-10 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}