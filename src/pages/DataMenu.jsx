import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Separator from '../components/Separator'
import BackButton from '../components/BackButton'

const ITEMS = [
  ['PESO',           'weightHistory',      '⬡'],
  ['FASES',          'currentPhase',       '◈'],
  ['BIOIMPEDANCIA',  'bioimpedanceReports', '◎'],
  ['DEXA',           'dexaReports',        '⬢'],
  ['MEDIDAS',        'bodyMeasurements',   '▣'],
  ['GYM',            'gymHistory',         '◆'],
  ['CALORÍAS',       'caloriesHistory',    '◇'],
]

export default function DataMenu({ onNavigate }) {
  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="DATOS" sub="historial y métricas" />

      <div className="flex flex-col gap-2">
        {ITEMS.map(([label, page, icon], i) => (
          <Button key={page} variant="secondary" onClick={() => onNavigate(page)}>
            {label}
          </Button>
        ))}
      </div>

      <Separator className="mt-8 mb-4" />
      <p className="text-[#222222] font-mono text-[10px] text-center tracking-widest">weights v0.1</p>
    </PageWrapper>
  )
}