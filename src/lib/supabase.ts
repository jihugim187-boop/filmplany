import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** 환경변수가 빌드 때 주입되었는지 여부 */
export const hasSupabaseEnv = Boolean(url && anonKey)

/**
 * 앱 전체에서 쓰는 단 하나의 Supabase 클라이언트.
 * 로그인이 없으므로 세션 저장/자동 갱신을 끈다.
 * 환경변수가 없으면 null (App에서 안내 화면).
 */
export const supabase: SupabaseClient | null = hasSupabaseEnv
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

/** 환경변수가 있다는 전제에서 쓰는 클라이언트 (App이 null일 때는 화면을 막는다) */
export function db(): SupabaseClient {
  if (!supabase) throw new Error('Supabase 환경변수가 없습니다.')
  return supabase
}

/** 사진은 모두 이 버킷에 저장 (public) */
export const MEDIA_BUCKET = 'media'

export type ConnectionStatus =
  | { state: 'checking' }
  | { state: 'connected'; schemaReady: boolean }
  | { state: 'failed'; reason: string }

/**
 * Supabase 연결 확인. profiles 표를 조회해 본다.
 * - 200: 연결됨 + 데이터베이스 설치됨
 * - 404 (표 없음): 연결됨, schema.sql 아직 실행 안 함
 * - 401/403: 키가 잘못됨
 * - 응답 없음: 주소가 잘못됐거나 네트워크 문제
 */
export async function checkConnection(): Promise<ConnectionStatus> {
  if (!supabase) {
    return { state: 'failed', reason: '환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 빌드에 들어오지 않았습니다.' }
  }
  try {
    const { error, status } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (!error) return { state: 'connected', schemaReady: true }
    if (status === 404 || error.code === 'PGRST205' || error.code === '42P01') {
      return { state: 'connected', schemaReady: false }
    }
    if (status === 401 || status === 403) {
      return { state: 'failed', reason: 'Supabase 키(anon key)가 올바르지 않습니다.' }
    }
    if (!status) {
      return { state: 'failed', reason: 'Supabase 서버에 닿지 못했습니다. 주소(URL)를 확인하세요. 무료 플랜이 일시정지됐을 수도 있습니다.' }
    }
    return { state: 'failed', reason: `오류 ${status}: ${error.message}` }
  } catch {
    return { state: 'failed', reason: 'Supabase 서버에 닿지 못했습니다. 주소(URL)나 네트워크를 확인하세요.' }
  }
}
