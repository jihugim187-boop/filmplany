import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusMessage from '../components/StatusMessage.tsx'
import TopBar from '../components/TopBar.tsx'
import { dDayLabel } from '../features/project/projectFields.ts'
import { useRealtimeRefetch } from '../hooks/useRealtimeRefetch.ts'
import { koreanError } from '../lib/errors.ts'
import { db } from '../lib/supabase.ts'
import type { Project } from '../types/db.ts'

type Row = Pick<Project, 'id' | 'title' | 'logline' | 'genre_tone' | 'deadline' | 'updated_at'>

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await db()
      .from('projects')
      .select('id, title, logline, genre_tone, deadline, updated_at')
      .order('updated_at', { ascending: false })
    if (error) return setError(koreanError(error))
    setError(null)
    setProjects(data as Row[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])
  useRealtimeRefetch('projects', load)

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="page-head">
          <h1>프로젝트</h1>
          <Link to="/projects/new" className="btn">
            + 새 프로젝트
          </Link>
        </div>

        {error && <StatusMessage kind="error" onRetry={load}>{error}</StatusMessage>}
        {!projects && !error && <StatusMessage>프로젝트를 불러오는 중…</StatusMessage>}
        {projects?.length === 0 && (
          <StatusMessage kind="empty">아직 프로젝트가 없습니다. ‘새 프로젝트’로 첫 영화를 시작하세요.</StatusMessage>
        )}

        {projects && projects.length > 0 && (
          <ul className="card-grid">
            {projects.map((p) => {
              const dday = dDayLabel(p.deadline)
              return (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}`} className="note project-card">
                    <div className="project-card-top">
                      <h2>{p.title}</h2>
                      {dday && <span className="badge badge-accent">{dday}</span>}
                    </div>
                    {p.genre_tone && <p className="muted small-text">{p.genre_tone}</p>}
                    <p className={p.logline ? 'project-card-logline' : 'muted project-card-logline'}>
                      {p.logline || '로그라인 없음'}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </>
  )
}
