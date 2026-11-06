import { useCallback, useEffect, useState } from 'react'
import { checkConnection, type ConnectionStatus } from '../lib/supabase.ts'

export default function ComingSoonPage() {
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'checking' })

  const run = useCallback(async () => {
    setStatus({ state: 'checking' })
    setStatus(await checkConnection())
  }, [])

  useEffect(() => {
    void run()
  }, [run])

  return (
    <main className="page-center">
      <div className="note-card">
        <p className="eyebrow">영상부 공동 기획 노트</p>
        <h1>필름플래니</h1>
        <p className="muted">준비 중입니다. 곧 여기서 시나리오, 콘티, 촬영 일정을 함께 만들 수 있어요.</p>

        <div className="status-box" aria-live="polite">
          <span className={`dot dot-${status.state}`} />
          <div>
            <strong>Supabase 연결: {statusTitle(status)}</strong>
            <p className="muted small">{statusDetail(status)}</p>
          </div>
        </div>

        <button className="btn" onClick={run} disabled={status.state === 'checking'}>
          다시 확인
        </button>
      </div>
    </main>
  )
}

function statusTitle(s: ConnectionStatus) {
  if (s.state === 'checking') return '확인 중…'
  if (s.state === 'connected') return '연결됨'
  return '실패'
}

function statusDetail(s: ConnectionStatus) {
  if (s.state === 'checking') return '서버에 접속하고 있습니다.'
  if (s.state === 'connected') {
    return s.schemaReady
      ? '데이터베이스 표까지 준비되었습니다.'
      : '서버에는 연결됐지만 데이터베이스 표가 아직 없습니다. schema.sql을 실행하세요.'
  }
  return s.reason
}
