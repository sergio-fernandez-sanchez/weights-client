import { useState, useEffect } from 'react'
import { isAuthenticated } from './api/client'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Phase from './pages/Phase'
import DataMenu from './pages/DataMenu'
import WeightHistory from './pages/WeightHistory'
import CurrentPhase from './pages/CurrentPhase'
import AiReport from './pages/AiReport'
import EditPhaseGoals from './pages/EditPhaseGoals'
import Calories from './pages/Calories'
import Gym from './pages/Gym'
import GymHistory from './pages/GymHistory'
import CaloriesHistory from './pages/CaloriesHistory'
import Profile from './pages/Profile'
import WeeklyReport from './pages/WeeklyReport'
import NewBioimpedanceReport from './pages/NewBioimpedanceReport'
import NewDexaReport from './pages/NewDexaReport'
import NewBodyMeasurement from './pages/NewBodyMeasurement'
import BioimpedanceReports from './pages/BioimpedanceReports'
import DexaReports from './pages/DexaReports'
import BodyMeasurements from './pages/BodyMeasurements'
import ParticleBackground from './components/ParticleBackground'

export default function App() {
  const [auth, setAuth] = useState(isAuthenticated())
  const [page, setPage] = useState('home')
  const [pageData, setPageData] = useState(null)

  function navigate(newPage, data = null) {
    window.history.pushState({ page: newPage, data }, '', '')
    setPage(newPage)
    setPageData(data)
  }

  useEffect(() => {
    window.history.replaceState({ page: 'home', data: null }, '', '')

    function handlePopState(e) {
      if (e.state) {
        setPage(e.state.page)
        setPageData(e.state.data)
      } else {
        setPage('home')
        setPageData(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        {!auth ? (
          <Auth onLogin={() => {
            setAuth(true)
            window.history.replaceState({ page: 'home', data: null }, '', '')
          }} />
        ) : (
          <div key={page} className="animate-fade-in">
            {page === 'home'                && <Home                 onNavigate={navigate} onLogout={() => { setAuth(false); window.history.replaceState({ page: 'home', data: null }, '', '') }} />}
            {page === 'phase'               && <Phase                onNavigate={navigate} />}
            {page === 'data'                && <DataMenu             onNavigate={navigate} />}
            {page === 'weightHistory'       && <WeightHistory        onNavigate={navigate} />}
            {page === 'currentPhase'        && <CurrentPhase         onNavigate={navigate} />}
            {page === 'aiReport'            && <AiReport             onNavigate={navigate} />}
            {page === 'editPhaseGoals'      && <EditPhaseGoals       onNavigate={navigate} phase={pageData} />}
            {page === 'calories'            && <Calories             onNavigate={navigate} currentCalories={pageData} />}
            {page === 'gym'                 && <Gym                  onNavigate={navigate} />}
            {page === 'gymHistory'          && <GymHistory           onNavigate={navigate} />}
            {page === 'caloriesHistory'     && <CaloriesHistory      onNavigate={navigate} />}
            {page === 'profile'             && <Profile              onNavigate={navigate} />}
            {page === 'weeklyReport'        && <WeeklyReport         onNavigate={navigate} initialWeekStart={pageData} />}
            {page === 'newBioimpedance'     && <NewBioimpedanceReport onNavigate={navigate} />}
            {page === 'newDexa'             && <NewDexaReport        onNavigate={navigate} />}
            {page === 'newBodyMeasurement'  && <NewBodyMeasurement   onNavigate={navigate} />}
            {page === 'bioimpedanceReports' && <BioimpedanceReports  onNavigate={navigate} />}
            {page === 'dexaReports'         && <DexaReports          onNavigate={navigate} />}
            {page === 'bodyMeasurements'    && <BodyMeasurements     onNavigate={navigate} />}
          </div>
        )}
      </div>
    </div>
  )
}