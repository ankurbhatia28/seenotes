import { useState } from 'react'

export default function TodoItem({
  todo,
  daysOnList,
  onToggleComplete,
  onSnooze,
  onUnsnooze,
  onDelete,
  isCompleted,
  isSnoozed = false
}) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatSnoozeDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Ready'
    if (diffDays === 1) return 'Tomorrow'
    return `${diffDays} days`
  }

  const getPeriodLabel = (todo) => {
    if (!todo.is_periodic) return ''

    switch (todo.period_type) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'quarterly': return 'Quarterly'
      case 'yearly': return 'Yearly'
      case 'custom': return `Every ${todo.period_days} days`
      default: return 'Periodic'
    }
  }

  return (
    <div className={`todo-item ${isCompleted ? 'completed' : ''} ${isSnoozed ? 'snoozed' : ''}`}>
      <div className="todo-main">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={onToggleComplete}
          className="todo-checkbox"
        />

        <div className="todo-content">
          <div className="todo-title">{todo.title}</div>
          <div className="todo-meta">
            <span className="days-on-list">
              {isCompleted ? 'Completed' : `${daysOnList} days on list`}
            </span>

            {todo.is_periodic && (
              <span className="periodic-badge">{getPeriodLabel(todo)}</span>
            )}

            {isSnoozed && (
              <span className="snooze-badge">
                Snoozed until {formatSnoozeDate(todo.snoozed_until)}
              </span>
            )}

            <span className="created-date">
              Added {formatDate(todo.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="todo-actions">
        {!isCompleted && !isSnoozed && (
          <button
            onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
            className="action-btn snooze-btn"
            title="Snooze"
          >
            💤
          </button>
        )}

        {isSnoozed && (
          <button
            onClick={onUnsnooze}
            className="action-btn unsnooze-btn"
            title="Unsnooze"
          >
            ⏰
          </button>
        )}

        <button
          onClick={onDelete}
          className="action-btn delete-btn"
          title="Delete"
        >
          🗑️
        </button>
      </div>

      {showSnoozeOptions && (
        <div className="snooze-options">
          {[1, 2, 3, 4, 5, 6, 7].map(days => (
            <button
              key={days}
              onClick={() => {
                onSnooze(days)
                setShowSnoozeOptions(false)
              }}
              className="snooze-option"
            >
              {days} day{days > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}