import { createContext, useContext } from 'react'
import type { Profile } from '../types/db.ts'

export interface ProfileContextValue {
  /** 이 기기에서 고른 프로필 (없으면 null) */
  profile: Profile | null
  /** 저장된 id로 프로필을 불러오는 중 */
  loading: boolean
  selectProfile: (profile: Profile) => void
  clearProfile: () => void
  /** 프로필 정보가 바뀌었을 때 다시 불러오기 */
  refreshProfile: () => Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfile(): ProfileContextValue {
  const v = useContext(ProfileContext)
  if (!v) throw new Error('ProfileProvider 안에서만 쓸 수 있습니다.')
  return v
}

/** 프로필이 반드시 골라진 화면에서 쓴다 (작성자 id 남기기용) */
export function useCurrentProfile(): Profile {
  const { profile } = useProfile()
  if (!profile) throw new Error('프로필이 선택되지 않았습니다.')
  return profile
}
