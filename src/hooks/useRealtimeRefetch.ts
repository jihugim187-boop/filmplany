import { useEffect, useRef } from 'react'
import { db } from '../lib/supabase.ts'

/**
 * 표가 바뀌면(누가 추가·수정·삭제하면) onChange를 부른다.
 * 다른 기기에서 바꾼 내용이 새로고침 없이 반영되게 할 때 쓴다.
 * filter 예: `project_id=eq.${projectId}`
 */
export function useRealtimeRefetch(table: string, onChange: () => void, filter?: string) {
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    const client = db()
    const channel = client
      .channel(`rt:${table}:${filter ?? 'all'}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, () => cb.current())
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [table, filter])
}
