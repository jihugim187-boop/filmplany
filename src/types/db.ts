// supabase/schema.sql 의 표와 1:1로 맞춘다. 표가 바뀌면 여기도 고친다.
import type { Role } from '../lib/constants.ts'

export interface Profile {
  id: string
  name: string
  roles: Role[]
  color: string
  bio: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  logline: string
  theme: string
  genre_tone: string
  runtime_minutes: number | null
  runtime_note: string
  purpose: string
  references_note: string
  character_count: number | null
  actor_count: number | null
  characters_note: string
  available_locations: string
  equipment: string
  shooting_period: string
  deadline: string | null
  fixed_conditions: string
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

/** 프로젝트 설명 입력 폼에서 다루는 칸 (id·작성자·시각 제외) */
export type ProjectFields = Omit<Project, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>
