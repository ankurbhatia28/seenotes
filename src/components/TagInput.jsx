import { useState, useRef } from 'react'

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

export default function TagInput({ tags, onChange, existingTags = [] }) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  const suggestions = existingTags.filter(tag =>
    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.includes(tag) &&
    inputValue.trim() !== ''
  ).slice(0, 5)

  const addTag = (tagName) => {
    const tag = tagName.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setInputValue('')
    }
  }

  return (
    <div className="tag-input-container">
      <div className="tag-input-wrapper">
        <div className="tag-chips">
          {tags.map((tag, index) => {
            const colors = getTagColor(tag)
            return (
              <span
                key={index}
                className="tag-chip"
                style={{ backgroundColor: colors.bg, color: colors.color }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="tag-remove"
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </span>
            )
          })}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(e.target.value.trim().length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.trim().length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={tags.length === 0 ? "Add tags..." : ""}
            className="tag-input"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="tag-suggestions">
            {suggestions.map((suggestion, index) => {
              const colors = getTagColor(suggestion)
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="tag-suggestion"
                  style={{ borderColor: colors.color }}
                >
                  <span
                    className="tag-suggestion-preview"
                    style={{ backgroundColor: colors.bg, color: colors.color }}
                  >
                    {suggestion}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="tag-hint">
        Press Enter or comma to add tags
      </div>
    </div>
  )
}