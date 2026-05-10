import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

export default function DataMenu({ onNavigate }) {
  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="// DATOS" />

      <div className="flex flex-col gap-3">
        {[
          ['// EVOLUCIÓN →',  'weightHistory'],
          ['// FASE ACTUAL →', 'currentPhase'],
          ['// INFORMES →',    'reports'],
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