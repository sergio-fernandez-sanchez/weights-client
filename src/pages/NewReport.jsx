import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function NewReport({ onNavigate }) {
  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="// NUEVO INFORME" />

      <div className="flex flex-col gap-3">
        {[
          ['// BIOIMPEDANCIA →',   'newBioimpedance'],
          ['// DEXA →',            'newDexa'],
          ['// MEDIDAS CORPORALES →', 'newBodyMeasurement'],
        ].map(([label, page]) => (
          <Button key={page} variant="secondary" onClick={() => onNavigate(page)}>
            {label}
          </Button>
        ))}
      </div>

      <Separator className="mt-8 mb-4" />
      <p className="text-[#333333] font-mono text-xs">sergio / weights v0.1</p>
    </PageWrapper>
  )
}