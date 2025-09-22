export default function DragHandle({ className = "", ...props }) {
  return (
    <div
      className={`drag-handle ${className}`}
      title="Drag to reorder"
      {...props}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="drag-handle-icon"
      >
        <circle cx="4" cy="4" r="1"/>
        <circle cx="4" cy="8" r="1"/>
        <circle cx="4" cy="12" r="1"/>
        <circle cx="8" cy="4" r="1"/>
        <circle cx="8" cy="8" r="1"/>
        <circle cx="8" cy="12" r="1"/>
        <circle cx="12" cy="4" r="1"/>
        <circle cx="12" cy="8" r="1"/>
        <circle cx="12" cy="12" r="1"/>
      </svg>
    </div>
  )
}