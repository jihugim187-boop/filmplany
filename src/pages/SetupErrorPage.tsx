import { useCallback, useEffect, useState } from 'react'
import { checkConnection, type ConnectionStatus } from '../lib/supabase.ts'

/** Supabase에 연결할 수 없을 때 보여주는 화면 */
export default function SetupErrorPage() {
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'checking' })
  const run = useCallback(async () => {
    setStatus({ state: 'checking' })
    setStatus(await checkConnection())
  }, [])
  useEffect(() => {
    void run()
  }, [run])

  const detail =
    status.state === 'checking'
      ? '서버에 접속하고 있습니다.'
      : status.state === 'connected'
        ? status.schemaReady
          ? '연결됐습니다. 새로고침하세요.'
          : '서버에는 연결됐지만 데이터베이스 표가 없습니다. schema.sql을 실행하세요.'
        : status.reason

  return (
    <main className="page-center">
      <div className="note-card">
        <p className="eyebrow">영상부 공동 기획 노트</p>
        <h1>필름플래니</h1>
        <div className="status-box" aria-live="polite">
          <span className={`dot dot-${status.state}`} />
          <div>
            <strong>Supabase 연결: {status.state === 'checking' ? '확인 중…' : status.state === 'connected' ? '연결됨' : '실패'}</strong>
            <p className="muted small">{detail}</p>
          </div>
        </div>
        <button className="btn" onClick={run} disabled={status.state === 'checking'}>
          다시 확인
        </button>
      </div>
    </main>
  )
}
