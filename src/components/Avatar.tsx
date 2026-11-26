interface Props {
  name: string
  color: string
  size?: number
}

/** 프로필 색 원 + 이름 첫 글자 */
export default function Avatar({ name, color, size = 40 }: Props) {
  const initial = Array.from(name.trim())[0] ?? '?'
  return (
    <span
      className="avatar"
      style={{ background: color, width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
