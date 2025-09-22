import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import TodoItem from './TodoItem'

export default function TodoList({ listId, userId, selectedTags = [], onTagClick }) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggedTodo, setDraggedTodo] = useState(null)
  const [dragOverTodo, setDragOverTodo] = useState(null)
  const [dragPosition, setDragPosition] = useState(null)

  useEffect(() => {
    fetchTodos()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('todos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `list_id=eq.${listId}`
      }, () => {
        fetchTodos()
      })
      .subscribe()

    // Listen for manual refresh events
    const handleTodoAdded = () => {
      fetchTodos()
    }
    window.addEventListener('todoAdded', handleTodoAdded)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('todoAdded', handleTodoAdded)
    }
  }, [listId])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('list_id', listId)
        .order('is_completed', { ascending: true })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error

      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Refresh the list to get updated data
      fetchTodos()
    } catch (error) {
      console.error('Error updating todo:', error.message)
    }
  }

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error.message)
    }
  }

  const toggleComplete = async (todo) => {
    const updates = {
      is_completed: !todo.is_completed,
      completed_at: !todo.is_completed ? new Date().toISOString() : null
    }

    // If unchecking, reset created_at to now for "days on list" calculation
    if (todo.is_completed && !updates.is_completed) {
      updates.created_at = new Date().toISOString()
    }

    await updateTodo(todo.id, updates)
  }

  const snoozeTodo = async (todo, days) => {
    const snoozeUntil = new Date()
    snoozeUntil.setDate(snoozeUntil.getDate() + days)

    await updateTodo(todo.id, {
      is_snoozed: true,
      snoozed_until: snoozeUntil.toISOString()
    })
  }

  const unsnoozeTodo = async (todo) => {
    await updateTodo(todo.id, {
      is_snoozed: false,
      snoozed_until: null
    })
  }

  const calculateDaysOnList = (todo) => {
    if (todo.is_completed) return 0

    const createdDate = new Date(todo.created_at)
    const now = new Date()
    const diffTime = Math.abs(now - createdDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const isVisible = (todo) => {
    if (todo.is_snoozed && todo.snoozed_until) {
      return new Date() >= new Date(todo.snoozed_until)
    }
    return true
  }

  const matchesTagFilter = (todo) => {
    if (selectedTags.length === 0) return true
    if (!todo.tags || !Array.isArray(todo.tags)) return false

    // OR logic: todo must have at least one of the selected tags
    return selectedTags.some(selectedTag =>
      todo.tags.includes(selectedTag)
    )
  }

  // Drag and Drop Handlers
  const handleDragStart = (e, todo) => {
    setDraggedTodo(todo)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDragEnd = () => {
    setDraggedTodo(null)
    setDragOverTodo(null)
    setDragPosition(null)
  }

  const handleDragOver = (e, targetTodo) => {
    e.preventDefault()
    if (!draggedTodo || draggedTodo.id === targetTodo.id) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const position = e.clientY < midpoint ? 'top' : 'bottom'

    setDragOverTodo(targetTodo)
    setDragPosition(position)
  }

  const handleDrop = async (e, targetTodo) => {
    e.preventDefault()
    if (!draggedTodo || draggedTodo.id === targetTodo.id) return

    try {
      // Get all active todos for reordering
      const activeTodos = todos
        .filter(todo => !todo.is_completed && isVisible(todo) && matchesTagFilter(todo))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

      // Remove dragged todo from current position
      const filteredTodos = activeTodos.filter(todo => todo.id !== draggedTodo.id)

      // Find target index
      const targetIndex = filteredTodos.findIndex(todo => todo.id === targetTodo.id)
      const insertIndex = dragPosition === 'top' ? targetIndex : targetIndex + 1

      // Insert dragged todo at new position
      filteredTodos.splice(insertIndex, 0, draggedTodo)

      // Update order_index for all affected todos
      const updates = filteredTodos.map((todo, index) => ({
        id: todo.id,
        order_index: (index + 1) * 1000
      }))

      // Batch update all todos
      for (const update of updates) {
        await updateTodo(update.id, { order_index: update.order_index })
      }

      // Refresh the todo list
      await fetchTodos()

    } catch (error) {
      console.error('Error reordering todos:', error.message)
    }

    handleDragEnd()
  }

  if (loading) {
    return <div className="loading">Loading todos...</div>
  }

  // Separate and sort todos with tag filtering
  const activeTodos = todos
    .filter(todo => !todo.is_completed && isVisible(todo) && matchesTagFilter(todo))
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

  const completedTodos = todos
    .filter(todo => todo.is_completed && matchesTagFilter(todo))
    .sort((a, b) => {
      // Sort by is_periodic (periodic items first), then by completion time
      if (a.is_periodic && !b.is_periodic) return -1
      if (!a.is_periodic && b.is_periodic) return 1
      return new Date(b.completed_at) - new Date(a.completed_at)
    })

  const snoozedTodos = todos
    .filter(todo => todo.is_snoozed && !isVisible(todo) && matchesTagFilter(todo))

  return (
    <div className="todo-list">
      {activeTodos.length === 0 && completedTodos.length === 0 && snoozedTodos.length === 0 && (
        <div className="empty-state">
          <p>No tasks yet. Add one above!</p>
        </div>
      )}

      {activeTodos.length > 0 && (
        <div className="todos-section">
          {activeTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              daysOnList={calculateDaysOnList(todo)}
              onToggleComplete={() => toggleComplete(todo)}
              onSnooze={(days) => snoozeTodo(todo, days)}
              onDelete={() => deleteTodo(todo.id)}
              onTagClick={onTagClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedTodo?.id === todo.id}
              dragPosition={dragOverTodo?.id === todo.id ? dragPosition : null}
              isCompleted={false}
            />
          ))}
        </div>
      )}

      {snoozedTodos.length > 0 && (
        <div className="todos-section snoozed-section">
          <h3>Snoozed ({snoozedTodos.length})</h3>
          {snoozedTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              daysOnList={calculateDaysOnList(todo)}
              onToggleComplete={() => toggleComplete(todo)}
              onUnsnooze={() => unsnoozeTodo(todo)}
              onDelete={() => deleteTodo(todo.id)}
              onTagClick={onTagClick}
              isCompleted={false}
              isSnoozed={true}
            />
          ))}
        </div>
      )}

      {completedTodos.length > 0 && (
        <div className="todos-section completed-section">
          <h3>Completed ({completedTodos.length})</h3>
          {completedTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              daysOnList={0}
              onToggleComplete={() => toggleComplete(todo)}
              onDelete={() => deleteTodo(todo.id)}
              onTagClick={onTagClick}
              isCompleted={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}