/** Supabase 오류를 사용자에게 보여줄 한국어 문장으로 바꾼다 */
export function koreanError(error: unknown): string {
  if (!error) return '알 수 없는 오류가 났습니다.'
  const e = error as { message?: string; code?: string }
  const msg = e.message ?? String(error)
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
    return '인터넷 연결을 확인하세요. 서버에 닿지 못했습니다.'
  }
  if (e.code === '23514') return '입력값이 허용 범위를 벗어났습니다.'
  if (e.code === '23505') return '이미 같은 값이 있습니다.'
  if (e.code === 'PGRST205' || e.code === '42P01') return '데이터베이스 표가 없습니다. schema.sql을 실행했는지 확인하세요.'
  return `오류: ${msg}`
}
