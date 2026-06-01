import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Separator from '../components/Separator'

export default function NewReportMenu({ onNavigate }) {
  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('addMenu')} />
      <PageHeader title="NUEVO INFORME" sub="elige el tipo" />
      <Separator className="my-5" />
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => onNavigate('newReport')}>INFORME SEMANAL</Button>
        <Button variant="secondary" onClick={() => onNavigate('newBioimpedance')}>BIOIMPEDANCIA</Button>
        <Button variant="secondary" onClick={() => onNavigate('newDexa')}>DEXA</Button>
        <Button variant="secondary" onClick={() => onNavigate('newBodyMeasurement')}>MEDIDAS CORPORALES</Button>
      </div>
    </PageWrapper>
  )
}