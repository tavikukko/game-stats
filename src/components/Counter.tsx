interface CounterProps {
  label: string
  value: number
  onIncrement: () => void
  onDecrement: () => void
}

const Counter = ({ label, value, onIncrement, onDecrement }: CounterProps) => {
  return (
    <div className="counter">
      <div className="counter-label">{label}</div>
      <div className="counter-controls">
        <button
          type="button"
          className="btn counter-btn"
          onClick={onDecrement}
          disabled={value <= 0}
          aria-label={`${label} miinus`}
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
          aria-label={`${label} plus`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default Counter
