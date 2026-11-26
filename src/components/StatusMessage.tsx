interface Props {
  kind?: 'loading' | 'error' | 'empty'
  children: React.ReactNode
  onRetry?: () => void
}

export default function StatusMessage({ kind = 'loading', children, onRetry }: Props) {
  return (
    <div className={`status-msg status-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <p>{children}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  )
}
