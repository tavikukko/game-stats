interface CounterProps {
  label: string
  value: number
  onIncrement: () => void
  onDecrement: () => void
  incrementAriaLabel?: string
  decrementAriaLabel?: string
}

const Counter = ({
  label,
  value,
  onIncrement,
  onDecrement,
  incrementAriaLabel,
  decrementAriaLabel,
}: CounterProps) => {
  return (
    <div className="counter">
      <div className="counter-label">{label}</div>
      <div className="counter-controls">
        <button
          type="button"
          className="btn counter-btn"
          onClick={onDecrement}
          disabled={value <= 0}
          aria-label={decrementAriaLabel ?? `${label} -`}
        >
          −
        </button>
        <div className="counter-value" aria-live="polite">
          {value}
        </div>
        <button
          type="button"
          className="btn counter-btn"
          onClick={onIncrement}
          aria-label={incrementAriaLabel ?? `${label} +`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default Counter
