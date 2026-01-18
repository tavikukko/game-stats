import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  onReset: () => void
  children: ReactNode
}

const SectionCard = ({ title, onReset, children }: SectionCardProps) => {
  const handleReset = () => {
    const ok = window.confirm(`Nollataanko osio "${title}"?`)
    if (ok) {
      onReset()
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
        <button type="button" className="btn ghost" onClick={handleReset}>
          Reset osio
        </button>
      </div>
      <div className="card-body">{children}</div>
    </section>
  )
}

export default SectionCard
