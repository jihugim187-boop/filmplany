import { Link } from 'react-router-dom'
import { useProject } from '../features/project/projectContext.ts'
import { dDayLabel, PROJECT_SECTIONS, type FieldDef } from '../features/project/projectFields.ts'
import type { Project } from '../types/db.ts'

/** 설계서 6장 기능 목록 중 프로젝트 안에서 여는 것 (단계별로 열린다) */
const FEATURES = [
  '씬/컷 관리', '시나리오', '콘티', '샷리스트', '배역·스태프', '아이디어 보드', '일정', '오늘의 촬영 시트',
  '테이크 기록', '연속성 메모', '소품·의상', '장소 헌팅', '피드백', '진행 상황판', 'PDF 내보내기',
]

function fieldText(p: Project, f: FieldDef): string {
  if (f.kind === 'number') return p[f.key] === null ? '' : `${p[f.key]}${f.unit}`
  if (f.kind === 'date') {
    if (!p.deadline) return ''
    const [y, m, d] = p.deadline.split('-')
    return `${y}년 ${Number(m)}월 ${Number(d)}일 (${dDayLabel(p.deadline)})`
  }
  return p[f.key]
}

export default function ProjectHomePage() {
  const { project } = useProject()
  const filled = PROJECT_SECTIONS.filter((s) => s.fields.some((f) => fieldText(project, f)))

  return (
    <>
      <section className="block">
        <div className="page-head">
          <h2>프로젝트 설명</h2>
          <Link to={`/projects/${project.id}/edit`} className="btn-secondary">
            수정
          </Link>
        </div>
        <p className="muted small-text">
          10개 항목 중 {filled.length}개 작성됨
        </p>

        <dl className="desc-list">
          {PROJECT_SECTIONS.map((s) => {
            const parts = s.fields
              .map((f) => ({ label: f.label, text: fieldText(project, f) }))
              .filter((x) => x.text)
            return (
              <div className="desc-item" key={s.no}>
                <dt>
                  <span className="section-no">{s.no}</span> {s.title}
                </dt>
                <dd>
                  {parts.length === 0 ? (
                    <span className="muted">비어 있음</span>
                  ) : (
                    parts.map((x, i) => (
                      <p key={i} className="pre-wrap">
                        {s.fields.length > 1 && <span className="muted">{x.label}: </span>}
                        {x.text}
                      </p>
                    ))
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </section>

      <section className="block">
        <h2>기능</h2>
        <p className="muted small-text">단계별로 하나씩 열립니다.</p>
        <ul className="feature-grid">
          {FEATURES.map((f) => (
            <li key={f} className="feature-tile feature-soon" aria-disabled="true">
              <span>{f}</span>
              <span className="muted small-text">준비 중</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
