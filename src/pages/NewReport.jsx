import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function NewReport({ onNavigate }) {
  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="NUEVO INFORME" sub="selecciona el tipo de informe" />

      <div className="flex flex-col gap-2">
        {[
          ['BIOIMPEDANCIA',      'newBioimpedance'],
          ['DEXA',               'newDexa'],
          ['MEDIDAS CORPORALES', 'newBodyMeasurement'],
        ].map(([label, page]) => (
          <Button key={page} variant="secondary" onClick={() => onNavigate(page)}>
            {label}
          </Button>
        ))}
      </div>

      <Separator className="mt-8 mb-4" />
      <p className="text-[#1a1a1a] font-sans text-[9px] text-center tracking-[0.3em] select-none">W E I G H T S <span className="text-[#252525]">·</span> 1.0</p>
    </PageWrapper>
  )
}