import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import SectionPage from './pages/SectionPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:section" element={<SectionPage />} />
        <Route path="/:section/:slug" element={<SectionPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
