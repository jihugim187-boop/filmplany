import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** 화면이 바뀌면 맨 위로 (긴 폼을 저장하고 넘어갈 때 중간에서 시작하지 않게) */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
