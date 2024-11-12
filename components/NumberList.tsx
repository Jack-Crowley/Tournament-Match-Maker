interface NumberListProps {
  numbers: Array<{
    id: number
    value: number
    created_at: string
  }>
}

export function NumberList({ numbers }: NumberListProps) {
  return (
    <div className="numbers-container">
      {numbers.length === 0 ? (
        <p>No numbers stored yet</p>
      ) : (
        numbers.map(number => (
          <div key={number.id} className="number-item">
            <span>Number: {number.value}</span>
            <span>{new Date(number.created_at).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  )
}