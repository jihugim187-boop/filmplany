-- =====================================================================
-- 필름플래니 (filmplany) 전체 데이터베이스 설계
-- Supabase SQL Editor에 이 파일 전체를 붙여넣고 Run 한 번.
-- 여러 번 실행해도 안전하다 (이미 있는 건 건너뛰고, 정책은 다시 만든다).
--
-- ※ 로그인이 없는 앱이다. "링크를 아는 사람만 쓰는 구조"이므로
--    anon 역할에 읽기·쓰기를 모두 허용한다. 링크를 외부에 퍼뜨리지 말 것.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 공통: updated_at 자동 갱신
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================
-- 1. 프로필 (기기 localStorage에 id 저장, 로그인 없음)
-- =====================================================================
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 30),
  roles       text[] not null default '{}'
              check (roles <@ array['감독','조감독','촬영','조명','음향','편집','배우','미술','기타']::text[]),
  color       text not null default '#2B4C7E' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  bio         text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- 2. 프로젝트 + 프로젝트 설명 10개 항목
-- =====================================================================
create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (char_length(title) between 1 and 60),
  logline             text not null default '',   -- 1 로그라인 (상단 고정 바)
  theme               text not null default '',   -- 2 주제
  genre_tone          text not null default '',   -- 3 장르·톤
  runtime_minutes     integer check (runtime_minutes is null or runtime_minutes >= 0), -- 4 러닝타임(분)
  runtime_note        text not null default '',   -- 4 러닝타임 보충 (예: "5분 이내")
  purpose             text not null default '',   -- 5 목적·출품처
  references_note     text not null default '',   -- 6 레퍼런스 작품·장면
  character_count     integer check (character_count is null or character_count >= 0), -- 7 등장인물 수
  actor_count         integer check (actor_count is null or actor_count >= 0),         -- 7 쓸 수 있는 배우 수
  characters_note     text not null default '',   -- 7 인물 보충
  available_locations text not null default '',   -- 8 쓸 수 있는 장소
  equipment           text not null default '',   -- 8 장비
  shooting_period     text not null default '',   -- 8 촬영 가능 기간
  deadline            date,                       -- 9 마감일
  fixed_conditions    text not null default '',   -- 10 고정 조건 (원작 조건, 바꾸면 안 되는 설정)
  created_by          uuid references public.profiles(id) on delete set null,
  updated_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =====================================================================
-- 3. 씬 / 컷 (모든 기능이 공유하는 공통 번호의 원본)
--    S# = 프로젝트 안 position 순서(1부터), C# = 씬 안 position 순서(1부터)
--    씬 행은 시나리오 표의 한 행이기도 하다.
-- =====================================================================
create table if not exists public.scenes (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  position         integer not null default 0,
  -- 시나리오 표 칸 (칸 단위 저장)
  location         text not null default '',             -- 장소
  time_of_day      text not null default '',             -- 낮·밤
  shot_note        text not null default '',             -- 샷
  content          text not null default '',             -- 대사·지문
  -- 배역표: 씬별 필요 인원
  required_people  integer check (required_people is null or required_people >= 0),
  required_note    text not null default '',
  -- 진행 상황판
  progress_status  text not null default '기획' check (progress_status in ('기획','촬영','편집','완료')),
  progress_manual  boolean not null default false,       -- true면 자동 반영 안 함
  created_by       uuid references public.profiles(id) on delete set null,
  updated_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists scenes_project_position_idx on public.scenes(project_id, position);

create table if not exists public.cuts (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  scene_id           uuid not null references public.scenes(id) on delete cascade,
  position           integer not null default 0,
  -- 콘티 (d) 컷 설명
  description        text not null default '',
  -- 콘티 (c) 태그
  shot_size          text check (shot_size in ('ECU','CU','MCU','MS','MLS','FS','LS','ELS')),
  angle              text check (angle in ('아이레벨','하이','로우','버드아이','더치')),
  movement           text check (movement in ('고정','팬','틸트','달리','트래킹','핸드헬드','줌')),
  lens_note          text not null default '',
  -- 콘티 (a) 평면도: {"items":[{"id","type":"camera|person|light|prop","x","y","rotation","label"}],
  --                    "arrows":[{"id","from":{x,y},"to":{x,y},"itemId"}]}  (x,y는 0~1 비율)
  floorplan          jsonb not null default '{"items":[],"arrows":[]}'::jsonb,
  -- 콘티 (b) 구도: 스케치(PNG로 저장) 또는 사진. 둘 다 media 버킷 경로
  composition_type   text check (composition_type in ('sketch','photo')),
  composition_path   text,
  -- 샷리스트 묶기용 카메라 셋업 이름 (같은 셋업끼리 연속 촬영)
  camera_setup       text not null default '',
  estimated_minutes  integer check (estimated_minutes is null or estimated_minutes >= 0),
  created_by         uuid references public.profiles(id) on delete set null,
  updated_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists cuts_project_idx on public.cuts(project_id);
create index if not exists cuts_scene_position_idx on public.cuts(scene_id, position);

-- =====================================================================
-- 4. 시나리오 버전 기록 (저장 시점 스냅샷)
--    snapshot = {"scenes":[씬 행 전체], "scene_characters":[...]}
-- =====================================================================
create table if not exists public.scenario_versions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  label       text not null default '',
  snapshot    jsonb not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists scenario_versions_project_idx on public.scenario_versions(project_id, created_at desc);

-- =====================================================================
-- 7. 배역·스태프
-- =====================================================================
create table if not exists public.characters (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  position          integer not null default 0,
  name              text not null check (char_length(name) between 1 and 40),
  description       text not null default '',
  actor_profile_id  uuid references public.profiles(id) on delete set null, -- 영상부원 배우
  actor_name        text not null default '',                               -- 외부 배우 이름
  created_by        uuid references public.profiles(id) on delete set null,
  updated_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists characters_project_idx on public.characters(project_id, position);

-- 씬 ↔ 등장인물 (시나리오 표 "등장인물" 칸, 배역표 씬별 인원, 촬영 시트 인원)
create table if not exists public.scene_characters (
  project_id    uuid not null references public.projects(id) on delete cascade,
  scene_id      uuid not null references public.scenes(id) on delete cascade,
  character_id  uuid not null references public.characters(id) on delete cascade,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (scene_id, character_id)
);
create index if not exists scene_characters_project_idx on public.scene_characters(project_id);
create index if not exists scene_characters_character_idx on public.scene_characters(character_id);

-- 스태프 역할 배정 (scene_id가 비어 있으면 프로젝트 전체 담당)
create table if not exists public.staff_assignments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('감독','조감독','촬영','조명','음향','편집','배우','미술','기타')),
  scene_id    uuid references public.scenes(id) on delete cascade,
  note        text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists staff_assignments_project_idx on public.staff_assignments(project_id);
create index if not exists staff_assignments_profile_idx on public.staff_assignments(profile_id);
create index if not exists staff_assignments_scene_idx on public.staff_assignments(scene_id);

-- =====================================================================
-- 6. 샷리스트 (촬영 순서). 컷 하나당 한 줄.
--    source: rule(규칙 기반 자동) / prompt(프롬프트 결과 승인) / manual(직접 수정)
-- =====================================================================
create table if not exists public.shotlist_items (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  cut_id       uuid not null references public.cuts(id) on delete cascade,
  shoot_order  integer not null default 0,
  group_label  text not null default '',   -- 묶음 이름 (예: "교실 · 셋업A")
  note         text not null default '',
  source       text not null default 'rule' check (source in ('rule','prompt','manual')),
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (project_id, cut_id)
);
create index if not exists shotlist_items_project_order_idx on public.shotlist_items(project_id, shoot_order);
create index if not exists shotlist_items_cut_idx on public.shotlist_items(cut_id);

-- 프롬프트 복사/붙여넣기 기록 (공통 모듈, kind로 기능 구분)
create table if not exists public.prompt_runs (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  kind           text not null check (kind in ('shotlist','casting','other')),
  prompt_text    text not null,
  response_text  text,
  parsed         jsonb,
  status         text not null default 'copied' check (status in ('copied','parsed','applied','discarded','failed')),
  error_message  text,
  applied_at     timestamptz,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists prompt_runs_project_idx on public.prompt_runs(project_id, kind, created_at desc);

-- =====================================================================
-- 8. 아이디어 보드 (사용자별 열 = created_by, 포스트잇, 투표)
-- =====================================================================
create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 1000),
  color       text not null default '#FFF6C7' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position    integer not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ideas_project_idx on public.ideas(project_id, created_by);

create table if not exists public.idea_votes (
  project_id  uuid not null references public.projects(id) on delete cascade,
  idea_id     uuid not null references public.ideas(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade, -- 투표한 사람 = 작성자
  created_at  timestamptz not null default now(),
  primary key (idea_id, profile_id)
);
create index if not exists idea_votes_project_idx on public.idea_votes(project_id);

-- =====================================================================
-- 14. 장소 헌팅 갤러리 (일정의 장소로도 참조)
-- =====================================================================
create table if not exists public.locations (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  scene_id         uuid references public.scenes(id) on delete set null,  -- 어느 씬 후보인지
  name             text not null check (char_length(name) between 1 and 60),
  address          text not null default '',
  permit_required  boolean not null default false,
  permit_note      text not null default '',
  best_time_note   text not null default '',
  memo             text not null default '',
  is_selected      boolean not null default false,   -- 최종 선택
  created_by       uuid references public.profiles(id) on delete set null,
  updated_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists locations_project_idx on public.locations(project_id);
create index if not exists locations_scene_idx on public.locations(scene_id);

create table if not exists public.location_photos (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  location_id  uuid not null references public.locations(id) on delete cascade,
  image_path   text not null,          -- media 버킷 경로
  caption      text not null default '',
  position     integer not null default 0,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists location_photos_location_idx on public.location_photos(location_id, position);
create index if not exists location_photos_project_idx on public.location_photos(project_id);

-- 이모지 반응: 누가 어떤 이모지를 눌렀는지 (한 사람이 여러 이모지 가능, 같은 이모지는 한 번)
create table if not exists public.location_reactions (
  project_id   uuid not null references public.projects(id) on delete cascade,
  location_id  uuid not null references public.locations(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  emoji        text not null check (char_length(emoji) between 1 and 16),
  created_at   timestamptz not null default now(),
  primary key (location_id, profile_id, emoji)
);
create index if not exists location_reactions_project_idx on public.location_reactions(project_id);

-- =====================================================================
-- 9. 일정: 가능 시간 투표 → 촬영 일정 확정
-- =====================================================================
create table if not exists public.availability_polls (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  title         text not null default '가능 시간 투표',
  dates         date[] not null default '{}',          -- 후보 날짜들 (열)
  time_slots    text[] not null default '{}',          -- 후보 시간 칸들 (행), 예: {'09:00','10:00'}
  slot_minutes  integer not null default 60 check (slot_minutes > 0),
  is_closed     boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists availability_polls_project_idx on public.availability_polls(project_id);

create table if not exists public.availability_votes (
  project_id  uuid not null references public.projects(id) on delete cascade,
  poll_id     uuid not null references public.availability_polls(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  slot_date   date not null,
  slot_time   text not null,
  created_at  timestamptz not null default now(),
  primary key (poll_id, profile_id, slot_date, slot_time)
);
create index if not exists availability_votes_project_idx on public.availability_votes(project_id);

create table if not exists public.shoot_days (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  poll_id        uuid references public.availability_polls(id) on delete set null,
  shoot_date     date not null,
  call_time      time,
  end_time       time,
  location_id    uuid references public.locations(id) on delete set null,
  location_text  text not null default '',   -- 갤러리에 없는 장소면 직접 입력
  note           text not null default '',
  created_by     uuid references public.profiles(id) on delete set null,
  updated_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists shoot_days_project_date_idx on public.shoot_days(project_id, shoot_date);

-- 그날 찍을 컷 + 10. 오늘의 촬영 시트 "컷 완료 체크"
create table if not exists public.shoot_day_cuts (
  project_id    uuid not null references public.projects(id) on delete cascade,
  shoot_day_id  uuid not null references public.shoot_days(id) on delete cascade,
  cut_id        uuid not null references public.cuts(id) on delete cascade,
  position      integer not null default 0,
  completed     boolean not null default false,
  completed_by  uuid references public.profiles(id) on delete set null,
  completed_at  timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (shoot_day_id, cut_id)
);
create index if not exists shoot_day_cuts_project_idx on public.shoot_day_cuts(project_id);
create index if not exists shoot_day_cuts_cut_idx on public.shoot_day_cuts(cut_id);

-- 그날 필요 인원
create table if not exists public.shoot_day_people (
  project_id    uuid not null references public.projects(id) on delete cascade,
  shoot_day_id  uuid not null references public.shoot_days(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  role          text not null default '',
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (shoot_day_id, profile_id)
);
create index if not exists shoot_day_people_project_idx on public.shoot_day_people(project_id);

-- 장비 체크리스트
create table if not exists public.shoot_day_equipment (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  shoot_day_id  uuid not null references public.shoot_days(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 60),
  position      integer not null default 0,
  checked       boolean not null default false,
  checked_by    uuid references public.profiles(id) on delete set null,
  created_by    uuid references public.profiles(id) on delete set null,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists shoot_day_equipment_day_idx on public.shoot_day_equipment(shoot_day_id, position);
create index if not exists shoot_day_equipment_project_idx on public.shoot_day_equipment(project_id);

-- =====================================================================
-- 11. 테이크 기록
-- =====================================================================
create table if not exists public.takes (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  cut_id        uuid not null references public.cuts(id) on delete cascade,
  shoot_day_id  uuid references public.shoot_days(id) on delete set null,
  take_number   integer not null check (take_number >= 1),
  result        text not null default 'NG' check (result in ('OK','NG','KEEP')),
  memo          text not null default '',
  created_by    uuid references public.profiles(id) on delete set null,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (cut_id, take_number)
);
create index if not exists takes_project_idx on public.takes(project_id, result);

-- =====================================================================
-- 12. 연속성 메모 (컷별 의상·소품·머리·위치 사진 + 메모)
-- =====================================================================
create table if not exists public.continuity_notes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  cut_id      uuid not null references public.cuts(id) on delete cascade,
  category    text not null default '기타' check (category in ('의상','소품','머리','위치','기타')),
  memo        text not null default '',
  image_path  text,   -- media 버킷 경로
  created_by  uuid references public.profiles(id) on delete set null,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists continuity_notes_cut_idx on public.continuity_notes(cut_id);
create index if not exists continuity_notes_project_idx on public.continuity_notes(project_id);

-- =====================================================================
-- 13. 소품·의상 리스트 (항목 하나가 여러 씬에 쓰일 수 있음)
-- =====================================================================
create table if not exists public.props (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  kind         text not null default '소품' check (kind in ('소품','의상')),
  name         text not null check (char_length(name) between 1 and 60),
  assignee_id  uuid references public.profiles(id) on delete set null,   -- 담당자
  status       text not null default '필요' check (status in ('필요','준비중','준비완료')),
  note         text not null default '',
  image_path   text,
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists props_project_idx on public.props(project_id);

create table if not exists public.prop_scenes (
  project_id  uuid not null references public.projects(id) on delete cascade,
  prop_id     uuid not null references public.props(id) on delete cascade,
  scene_id    uuid not null references public.scenes(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (prop_id, scene_id)
);
create index if not exists prop_scenes_project_idx on public.prop_scenes(project_id);
create index if not exists prop_scenes_scene_idx on public.prop_scenes(scene_id);

-- =====================================================================
-- 15. 피드백 (영상 링크 + 타임코드 댓글)
-- =====================================================================
create table if not exists public.feedback_videos (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  url         text not null,
  scene_id    uuid references public.scenes(id) on delete set null,  -- 특정 씬 편집본이면
  created_by  uuid references public.profiles(id) on delete set null,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists feedback_videos_project_idx on public.feedback_videos(project_id, created_at desc);

create table if not exists public.feedback_comments (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  video_id          uuid not null references public.feedback_videos(id) on delete cascade,
  timecode_seconds  integer not null default 0 check (timecode_seconds >= 0),  -- 분:초 → 초
  content           text not null check (char_length(content) between 1 and 2000),
  resolved          boolean not null default false,
  resolved_by       uuid references public.profiles(id) on delete set null,
  resolved_at       timestamptz,
  created_by        uuid references public.profiles(id) on delete set null,
  updated_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists feedback_comments_video_idx on public.feedback_comments(video_id, timecode_seconds);
create index if not exists feedback_comments_project_idx on public.feedback_comments(project_id);

-- =====================================================================
-- 작성자 / 외래키 조회용 인덱스 (프로필 삭제 시 set null 처리 속도)
-- =====================================================================
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists ideas_created_by_idx on public.ideas(created_by);
create index if not exists characters_actor_idx on public.characters(actor_profile_id);
create index if not exists props_assignee_idx on public.props(assignee_id);
create index if not exists shoot_days_location_idx on public.shoot_days(location_id);
create index if not exists takes_shoot_day_idx on public.takes(shoot_day_id);

-- =====================================================================
-- updated_at 트리거 / RLS / 권한 / Realtime  (모든 표에 한꺼번에)
-- =====================================================================
do $$
declare
  t text;
  all_tables text[] := array[
    'profiles','projects','scenes','cuts','scenario_versions',
    'characters','scene_characters','staff_assignments',
    'shotlist_items','prompt_runs',
    'ideas','idea_votes',
    'locations','location_photos','location_reactions',
    'availability_polls','availability_votes',
    'shoot_days','shoot_day_cuts','shoot_day_people','shoot_day_equipment',
    'takes','continuity_notes','props','prop_scenes',
    'feedback_videos','feedback_comments'
  ];
begin
  foreach t in array all_tables loop
    -- updated_at 컬럼이 있는 표만 트리거
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = t and column_name = 'updated_at') then
      execute format('drop trigger if exists set_updated_at on public.%I', t);
      execute format('create trigger set_updated_at before update on public.%I
                      for each row execute function public.set_updated_at()', t);
    end if;

    -- RLS 켜고, anon(+authenticated)에게 읽기·쓰기·삭제를 명시적으로 허용
    -- 로그인 없는 "링크를 아는 사람만 쓰는 구조"
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated', t);

    execute format('drop policy if exists "anon_select" on public.%I', t);
    execute format('drop policy if exists "anon_insert" on public.%I', t);
    execute format('drop policy if exists "anon_update" on public.%I', t);
    execute format('drop policy if exists "anon_delete" on public.%I', t);
    execute format('create policy "anon_select" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "anon_insert" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "anon_update" on public.%I for update to anon, authenticated using (true) with check (true)', t);
    execute format('create policy "anon_delete" on public.%I for delete to anon, authenticated using (true)', t);

    -- Realtime: 변경 사항을 실시간으로 받기
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (select 1 from pg_publication_tables
                       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- Storage: 사진 버킷 media (public). 업로드 전 브라우저에서 압축 (긴 변 1600px, JPEG 0.8)
-- 경로 규칙: {project_id}/{기능}/{uuid}.jpg   (프로필 등 프로젝트 밖: common/...)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_anon_select" on storage.objects;
drop policy if exists "media_anon_insert" on storage.objects;
drop policy if exists "media_anon_update" on storage.objects;
drop policy if exists "media_anon_delete" on storage.objects;

create policy "media_anon_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "media_anon_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'media');
create policy "media_anon_update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'media') with check (bucket_id = 'media');
create policy "media_anon_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'media');

-- 끝. "Success. No rows returned" 가 나오면 성공.
