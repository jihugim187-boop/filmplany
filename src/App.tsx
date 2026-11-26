import { HashRouter, Route, Routes } from 'react-router-dom'
import ComingSoonPage from './pages/ComingSoonPage.tsx'

// GitHub Pages는 새로고침 시 404가 나므로 HashRouter 사용 (주소: .../filmplany/#/경로)
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<ComingSoonPage />} />
      </Routes>
    </HashRouter>
  )
}
