import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import TodoItem from './TodoItem'

export default function TodoList({ listId, userId }) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

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

    return () => {
      subscription.unsubscribe()
    }
  }, [listId])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('list_id', listId)
        .order('is_completed', { ascending: true })
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

  if (loading) {
    return <div className="loading">Loading todos...</div>
  }

  // Separate and sort todos
  const activeTodos = todos
    .filter(todo => !todo.is_completed && isVisible(todo))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const completedTodos = todos
    .filter(todo => todo.is_completed)
    .sort((a, b) => {
      // Sort by is_periodic (periodic items first), then by completion time
      if (a.is_periodic && !b.is_periodic) return -1
      if (!a.is_periodic && b.is_periodic) return 1
      return new Date(b.completed_at) - new Date(a.completed_at)
    })

  const snoozedTodos = todos
    .filter(todo => todo.is_snoozed && !isVisible(todo))

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
              isCompleted={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}