import TagBadge from './TagBadge'

export default function TagFilter({ availableTags, selectedTags, onTagToggle, onClearFilters }) {
  if (availableTags.length === 0) {
    return null
  }

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <span className="filter-icon">🏷️</span>
        <span className="filter-label">Filter:</span>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearFilters}
            className="clear-filters-btn"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="tag-filter-options">
        <button
          onClick={onClearFilters}
          className={`filter-all-btn ${selectedTags.length === 0 ? 'active' : ''}`}
        >
          All
        </button>

        {availableTags.map(tag => {
          const isSelected = selectedTags.includes(tag)
          return (
            <TagBadge
              key={tag}
              tag={tag}
              onClick={onTagToggle}
              isClickable={true}
              className={isSelected ? 'tag-filter-selected' : ''}
            />
          )
        })}
      </div>
    </div>
  )
}