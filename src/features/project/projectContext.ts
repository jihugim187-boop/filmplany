import { useOutletContext } from 'react-router-dom'
import type { Project } from '../../types/db.ts'

export interface ProjectOutletContext {
  project: Project
  reload: () => Promise<void>
}

/** 프로젝트 안 화면에서 현재 프로젝트를 꺼낸다 (ProjectLayout이 넣어줌) */
export function useProject(): ProjectOutletContext {
  return useOutletContext<ProjectOutletContext>()
}
