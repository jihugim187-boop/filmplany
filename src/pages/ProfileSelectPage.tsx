import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar.tsx'
import Sheet from '../components/Sheet.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import ProfileForm, { type ProfileDraft } from '../features/profile/ProfileForm.tsx'
import { useProfile } from '../hooks/profileContext.ts'
import { useRealtimeRefetch } from '../hooks/useRealtimeRefetch.ts'
import { koreanError } from '../lib/errors.ts'
import { db } from '../lib/supabase.ts'
import type { Profile } from '../types/db.ts'

type Editing = { mode: 'new' } | { mode: 'edit'; profile: Profile } | null

/** 넷플릭스식 프로필 선택 화면 */
export default function ProfileSelectPage() {
  const { profile: current, selectProfile, clearProfile, refreshProfile } = useProfile()
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [manage, setManage] = useState(false)
  const [editing, setEditing] = useState<Editing>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await db().from('profiles').select('*').order('created_at')
    if (error) {
      setLoadError(koreanError(error))
      return
    }
    setLoadError(null)
    setProfiles(data as Profile[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])
  useRealtimeRefetch('profiles', load)

  const choose = (p: Profile) => {
    if (manage) {
      setSaveError(null)
      setEditing({ mode: 'edit', profile: p })
      return
    }
    selectProfile(p)
    navigate('/')
  }

  const save = async (draft: ProfileDraft) => {
    if (!editing) return
    setSaving(true)
    setSaveError(null)
    if (editing.mode === 'new') {
      const { data, error } = await db().from('profiles').insert(draft).select().single()
      setSaving(false)
      if (error) return setSaveError(koreanError(error))
      setEditing(null)
      selectProfile(data as Profile)
      navigate('/')
    } else {
      const { error } = await db().from('profiles').update(draft).eq('id', editing.profile.id)
      setSaving(false)
      if (error) return setSaveError(koreanError(error))
      setEditing(null)
      if (current?.id === editing.profile.id) await refreshProfile()
      void load()
    }
  }

  const remove = async () => {
    if (editing?.mode !== 'edit') return
    const p = editing.profile
    if (!window.confirm(`'${p.name}' 프로필을 삭제할까요?\n이 사람이 쓴 내용은 남지만 작성자 표시가 사라집니다.`)) return
    setSaving(true)
    const { error } = await db().from('profiles').delete().eq('id', p.id)
    setSaving(false)
    if (error) return setSaveError(koreanError(error))
    setEditing(null)
    if (current?.id === p.id) clearProfile()
    void load()
  }

  return (
    <main className="profile-page">
      <h1 className="profile-page-title">{manage ? '프로필 관리' : '누가 기획하나요?'}</h1>
      {manage && <p className="muted center">수정할 프로필을 누르세요.</p>}

      {loadError && <StatusMessage kind="error" onRetry={load}>{loadError}</StatusMessage>}
      {!profiles && !loadError && <StatusMessage>프로필을 불러오는 중…</StatusMessage>}

      {profiles && (
        <ul className="profile-grid">
          {profiles.map((p) => (
            <li key={p.id}>
              <button type="button" className={`profile-tile ${manage ? 'profile-tile-manage' : ''}`} onClick={() => choose(p)}>
                <span className="profile-tile-avatar">
                  <Avatar name={p.name} color={p.color} size={88} />
                  {manage && <span className="profile-tile-edit" aria-hidden="true">✎</span>}
                </span>
                <span className="profile-tile-name">
                  {p.name}
                  {current?.id === p.id && <span className="badge">지금</span>}
                </span>
                {p.roles.length > 0 && <span className="profile-tile-roles">{p.roles.join(' · ')}</span>}
                {p.bio && <span className="profile-tile-bio">{p.bio}</span>}
              </button>
            </li>
          ))}
          {!manage && (
            <li>
              <button
                type="button"
                className="profile-tile"
                onClick={() => {
                  setSaveError(null)
                  setEditing({ mode: 'new' })
                }}
              >
                <span className="profile-add">+</span>
                <span className="profile-tile-name">프로필 추가</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {profiles && profiles.length > 0 && (
        <div className="center">
          <button type="button" className="btn-secondary" onClick={() => setManage((m) => !m)}>
            {manage ? '완료' : '프로필 관리'}
          </button>
        </div>
      )}

      {editing && (
        <Sheet title={editing.mode === 'new' ? '새 프로필' : '프로필 수정'} onClose={() => setEditing(null)}>
          <ProfileForm
            initial={editing.mode === 'edit' ? editing.profile : undefined}
            submitLabel={editing.mode === 'new' ? '만들고 시작하기' : '저장'}
            saving={saving}
            error={saveError}
            onSubmit={save}
            onDelete={editing.mode === 'edit' ? remove : undefined}
          />
        </Sheet>
      )}
    </main>
  )
}
