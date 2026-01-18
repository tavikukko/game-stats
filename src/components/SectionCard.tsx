import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  onReset: () => void
  resetLabel: string
  confirmText: (title: string) => string
  children: ReactNode
}

const SectionCard = ({ title, onReset, resetLabel, confirmText, children }: SectionCardProps) => {
  const handleReset = () => {
    const ok = globalThis.confirm(confirmText(title))
    if (ok) {
      onReset()
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
        <button type="button" className="btn ghost" onClick={handleReset}>
          {resetLabel}
        </button>
      </div>
      <div className="card-body">{children}</div>
    </section>
  )
}

export default SectionCard
