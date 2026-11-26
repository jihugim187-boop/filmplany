import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import LoglineBar from '../components/LoglineBar.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TopBar from '../components/TopBar.tsx'
import type { ProjectOutletContext } from '../features/project/projectContext.ts'
import { useRealtimeRefetch } from '../hooks/useRealtimeRefetch.ts'
import { koreanError } from '../lib/errors.ts'
import { db } from '../lib/supabase.ts'
import type { Project } from '../types/db.ts'

/** 프로젝트 안 모든 화면의 공통 틀: 상단 바 + 로그라인 고정 바 */
export default function ProjectLayout() {
  const { projectId = '' } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await db().from('projects').select('*').eq('id', projectId).maybeSingle()
    if (error) return setError(koreanError(error))
    setError(null)
    if (!data) return setNotFound(true)
    setNotFound(false)
    setProject(data as Project)
  }, [projectId])

  useEffect(() => {
    setProject(null)
    void load()
  }, [load])
  useRealtimeRefetch('projects', load, `id=eq.${projectId}`)

  if (notFound) {
    return (
      <>
        <TopBar backTo="/" />
        <main className="page">
          <StatusMessage kind="empty">
            프로젝트를 찾을 수 없습니다. 삭제됐거나 주소가 잘못됐습니다. <Link to="/">목록으로</Link>
          </StatusMessage>
        </main>
      </>
    )
  }

  const ctx: ProjectOutletContext | null = project ? { project, reload: load } : null

  return (
    <>
      <div className="sticky-top">
        <TopBar backTo="/" title={<h1 className="topbar-h1">{project?.title ?? '…'}</h1>} />
        {project && <LoglineBar projectId={project.id} logline={project.logline} />}
      </div>
      <main className="page">
        {error && <StatusMessage kind="error" onRetry={load}>{error}</StatusMessage>}
        {!project && !error && <StatusMessage>프로젝트를 불러오는 중…</StatusMessage>}
        {ctx && <Outlet context={ctx} />}
      </main>
    </>
  )
}
