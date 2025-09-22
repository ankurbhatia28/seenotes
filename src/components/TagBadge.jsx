const TAG_COLORS = [
  { bg: '#1a472a', color: '#4ade80' }, // green
  { bg: '#1e3a8a', color: '#60a5fa' }, // blue
  { bg: '#7c2d12', color: '#fb923c' }, // orange
  { bg: '#7c1d6f', color: '#e879f9' }, // pink
  { bg: '#581c87', color: '#c084fc' }, // purple
  { bg: '#991b1b', color: '#f87171' }, // red
  { bg: '#0f766e', color: '#5eead4' }, // teal
  { bg: '#a16207', color: '#facc15' }, // yellow
]

function getTagColor(tag) {
  const hash = tag.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export default function TagBadge({ tag, onClick, isClickable = false }) {
  const colors = getTagColor(tag)

  const className = `tag-badge ${isClickable ? 'tag-badge-clickable' : ''}`

  if (isClickable) {
    return (
      <button
        onClick={() => onClick?.(tag)}
        className={className}
        style={{ backgroundColor: colors.bg, color: colors.color }}
      >
        {tag}
      </button>
    )
  }

  return (
    <span
      className={className}
      style={{ backgroundColor: colors.bg, color: colors.color }}
    >
      {tag}
    </span>
  )
}