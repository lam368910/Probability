export function Sparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 120},${38 - ((value - min) / span) * 32}`).join(' ')

  return (
    <svg className={`sparkline ${positive ? 'positive' : 'negative'}`} viewBox="0 0 120 44" role="img" aria-label="Recent probability movement">
      <path d={`M${points.replaceAll(' ', ' L')} L120,44 L0,44 Z`} className="spark-fill" />
      <polyline points={points} pathLength="1" vectorEffect="non-scaling-stroke" />
      <circle cx="120" cy={38 - ((values.at(-1)! - min) / span) * 32} r="2.5" />
    </svg>
  )
}
