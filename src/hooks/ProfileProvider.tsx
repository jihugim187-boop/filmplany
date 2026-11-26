import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PROFILE_STORAGE_KEY } from '../lib/constants.ts'
import { db } from '../lib/supabase.ts'
import type { Profile } from '../types/db.ts'
import { ProfileContext, type ProfileContextValue } from './profileContext.ts'

function readStoredId(): string | null {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredId(id: string | null) {
  try {
    if (id) localStorage.setItem(PROFILE_STORAGE_KEY, id)
    else localStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {
    // 사파리 개인정보 보호 모드 등: 저장 못 해도 이번 접속은 계속 쓸 수 있다
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (id: string | null) => {
    if (!id) {
      setProfile(null)
      setLoading(false)
      return
    }
    const { data, error } = await db().from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) {
      // 네트워크 오류면 저장된 id는 지우지 않는다 (다음에 다시 시도)
      setProfile(null)
    } else if (!data) {
      // 프로필이 삭제됨 → 선택 화면으로
      writeStoredId(null)
      setProfile(null)
    } else {
      setProfile(data as Profile)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load(readStoredId())
  }, [load])

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      selectProfile: (p) => {
        writeStoredId(p.id)
        setProfile(p)
      },
      clearProfile: () => {
        writeStoredId(null)
        setProfile(null)
      },
      refreshProfile: () => load(profile?.id ?? readStoredId()),
    }),
    [profile, loading, load],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
