import { useState, type FormEvent } from 'react'
import type { ProjectFields } from '../../types/db.ts'
import { PROJECT_SECTIONS, type FieldDef } from './projectFields.ts'

interface Props {
  initial: ProjectFields
  submitLabel: string
  saving: boolean
  error: string | null
  onSubmit: (fields: ProjectFields) => void
  onCancel: () => void
}

/** 프로젝트 제목 + 설명 10개 항목 입력 */
export default function ProjectForm({ initial, submitLabel, saving, error, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<ProjectFields>(initial)
  const [titleTouched, setTitleTouched] = useState(false)
  const set = <K extends keyof ProjectFields>(k: K, val: ProjectFields[K]) => setV((p) => ({ ...p, [k]: val }))

  const titleError = titleTouched && !v.title.trim() ? '제목을 입력하세요.' : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTitleTouched(true)
    if (!v.title.trim()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const trimmed = { ...v }
    for (const k of Object.keys(trimmed) as (keyof ProjectFields)[]) {
      const val = trimmed[k]
      if (typeof val === 'string') (trimmed as Record<string, unknown>)[k] = val.trim()
    }
    onSubmit(trimmed)
  }

  const renderField = (f: FieldDef) => {
    if (f.kind === 'number') {
      const val = v[f.key]
      return (
        <label className="field field-number" key={f.key}>
          <span className="field-label">{f.label}</span>
          <span className="input-unit">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              value={val ?? ''}
              onChange={(e) => {
                const n = e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value)))
                set(f.key, Number.isFinite(n as number) || n === null ? n : null)
              }}
            />
            <span>{f.unit}</span>
          </span>
        </label>
      )
    }
    if (f.kind === 'date') {
      return (
        <label className="field" key={f.key}>
          <span className="field-label">{f.label}</span>
          <span className="input-row">
            <input type="date" value={v.deadline ?? ''} onChange={(e) => set('deadline', e.target.value || null)} />
            {v.deadline && (
              <button type="button" className="btn-ghost" onClick={() => set('deadline', null)}>
                지우기
              </button>
            )}
          </span>
        </label>
      )
    }
    const common = {
      value: v[f.key],
      placeholder: f.placeholder,
      onChange: (e: { target: { value: string } }) => set(f.key, e.target.value),
    }
    return (
      <label className="field" key={f.key}>
        <span className="field-label">{f.label}</span>
        {f.multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
      </label>
    )
  }

  return (
    <form className="form project-form" onSubmit={submit}>
      <section className="form-section">
        <label className="field">
          <span className="field-label">프로젝트 제목</span>
          <input
            value={v.title}
            maxLength={60}
            onChange={(e) => set('title', e.target.value)}
            onBlur={() => setTitleTouched(true)}
            placeholder="예: 마지막 암실"
            autoComplete="off"
          />
          {titleError && <span className="field-error">{titleError}</span>}
        </label>
      </section>

      <h2 className="form-heading">프로젝트 설명</h2>
      <p className="muted small-text">모든 기능과 프롬프트의 기준이 됩니다. 아는 것만 채우고 나중에 고쳐도 됩니다.</p>

      {PROJECT_SECTIONS.map((s) => (
        <section className="form-section note" key={s.no}>
          <h3>
            <span className="section-no">{s.no}</span> {s.title}
          </h3>
          {s.hint && <p className="muted small-text">{s.hint}</p>}
          <div className={s.fields.every((f) => f.kind === 'number') ? 'field-row' : ''}>{s.fields.map(renderField)}</div>
        </section>
      ))}

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions sticky-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          취소
        </button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
