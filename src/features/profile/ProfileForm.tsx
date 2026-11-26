import { useState, type FormEvent } from 'react'
import { PROFILE_COLORS, ROLES, type Role } from '../../lib/constants.ts'
import Avatar from '../../components/Avatar.tsx'

export interface ProfileDraft {
  name: string
  roles: Role[]
  color: string
  bio: string
}

interface Props {
  initial?: ProfileDraft
  submitLabel: string
  saving: boolean
  error: string | null
  onSubmit: (draft: ProfileDraft) => void
  onDelete?: () => void
}

export default function ProfileForm({ initial, submitLabel, saving, error, onSubmit, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [roles, setRoles] = useState<Role[]>(initial?.roles ?? [])
  const [color, setColor] = useState(initial?.color ?? PROFILE_COLORS[0])
  const [bio, setBio] = useState(initial?.bio ?? '')
  const [touched, setTouched] = useState(false)

  const nameError = touched && !name.trim() ? '이름을 입력하세요.' : null

  const toggleRole = (r: Role) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : ROLES.filter((x) => x === r || prev.includes(x))))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!name.trim()) return
    onSubmit({ name: name.trim(), roles, color, bio: bio.trim() })
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-preview">
        <Avatar name={name || '?'} color={color} size={72} />
      </div>

      <label className="field">
        <span className="field-label">이름</span>
        <input
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="예: 김지후"
          autoComplete="off"
        />
        {nameError && <span className="field-error">{nameError}</span>}
      </label>

      <fieldset className="field">
        <legend className="field-label">역할 (여러 개 선택)</legend>
        <div className="chips">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r}
              className={`chip ${roles.includes(r) ? 'chip-on' : ''}`}
              aria-pressed={roles.includes(r)}
              onClick={() => toggleRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">프로필 색</legend>
        <div className="swatches">
          {PROFILE_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`swatch ${color === c ? 'swatch-on' : ''}`}
              style={{ background: c }}
              aria-label={`색 ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field-label">한 줄 소개</span>
        <input value={bio} maxLength={60} onChange={(e) => setBio(e.target.value)} placeholder="예: 핸드헬드 장인" />
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        {onDelete && (
          <button type="button" className="btn-danger" onClick={onDelete} disabled={saving}>
            프로필 삭제
          </button>
        )}
        <button type="submit" className="btn" disabled={saving}>
          {saving ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
