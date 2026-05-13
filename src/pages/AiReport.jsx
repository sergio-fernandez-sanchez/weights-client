import { useState } from 'react'
import { getAiReport, getRawReport } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function AiReport({ onNavigate }) {
  const [loadingAi, setLoadingAi] = useState(false)
  const [loadingRaw, setLoadingRaw] = useState(false)
  const [msg, setMsg] = useState('')

  async function downloadReport(type) {
    const setLoading = type === 'ai' ? setLoadingAi : setLoadingRaw
    setLoading(true)
    setMsg('')
    try {
      const data = type === 'ai' ? await getAiReport() : await getRawReport()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weights_${type}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMsg('✓  informe descargado')
    } catch {
      setMsg('✗  error al generar informe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="// INFORME IA" />

        <div className="bg-[#141414] border border-[#333333] p-4 mb-3">
          <p className="text-[#c8f500] font-mono text-sm font-bold mb-2">OPTIMIZADO PARA IA</p>
          <p className="text-[#888888] font-mono text-xs mb-4">
            Resumen ejecutivo, fases con estadísticas, pesos semanales, calorías cruzadas con fases, gym con 1RM. Formato JSON.
          </p>
          <button
            onClick={() => downloadReport('ai')}
            disabled={loadingAi}
            className="w-full h-11 bg-transparent border border-[#c8f500] text-[#c8f500] font-mono text-xs hover:bg-[#c8f500] hover:text-[#0a0a0a] transition-colors"
          >
            {loadingAi ? 'generando...' : '↓ DESCARGAR JSON'}
          </button>
        </div>

        <div className="bg-[#141414] border border-[#333333] p-4 mb-3">
          <p className="text-[#e8e8e8] font-mono text-sm font-bold mb-2">DATOS EN BRUTO</p>
          <p className="text-[#888888] font-mono text-xs mb-4">
            Todos los registros sin procesar, separados por secciones. Formato JSON.
          </p>
          <button
            onClick={() => downloadReport('raw')}
            disabled={loadingRaw}
            className="w-full h-11 bg-transparent border border-[#333333] text-[#888888] font-mono text-xs hover:border-[#e8e8e8] hover:text-[#e8e8e8] transition-colors"
          >
            {loadingRaw ? 'generando...' : '↓ DESCARGAR JSON'}
          </button>
        </div>

        {msg && (
          <p className={`font-mono text-sm mt-2 ${msg.startsWith('✓') ? 'text-[#c8f500]' : 'text-[#ff4444]'}`}>
            {msg}
          </p>
        )}

        <Separator className="mt-8 mb-4" />
        <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
      </div>
    </div>
  )
}