import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.tsx'
import ProjectForm from '../features/project/ProjectForm.tsx'
import { EMPTY_PROJECT } from '../features/project/projectFields.ts'
import { useCurrentProfile } from '../hooks/profileContext.ts'
import { koreanError } from '../lib/errors.ts'
import { db } from '../lib/supabase.ts'
import type { ProjectFields } from '../types/db.ts'

export default function ProjectNewPage() {
  const me = useCurrentProfile()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (fields: ProjectFields) => {
    setSaving(true)
    setError(null)
    const { data, error } = await db()
      .from('projects')
      .insert({ ...fields, created_by: me.id, updated_by: me.id })
      .select('id')
      .single()
    setSaving(false)
    if (error) return setError(koreanError(error))
    navigate(`/projects/${data.id}`, { replace: true })
  }

  return (
    <>
      <TopBar title={<h1 className="topbar-h1">새 프로젝트</h1>} backTo="/" />
      <main className="page page-narrow">
        <ProjectForm
          initial={EMPTY_PROJECT}
          submitLabel="프로젝트 만들기"
          saving={saving}
          error={error}
          onSubmit={create}
          onCancel={() => navigate('/')}
        />
      </main>
    </>
  )
}
