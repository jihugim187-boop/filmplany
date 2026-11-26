import { Link } from 'react-router-dom'

interface Props {
  projectId: string
  logline: string
}

/** 프로젝트 안 모든 화면 맨 위에 고정되는 로그라인 한 줄 */
export default function LoglineBar({ projectId, logline }: Props) {
  return (
    <div className="logline-bar">
      <span className="logline-label">로그라인</span>
      {logline.trim() ? (
        <p className="logline-text">{logline}</p>
      ) : (
        <Link to={`/projects/${projectId}/edit`} className="logline-empty">
          아직 로그라인이 없습니다. 눌러서 입력하세요.
        </Link>
      )}
    </div>
  )
}
