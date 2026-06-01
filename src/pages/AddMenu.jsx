import PageWrapper from '../components/PageWrapper'
import PageHeader from '../components/PageHeader'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Separator from '../components/Separator'

export default function AddMenu({ onNavigate }) {
  return (
    <PageWrapper>
      <BackButton onClick={() => onNavigate('home')} />
      <PageHeader title="AÑADIR" sub="nuevo registro" />
      <Separator className="my-5" />
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => onNavigate('newReportMenu')}>NUEVO INFORME</Button>
        <Button variant="secondary" onClick={() => onNavigate('phase')}>NUEVA FASE</Button>
        <Button variant="secondary" onClick={() => onNavigate('photoUpload')}>NUEVA FOTO CORPORAL</Button>
      </div>
    </PageWrapper>
  )
}