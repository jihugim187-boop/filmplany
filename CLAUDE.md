# 필름플래니 (filmplany) 설계서

> **모든 작업은 이 설계서를 먼저 읽고 따른다. 기능이 바뀌면 설계서부터 고친다.**
> 코드와 설계서가 다르면 설계서가 기준이다. 설계서를 고친 뒤 코드를 맞춘다.

---

## 0. 작업 규칙

- **한 번에 한 단계만.** 단계가 끝나면 `npm run build`가 되는지 확인하고 PR을 만든다.
- 사용자가 Supabase에서 직접 해야 할 일(SQL 실행 등)이 있으면 **단계 끝에 순서대로 정확히** 알려준다.
- 사용자는 **아이패드와 폰만** 쓴다. 컴퓨터나 터미널이 필요한 방법은 안내하지 않는다.
  (GitHub 웹, Supabase 대시보드 웹, 사파리에서 할 수 있는 방법만 안내)
- 모든 화면은 **아이패드·폰 터치로 동작하는지** 기준으로 만든다.
- 새 단계에서 DB 구조를 바꿔야 하면 `supabase/schema.sql`을 고치고(여러 번 실행해도 안전한 형태 유지),
  이 설계서의 [9. 데이터](#9-데이터) 표도 함께 고친다.

---

## 1. 앱 개요

- 고등학교 영상부가 **단편 영화를 함께 기획**하는 웹앱.
- 주 사용 기기: **아이패드와 폰**. UI는 **전부 한국어**.
- **비용 0원 원칙**
  - AI API(Anthropic, OpenAI 등) **사용 금지**.
  - 데이터: **Supabase 무료 플랜**. 배포: **GitHub Pages**.

---

## 2. 기술 구성

| 항목 | 내용 |
|---|---|
| 프레임워크 | Vite + React + TypeScript |
| 데이터 | Supabase JS 클라이언트 (Realtime 포함) |
| 환경변수 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — GitHub Actions Secrets에서 빌드 때 주입 (레포 Secrets에 저장되어 있음) |
| 배포 | `main` 브랜치에 머지되면 GitHub Actions가 GitHub Pages로 자동 배포 (`.github/workflows/deploy.yml`) |
| base 경로 | Vite `base: '/filmplany/'` (레포 이름과 같아야 함) |
| 라우팅 | **HashRouter** (GitHub Pages 새로고침 404 방지). 주소 형태: `.../filmplany/#/projects/...` |
| 반응형 | 아이패드 가로·세로, 폰 모두. **터치 조작 기준** (터치 영역 최소 44px) |
| 사진 | 업로드 전 브라우저에서 **긴 변 1600px, JPEG 품질 0.8**로 압축 후 Supabase Storage에 업로드 (무료 저장 1GB 절약) |
| 배포 주소 | https://jihugim187-boop.github.io/filmplany/ |

### 폴더 구조

```
.github/workflows/deploy.yml   빌드(PR) + 배포(main)
supabase/schema.sql            전체 DB 설계 (한 번에 완성, 여러 번 실행해도 안전)
public/                        정적 파일 (아이콘, 이후 PWA manifest)
src/
  main.tsx                     진입점
  App.tsx                      HashRouter + 라우트
  lib/
    supabase.ts                Supabase 클라이언트(단 하나), 연결 확인, MEDIA_BUCKET
    constants.ts               역할·샷 크기·앵글·움직임 등 고정 선택지 (DB check 제약과 같은 값)
  pages/                       라우트 단위 화면
  components/                  여러 화면에서 쓰는 UI 조각 (로그라인 바, 프로필 전환 버튼 등)
  features/<기능>/             기능별 화면·훅·로직 (예: features/storyboard, features/prompt)
  hooks/                       공통 훅 (현재 프로필, Realtime 구독 등)
  types/                       DB 타입
  styles/global.css            디자인 토큰 + 공통 스타일
```

---

## 3. 계정 (로그인·비밀번호 없음)

- 첫 접속 시 **넷플릭스식 프로필 화면**: 기존 프로필 중 고르거나 새 프로필 추가.
- 프로필 정보: **이름, 역할(여러 개 선택), 프로필 색, 한 줄 소개**.
  - 역할: 감독 / 조감독 / 촬영 / 조명 / 음향 / 편집 / 배우 / 미술 / 기타
- 고른 프로필은 **그 기기 localStorage**에 저장해 다음부터 자동 진입.
- **모든 화면 상단에 프로필 전환 버튼.**
- **모든 데이터에 작성자 프로필 id를 남긴다** (`created_by`, 수정 시 `updated_by`).

---

## 4. 전체 구조

- 프로젝트 여러 개. **프로젝트 목록 → 프로젝트를 열면 그 안에 모든 기능.**
- **모든 기능은 씬(S#)과 컷(C#) 공통 번호로 연결된다.** 컷은 씬의 하위.
  - 시나리오, 콘티, 샷리스트, 배역표, 일정, 오늘의 촬영 시트, 테이크 기록, 연속성 메모,
    소품·의상, 장소 갤러리, 진행 상황판이 **모두 같은 씬/컷 데이터를 참조**한다.
  - **기능마다 번호를 따로 만들지 않는다.** 다른 표는 `scene_id`, `cut_id`로만 연결한다.
  - 번호 규칙: S# = 프로젝트 안 씬의 `position` 순서(1부터), C# = 씬 안 컷의 `position` 순서(1부터).
    표시는 항상 `src/lib/constants.ts`의 `sceneLabel`, `cutLabel`로 (예: `S#3 C#2`).
    씬·컷 순서를 바꾸면 모든 기능의 번호가 함께 바뀐다.
- 프로젝트 안 **모든 화면 맨 위에 프로젝트 로그라인 한 줄 고정 바.**

---

## 5. 프로젝트 설명 (모든 기능과 프롬프트의 기준, 항목별 입력칸)

| 번호 | 항목 | DB 컬럼 (`projects`) |
|---|---|---|
| 1 | 로그라인 | `logline` |
| 2 | 주제 | `theme` |
| 3 | 장르·톤 | `genre_tone` |
| 4 | 러닝타임 | `runtime_minutes`, `runtime_note` |
| 5 | 목적·출품처 | `purpose` |
| 6 | 레퍼런스 작품·장면 | `references_note` |
| 7 | 인물 (등장인물 수, 쓸 수 있는 배우 수) | `character_count`, `actor_count`, `characters_note` |
| 8 | 촬영 여건 (쓸 수 있는 장소, 장비, 촬영 가능 기간) | `available_locations`, `equipment`, `shooting_period` |
| 9 | 마감일 | `deadline` |
| 10 | 고정 조건 (원작 조건, 바꾸면 안 되는 설정) | `fixed_conditions` |

---

## 6. 기능 목록

1. **프로필 선택** — [3. 계정](#3-계정-로그인비밀번호-없음) 항목.
2. **프로젝트 목록·생성·수정** + 프로젝트 설명 + 로그라인 고정 바.
3. **씬/컷 관리** — 씬 추가·순서 변경·삭제, 씬 안에 컷 추가·순서 변경·삭제.
4. **시나리오 공동 편집 표**
   - 행 = 씬 번호 / 장소 / 낮·밤 / 샷 / 대사·지문 / 등장인물.
   - **칸 단위로 저장.**
   - 다른 사람이 편집 중인 칸에 **"○○ 편집 중" 실시간 표시** (Supabase Realtime presence).
   - **버전 기록**: 저장 시점 스냅샷 목록, 보기·복원.
5. **콘티 (컷 단위)**
   - (a) 위에서 내려다본 **평면도**에 카메라·피사체(인물)·조명·소품 아이콘을 **드래그로 배치**, **회전 핸들**로 방향 표시, 카메라 움직임은 **화살표**로 표시.
   - (b) **구도 칸**: 손가락·펜슬 스케치 또는 사진 업로드.
   - (c) **태그**
     - 샷 크기: ECU / CU / MCU / MS / MLS / FS / LS / ELS
     - 앵글: 아이레벨 / 하이 / 로우 / 버드아이 / 더치
     - 움직임: 고정 / 팬 / 틸트 / 달리 / 트래킹 / 핸드헬드 / 줌
     - 렌즈 메모
   - (d) **컷 설명**.
6. **샷리스트**
   - (규칙 기반) 콘티 데이터로 자동 생성 + **장소별·인물별·카메라 셋업별**로 묶어 촬영 순서 제안.
   - (프롬프트) 프롬프트 복사 → 결과 붙여넣기 → 미리보기 → 승인 후 반영.
7. **배역·스태프 표** — 등장인물-배우 배정, 씬별 필요 인원, 스태프 역할 배정. 프롬프트 복사/붙여넣기 지원.
8. **아이디어 보드** — 사용자별 열, 포스트잇 카드, 투표, 득표순 정렬.
9. **일정** — 가능 시간 투표(날짜×시간 칸 체크) → 겹치는 시간 강조 → 촬영 일정 확정(날짜, 콜타임, 장소, 찍을 씬/컷, 필요 인원).
10. **오늘의 촬영 시트** — 촬영 일정에서 자동 생성. 오늘 찍을 컷, 콜타임, 장소, 인원, 장비 체크리스트, 컷 완료 체크.
11. **테이크 기록** — 씬-컷-테이크 번호, OK/NG/킵, 메모. **OK 테이크만 보기** 필터.
12. **연속성 메모** — 컷별 의상·소품·머리·위치 사진 + 메모.
13. **소품·의상 리스트** — 씬별 필요 목록, 담당자, 준비 상태.
14. **장소 헌팅 갤러리** — 씬별 후보 장소 사진 업로드, **이모지 반응**(인스타 DM 공감처럼 누가 눌렀는지 표시), 촬영 허가 필요 여부, 좋은 시간대 메모, 최종 선택 표시.
15. **피드백** — 영상 링크 + 타임코드(분:초) 댓글, 해결 체크.
16. **진행 상황판** — 씬별 **기획 → 촬영 → 편집 → 완료**. 다른 기능 데이터로 자동 반영 + 수동 변경 가능.
17. **PDF 내보내기** — 샷리스트, 오늘의 촬영 시트, 콘티, 배역·스태프 표.
18. **홈 화면 앱** — PWA manifest, 앱 아이콘, 사파리 "홈 화면에 추가" 시 전체 화면 실행.

### 기능별 세부 규칙 (구현 기준)

- **진행 상황판 자동 반영 규칙** (`scenes.progress_status`, `progress_manual`)
  - 기본값 `기획`.
  - 씬의 컷 중 하나라도 촬영 일정(`shoot_day_cuts`)에 잡히면 → `촬영`.
  - 씬의 모든 컷이 완료 체크(`shoot_day_cuts.completed`)되었거나 OK 테이크가 있으면 → `편집`.
  - `완료`는 수동으로만.
  - 사용자가 수동으로 바꾸면 `progress_manual = true`가 되어 자동 반영을 멈춘다. "자동으로 되돌리기" 버튼으로 해제.
- **샷리스트 규칙 기반 묶기**: 장소(씬의 `location`) → 카메라 셋업(`cuts.camera_setup`) → 인물(`scene_characters`) 순으로 묶어,
  같은 묶음은 연속 촬영하도록 `shoot_order`를 매긴다. 결과는 `shotlist_items`(`source = 'rule'`).
- **시나리오 버전**: "버전 저장" 시 그 시점 씬 행 전체 + `scene_characters`를 `scenario_versions.snapshot`(JSON)에 저장. 복원 = 스냅샷 값으로 씬 행을 덮어쓰기 (복원 전 현재 상태도 자동 스냅샷).
- **편집 중 표시**: Realtime presence 채널 `project:{project_id}:scenario`에 `{ profileId, name, color, cell: "{scene_id}:{column}" }` 를 보낸다. 칸 저장은 포커스가 빠질 때(blur) 해당 컬럼 하나만 update.
- **사진 압축**: 공통 함수 하나(`src/lib/image.ts` 예정)로만 업로드. 긴 변 1600px, JPEG 0.8. 경로 `{project_id}/{기능}/{uuid}.jpg`.
- **스케치**: 스케치도 PNG/JPEG 이미지로 만들어 media 버킷에 저장하고 `cuts.composition_path`에 경로 저장.
- **타임코드**: 입력은 `분:초`, 저장은 초(`timecode_seconds`).

---

## 7. AI 방식 (API 금지)

- **규칙 기반**: 계산·정렬·묶기만으로 자동 정리.
- **프롬프트 복사**
  1. 앱이 **프로젝트 설명 10개 항목 + 관련 데이터**(시나리오, 콘티 등)를 미리 만든 틀에 채워 프롬프트를 만들고 **클립보드에 복사**.
  2. 프롬프트는 답을 **정해진 JSON 코드 블록 형식**으로 달라고 지시한다.
  3. 사용자가 Claude 앱 등에서 받은 답을 **붙여넣으면** 앱이 **파싱 → 미리보기 → 승인 후 반영**.
  4. 파싱 실패 시 **무엇이 잘못됐는지 한국어로** 알려준다 (예: "3번째 항목에 cut 번호가 없습니다").
- 이 기능은 **공통 모듈**(`src/features/prompt/`)로 만들어 샷리스트, 배역표 등에서 재사용한다.
  - 모듈이 받는 것: 프롬프트 틀, JSON 형식 설명, 검증 함수(한국어 오류 메시지 반환), 미리보기 컴포넌트, 반영 함수.
  - 붙여넣은 답에서 ```` ```json ```` 코드 블록을 찾아 파싱(없으면 전체 텍스트에서 JSON 시도).
  - 기록은 `prompt_runs` 표에 남긴다 (`kind`: shotlist / casting / other).
  - JSON 안의 씬·컷은 **S#/C# 번호**로 주고받고, 반영할 때 앱이 `scene_id`/`cut_id`로 바꾼다.

---

## 8. 디자인

- 밝고 깔끔한 **노트 느낌**.
- **흰 배경**, **연노랑 포스트잇 카드**, 포인트 색은 **남색 `#2B4C7E`**. 글씨는 **진한 회색**.
- **여백 넉넉하게, 장식 최소화.**
- 토큰 (`src/styles/global.css`):

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-bg` | `#FFFFFF` | 배경 |
| `--color-text` | `#333333` | 본문 글씨 (진한 회색) |
| `--color-muted` | `#6B6B6B` | 보조 글씨 |
| `--color-line` | `#E6E6E6` | 구분선 |
| `--color-accent` | `#2B4C7E` | 포인트 (남색) |
| `--color-note` | `#FFF6C7` | 포스트잇 카드 (연노랑) |
| `--touch` | `44px` | 터치 최소 크기 |

---

## 9. 데이터

### 원칙

- 전체 설계는 `supabase/schema.sql` 한 파일. **여러 번 실행해도 안전**하게 작성한다.
- **프로젝트에 속한 모든 테이블은 `project_id`를 가진다** (연결 표 포함). 프로젝트 삭제 시 전부 함께 삭제(cascade).
- 모든 표에 작성자 `created_by`(프로필 id), 수정 가능한 표는 `updated_by`, `updated_at`(트리거로 자동 갱신).
- 프로필이 삭제돼도 데이터는 남는다 (`created_by`는 null로).
- 모든 표는 Realtime(`supabase_realtime` publication)에 등록되어 있다.

### 보안 (RLS) — **링크를 아는 사람만 쓰는 구조**

- 로그인이 없으므로 누구나 앱 주소와 anon 키(빌드에 포함됨)로 읽고 쓸 수 있다.
  즉 **링크를 아는 사람만 쓰는 구조**이며, 링크를 외부에 퍼뜨리지 않는 것이 보안의 전부다.
- Supabase 프로젝트에 자동 RLS가 켜져 있으므로, **테이블마다** RLS를 켜고 `anon`(+`authenticated`) 역할에
  `select / insert / update / delete`를 허용하는 정책 4개(`anon_select`, `anon_insert`, `anon_update`, `anon_delete`)를 **명시적으로** 만든다.
- 개인정보(전화번호 등)는 저장하지 않는다.

### Storage

- 버킷 **`media` (public)**. 최대 5MB, `image/jpeg`, `image/png`, `image/webp`만.
- 정책: `media` 버킷 안에서 anon 읽기·올리기·수정·삭제 허용.
- 경로: `{project_id}/{기능}/{uuid}.jpg` (프로젝트 밖 파일은 `common/...`).

### 테이블 목록

| 표 | 기능 | 주요 컬럼 | 관계 |
|---|---|---|---|
| `profiles` | 1 프로필 | `name`, `roles text[]`(9개 역할 중), `color`(#RRGGBB), `bio` | 프로젝트에 속하지 않는 유일한 표 |
| `projects` | 2 프로젝트 | `title` + [5. 프로젝트 설명](#5-프로젝트-설명-모든-기능과-프롬프트의-기준-항목별-입력칸) 10개 항목 컬럼 | |
| `scenes` | 3·4·7·16 씬 | `position`, `location`, `time_of_day`, `shot_note`, `content`(대사·지문), `required_people`, `required_note`, `progress_status`(기획/촬영/편집/완료), `progress_manual` | → projects |
| `cuts` | 3·5 컷·콘티 | `position`, `description`, `shot_size`, `angle`, `movement`, `lens_note`, `floorplan jsonb`, `composition_type`(sketch/photo), `composition_path`, `camera_setup`, `estimated_minutes` | → scenes |
| `scenario_versions` | 4 버전 기록 | `label`, `snapshot jsonb` | → projects |
| `characters` | 7 등장인물 | `position`, `name`, `description`, `actor_profile_id`(부원 배우), `actor_name`(외부 배우) | → projects, profiles |
| `scene_characters` | 4·7 씬별 등장인물 | PK(`scene_id`, `character_id`) | → scenes, characters |
| `staff_assignments` | 7 스태프 | `profile_id`, `role`, `scene_id`(비면 전체 담당), `note` | → profiles, scenes |
| `shotlist_items` | 6 샷리스트 | `cut_id`(프로젝트당 1줄), `shoot_order`, `group_label`, `note`, `source`(rule/prompt/manual) | → cuts |
| `prompt_runs` | 7장 공통 모듈 | `kind`(shotlist/casting/other), `prompt_text`, `response_text`, `parsed jsonb`, `status`(copied/parsed/applied/discarded/failed), `error_message`, `applied_at` | → projects |
| `ideas` | 8 아이디어 | `content`, `color`, `position`, `created_by`(= 사용자별 열) | → projects |
| `idea_votes` | 8 투표 | PK(`idea_id`, `profile_id`) | → ideas, profiles |
| `locations` | 14 장소 후보 | `scene_id`, `name`, `address`, `permit_required`, `permit_note`, `best_time_note`, `memo`, `is_selected` | → scenes |
| `location_photos` | 14 장소 사진 | `location_id`, `image_path`, `caption`, `position` | → locations |
| `location_reactions` | 14 이모지 반응 | PK(`location_id`, `profile_id`, `emoji`) | → locations, profiles |
| `availability_polls` | 9 가능 시간 투표 | `title`, `dates date[]`, `time_slots text[]`, `slot_minutes`, `is_closed` | → projects |
| `availability_votes` | 9 투표 칸 | PK(`poll_id`, `profile_id`, `slot_date`, `slot_time`) | → polls, profiles |
| `shoot_days` | 9·10 촬영 일정 | `shoot_date`, `call_time`, `end_time`, `location_id`, `location_text`, `note`, `poll_id` | → locations, polls |
| `shoot_day_cuts` | 9·10 찍을 컷 + 완료 체크 | PK(`shoot_day_id`, `cut_id`), `position`, `completed`, `completed_by`, `completed_at` | → shoot_days, cuts |
| `shoot_day_people` | 9·10 필요 인원 | PK(`shoot_day_id`, `profile_id`), `role` | → shoot_days, profiles |
| `shoot_day_equipment` | 10 장비 체크리스트 | `name`, `position`, `checked`, `checked_by` | → shoot_days |
| `takes` | 11 테이크 | `cut_id`, `shoot_day_id`, `take_number`(컷마다 고유), `result`(OK/NG/KEEP), `memo` | → cuts, shoot_days |
| `continuity_notes` | 12 연속성 | `cut_id`, `category`(의상/소품/머리/위치/기타), `memo`, `image_path` | → cuts |
| `props` | 13 소품·의상 | `kind`(소품/의상), `name`, `assignee_id`, `status`(필요/준비중/준비완료), `note`, `image_path` | → profiles |
| `prop_scenes` | 13 씬별 필요 목록 | PK(`prop_id`, `scene_id`) | → props, scenes |
| `feedback_videos` | 15 영상 링크 | `title`, `url`, `scene_id` | → scenes |
| `feedback_comments` | 15 타임코드 댓글 | `video_id`, `timecode_seconds`, `content`, `resolved`, `resolved_by`, `resolved_at` | → feedback_videos |

- 모든 표 공통: `id`(uuid, 연결 표는 복합 PK), `project_id`(profiles·projects 제외), `created_by`, `created_at`. 수정 가능한 표는 `updated_by`, `updated_at`.
- 17 PDF 내보내기, 18 PWA는 표가 필요 없다 (기존 데이터로 생성 / 정적 파일).
- 16 진행 상황판은 `scenes`의 컬럼을 쓰고, 10 오늘의 촬영 시트는 `shoot_days` 계열 표에서 오늘 날짜를 골라 만든다.

#### `cuts.floorplan` JSON 형식

```json
{
  "items": [
    { "id": "uuid", "type": "camera | person | light | prop", "x": 0.42, "y": 0.6, "rotation": 90, "label": "A캠" }
  ],
  "arrows": [
    { "id": "uuid", "itemId": "카메라 item id", "from": { "x": 0.4, "y": 0.6 }, "to": { "x": 0.7, "y": 0.6 } }
  ]
}
```

- `x`, `y`는 평면도 크기 대비 0~1 비율 (기기 화면 크기가 달라도 같은 위치). `rotation`은 도(0 = 위쪽).

---

## 10. 단계 계획

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 설계서, 뼈대, schema.sql 전체, 자동 배포, 준비 중 화면 + 연결 상태 | 완료 |
| 2 | 프로필 선택 + 프로젝트 목록·설명 + 로그라인 바 + 프로필 전환 | |
| 3 | 씬/컷 관리 | |
| 4 | 시나리오 공동 편집 표 + presence + 버전 | |
| 5 | 콘티 (평면도, 구도, 태그) + 사진 압축 업로드 공통 함수 | |
| 6 | 프롬프트 공통 모듈 + 샷리스트 | |
| 7 | 배역·스태프 표 | |
| 8 | 아이디어 보드 | |
| 9 | 일정 + 오늘의 촬영 시트 | |
| 10 | 테이크 기록 + 연속성 메모 | |
| 11 | 소품·의상 + 장소 헌팅 갤러리 | |
| 12 | 피드백 + 진행 상황판 | |
| 13 | PDF 내보내기 + PWA | |

순서는 사용자와 상의해 바꿀 수 있다. 바꾸면 이 표부터 고친다.
