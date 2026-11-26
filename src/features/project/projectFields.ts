import type { Project, ProjectFields } from '../../types/db.ts'

/** 빈 프로젝트 설명 */
export const EMPTY_PROJECT: ProjectFields = {
  title: '',
  logline: '',
  theme: '',
  genre_tone: '',
  runtime_minutes: null,
  runtime_note: '',
  purpose: '',
  references_note: '',
  character_count: null,
  actor_count: null,
  characters_note: '',
  available_locations: '',
  equipment: '',
  shooting_period: '',
  deadline: null,
  fixed_conditions: '',
}

export function toFields(p: Project): ProjectFields {
  const out = { ...EMPTY_PROJECT }
  for (const k of Object.keys(EMPTY_PROJECT) as (keyof ProjectFields)[]) {
    ;(out as Record<string, unknown>)[k] = p[k]
  }
  return out
}

type TextKey = { [K in keyof ProjectFields]: ProjectFields[K] extends string ? K : never }[keyof ProjectFields]
type NumKey = 'runtime_minutes' | 'character_count' | 'actor_count'

export type FieldDef =
  | { kind: 'text'; key: TextKey; label: string; placeholder?: string; multiline?: boolean }
  | { kind: 'number'; key: NumKey; label: string; unit: string }
  | { kind: 'date'; key: 'deadline'; label: string }

export interface SectionDef {
  no: number
  title: string
  hint?: string
  fields: FieldDef[]
}

/** 설계서 5장: 프로젝트 설명 10개 항목 */
export const PROJECT_SECTIONS: SectionDef[] = [
  { no: 1, title: '로그라인', hint: '모든 화면 맨 위에 고정됩니다. 한두 문장으로.', fields: [
    { kind: 'text', key: 'logline', label: '로그라인', placeholder: '예: 졸업 사진을 찍지 못한 소녀가 마지막 날 사진부 암실에서…', multiline: true },
  ] },
  { no: 2, title: '주제', fields: [
    { kind: 'text', key: 'theme', label: '주제', placeholder: '이 영화가 결국 말하고 싶은 것', multiline: true },
  ] },
  { no: 3, title: '장르·톤', fields: [
    { kind: 'text', key: 'genre_tone', label: '장르·톤', placeholder: '예: 성장 드라마, 잔잔하고 따뜻하게' },
  ] },
  { no: 4, title: '러닝타임', fields: [
    { kind: 'number', key: 'runtime_minutes', label: '러닝타임', unit: '분' },
    { kind: 'text', key: 'runtime_note', label: '보충', placeholder: '예: 출품 규정상 5분 이내' },
  ] },
  { no: 5, title: '목적·출품처', fields: [
    { kind: 'text', key: 'purpose', label: '목적·출품처', placeholder: '예: 교내 영화제, ○○ 청소년 영화제', multiline: true },
  ] },
  { no: 6, title: '레퍼런스 작품·장면', fields: [
    { kind: 'text', key: 'references_note', label: '레퍼런스', placeholder: '작품 이름, 참고할 장면, 링크', multiline: true },
  ] },
  { no: 7, title: '인물', fields: [
    { kind: 'number', key: 'character_count', label: '등장인물 수', unit: '명' },
    { kind: 'number', key: 'actor_count', label: '쓸 수 있는 배우 수', unit: '명' },
    { kind: 'text', key: 'characters_note', label: '보충', placeholder: '예: 1인 2역 가능, 성인 배우 없음', multiline: true },
  ] },
  { no: 8, title: '촬영 여건', fields: [
    { kind: 'text', key: 'available_locations', label: '쓸 수 있는 장소', placeholder: '예: 교실, 복도, 옥상(허가 필요)', multiline: true },
    { kind: 'text', key: 'equipment', label: '장비', placeholder: '예: 카메라 1대, 짐벌, LED 2개, 핀마이크', multiline: true },
    { kind: 'text', key: 'shooting_period', label: '촬영 가능 기간', placeholder: '예: 12월 둘째 주 방과 후, 주말' },
  ] },
  { no: 9, title: '마감일', fields: [{ kind: 'date', key: 'deadline', label: '마감일' }] },
  { no: 10, title: '고정 조건', hint: '원작 조건, 바꾸면 안 되는 설정', fields: [
    { kind: 'text', key: 'fixed_conditions', label: '고정 조건', placeholder: '예: 엔딩은 반드시 옥상, 주인공 이름 변경 금지', multiline: true },
  ] },
]

/** 마감일까지 남은 날 (오늘 = 0) */
export function daysUntil(date: string | null): number | null {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function dDayLabel(date: string | null): string | null {
  const n = daysUntil(date)
  if (n === null) return null
  if (n === 0) return 'D-DAY'
  return n > 0 ? `D-${n}` : `D+${-n}`
}
