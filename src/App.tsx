import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.tsx'
import StatusMessage from './components/StatusMessage.tsx'
import { useProfile } from './hooks/profileContext.ts'
import { ProfileProvider } from './hooks/ProfileProvider.tsx'
import { hasSupabaseEnv } from './lib/supabase.ts'
import ProfileSelectPage from './pages/ProfileSelectPage.tsx'
import ProjectEditPage from './pages/ProjectEditPage.tsx'
import ProjectHomePage from './pages/ProjectHomePage.tsx'
import ProjectLayout from './pages/ProjectLayout.tsx'
import ProjectListPage from './pages/ProjectListPage.tsx'
import ProjectNewPage from './pages/ProjectNewPage.tsx'
import SetupErrorPage from './pages/SetupErrorPage.tsx'

// GitHub Pages는 새로고침 시 404가 나므로 HashRouter 사용 (주소: .../filmplany/#/경로)
export default function App() {
  if (!hasSupabaseEnv) return <SetupErrorPage />
  return (
    <ProfileProvider>
      <HashRouter>
        <ScrollToTop />
        <ProfileGate />
      </HashRouter>
    </ProfileProvider>
  )
}

/** 프로필을 고르기 전에는 프로필 화면만 보여준다 */
function ProfileGate() {
  const { profile, loading } = useProfile()
  if (loading) {
    return (
      <main className="page">
        <StatusMessage>불러오는 중…</StatusMessage>
      </main>
    )
  }
  if (!profile) return <ProfileSelectPage />
  return (
    <Routes>
      <Route path="/" element={<ProjectListPage />} />
      <Route path="/profiles" element={<ProfileSelectPage />} />
      <Route path="/projects/new" element={<ProjectNewPage />} />
      <Route path="/projects/:projectId" element={<ProjectLayout />}>
        <Route index element={<ProjectHomePage />} />
        <Route path="edit" element={<ProjectEditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
