interface ControlsProps {
    onAdd: () => void
    onClear: () => void
  }
  
  export function Controls({ onAdd, onClear }: ControlsProps) {
    return (
      <div className="button-container">
        <button className="button" onClick={onAdd}>
          Add Random Number
        </button>
        <button className="button" onClick={onClear}>
          Clear All
        </button>
      </div>
    )
  }