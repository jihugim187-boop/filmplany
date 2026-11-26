import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/profileContext.ts'
import Avatar from './Avatar.tsx'

interface Props {
  /** 왼쪽 제목 자리 (없으면 앱 이름) */
  title?: ReactNode
  /** 뒤로 가기 링크 */
  backTo?: string
  backLabel?: string
}

/** 모든 화면 상단: 제목 + 프로필 전환 버튼 */
export default function TopBar({ title, backTo, backLabel = '목록' }: Props) {
  const { profile } = useProfile()
  return (
    <header className="topbar">
      <div className="topbar-left">
        {backTo && (
          <Link to={backTo} className="btn-ghost topbar-back" aria-label={`${backLabel}으로`}>
            ‹ {backLabel}
          </Link>
        )}
        <div className="topbar-title">{title ?? <Link to="/" className="brand">필름플래니</Link>}</div>
      </div>
      {profile && (
        <Link to="/profiles" className="profile-switch" aria-label="프로필 전환">
          <Avatar name={profile.name} color={profile.color} size={32} />
          <span className="profile-switch-name">{profile.name}</span>
          <span className="profile-switch-hint">전환</span>
        </Link>
      )}
    </header>
  )
}
