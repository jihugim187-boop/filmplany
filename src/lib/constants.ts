// 설계서(CLAUDE.md)의 고정 선택지. DB의 check 제약과 값이 같아야 한다.

export const ROLES = ['감독', '조감독', '촬영', '조명', '음향', '편집', '배우', '미술', '기타'] as const
export type Role = (typeof ROLES)[number]

export const SHOT_SIZES = ['ECU', 'CU', 'MCU', 'MS', 'MLS', 'FS', 'LS', 'ELS'] as const
export const ANGLES = ['아이레벨', '하이', '로우', '버드아이', '더치'] as const
export const MOVEMENTS = ['고정', '팬', '틸트', '달리', '트래킹', '핸드헬드', '줌'] as const
export const TIME_OF_DAY = ['낮', '밤', '아침', '저녁', '새벽'] as const

export const TAKE_RESULTS = ['OK', 'NG', 'KEEP'] as const
export const PROGRESS_STAGES = ['기획', '촬영', '편집', '완료'] as const
export const PREP_STATUS = ['필요', '준비중', '준비완료'] as const

/** 씬/컷 표시 형식: S#3 C#2 */
export const sceneLabel = (n: number) => `S#${n}`
export const cutLabel = (sceneNo: number, cutNo: number) => `S#${sceneNo} C#${cutNo}`
