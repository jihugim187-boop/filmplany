import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectForm from '../features/project/ProjectForm.tsx'
import { useProject } from '../features/project/projectContext.ts'
import { toFields } from '../features/project/projectFields.ts'
import { useCurrentProfile } from '../hooks/profileContext.ts'
import { koreanError } from '../lib/errors.ts'
import { db } from '../lib/supabase.ts'
import type { ProjectFields } from '../types/db.ts'

export default function ProjectEditPage() {
  const { project, reload } = useProject()
  const me = useCurrentProfile()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const back = () => navigate(`/projects/${project.id}`)

  const save = async (fields: ProjectFields) => {
    setSaving(true)
    setError(null)
    const { error } = await db().from('projects').update({ ...fields, updated_by: me.id }).eq('id', project.id)
    setSaving(false)
    if (error) return setError(koreanError(error))
    await reload()
    back()
  }

  return (
    <div className="page-narrow">
      <h2>프로젝트 설명 수정</h2>
      <ProjectForm
        key={project.id}
        initial={toFields(project)}
        submitLabel="저장"
        saving={saving}
        error={error}
        onSubmit={save}
        onCancel={back}
      />
    </div>
  )
}
