import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import './MainLayout.css'

function MainLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-layout__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
