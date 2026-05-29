import { useState } from 'react'
import { getAiReport, getRawReport } from '../api/client'
import PageHeader from '../components/PageHeader'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'

export default function AiReport({ onNavigate }) {
  const [loadingAi, setLoadingAi] = useState(false)
  const [loadingRaw, setLoadingRaw] = useState(false)
  const [toast, setToast] = useState(null)

  async function downloadReport(type) {
    const setLoading = type === 'ai' ? setLoadingAi : setLoadingRaw
    setLoading(true)
    setToast(null)
    try {
      const data = type === 'ai' ? await getAiReport() : await getRawReport()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weights_${type}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ msg: '✓  informe descargado', type: 'success' })
    } catch {
      setToast({ msg: '✗  error al generar informe', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 md:px-16 pb-10">
      <div className="w-full max-w-sm mx-auto pt-10">
        <BackButton onClick={() => onNavigate('home')} />
        <PageHeader title="INFORME IA" sub="exporta tus datos en formato JSON" />

        <div className="glass-card rounded-sm p-4 mb-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c8f500] to-transparent opacity-60" />
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-[3px] h-3.5 rounded-full bg-[#c8f500]" />
            <span className="text-[#c8f500] font-sans text-sm font-bold tracking-wide">OPTIMIZADO PARA IA</span>
          </div>
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.15em] leading-relaxed mb-4">
            Resumen ejecutivo, fases con estadísticas, pesos semanales, calorías cruzadas con fases, gym con 1RM.
          </p>
          <button
            onClick={() => downloadReport('ai')}
            disabled={loadingAi}
            className="w-full h-11 glass-card rounded-sm text-[#c8f500] font-sans text-xs font-bold tracking-widest hover:bg-[#c8f500] hover:text-[#0a0a0a] transition-all duration-200 disabled:opacity-40"
          >
            {loadingAi ? 'generando...' : '↓  DESCARGAR JSON'}
          </button>
        </div>

        <div className="glass-card rounded-sm p-4 mb-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#555555] to-transparent opacity-40" />
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-[3px] h-3.5 rounded-full bg-[#555555]" />
            <span className="text-[#e8e8e8] font-sans text-sm font-bold tracking-wide">DATOS EN BRUTO</span>
          </div>
          <p className="text-[#555555] font-sans text-[10px] tracking-[0.15em] leading-relaxed mb-4">
            Todos los registros sin procesar, separados por secciones.
          </p>
          <button
            onClick={() => downloadReport('raw')}
            disabled={loadingRaw}
            className="w-full h-11 glass-card rounded-sm text-[#888888] font-sans text-xs font-bold tracking-widest hover:bg-[#e8e8e8] hover:text-[#0a0a0a] transition-all duration-200 disabled:opacity-40"
          >
            {loadingRaw ? 'generando...' : '↓  DESCARGAR JSON'}
          </button>
        </div>

        <Separator className="mt-8 mb-4" />
        <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </div>
  )
}