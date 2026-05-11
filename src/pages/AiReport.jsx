import { useState } from 'react'
import { getAiReport, getRawReport } from '../api/client'
import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function AiReport({ onNavigate }) {
  const [loading, setLoading] = useState(null) // null | 'ai' | 'raw'
  const [msg, setMsg] = useState('')

  async function handleDownload(type) {
    setLoading(type)
    setMsg('')
    try {
      const text = type === 'ai' ? await getAiReport() : await getRawReport()
      const suffix = type === 'ai' ? 'ia' : 'raw'
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe_weights_${suffix}_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
      setMsg('✓  informe descargado')
    } catch {
      setMsg('✗  error al generar el informe')
    } finally {
      setLoading(null)
    }
  }

  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="// INFORME IA" />

      {/* Informe optimizado */}
      <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
        <p className="text-[#c8f500] font-mono text-sm font-bold mb-1">INFORME PARA IA</p>
        <p className="text-[#888888] font-mono text-xs mb-4 leading-relaxed">
          Optimizado para análisis. Incluye promedios semanales de pesos pasados, todos los registros de la fase activa, calorías, gym con % de fuerza y mediciones del nutricionista.
        </p>
        <button
          onClick={() => handleDownload('ai')}
          disabled={loading !== null}
          className="w-full h-12 bg-[#c8f500] text-[#0a0a0a] font-mono font-bold text-sm tracking-widest hover:bg-[#0a0a0a] hover:text-[#c8f500] border border-[#c8f500] transition-colors disabled:opacity-50"
        >
          {loading === 'ai' ? 'GENERANDO...' : 'DESCARGAR'}
        </button>
      </div>

      {/* Informe en bruto */}
      <div className="bg-[#141414] border border-[#333333] p-4 mb-4">
        <p className="text-[#888888] font-mono text-sm font-bold mb-1">DATOS EN BRUTO</p>
        <p className="text-[#888888] font-mono text-xs mb-4 leading-relaxed">
          Todos los registros sin procesar. Historial completo de pesos con mín/máx, calorías, gym y mediciones del nutricionista.
        </p>
        <button
          onClick={() => handleDownload('raw')}
          disabled={loading !== null}
          className="w-full h-12 bg-transparent text-[#888888] font-mono font-bold text-sm tracking-widest hover:text-[#c8f500] border border-[#333333] hover:border-[#c8f500] transition-colors disabled:opacity-50"
        >
          {loading === 'raw' ? 'GENERANDO...' : 'DESCARGAR'}
        </button>
      </div>

      {msg && (
        <p className={`font-mono text-sm mt-2 ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
          {msg}
        </p>
      )}

      <Separator className="mt-10 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}