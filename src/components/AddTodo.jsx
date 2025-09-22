import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import TagInput from './TagInput'

export default function AddTodo({ listId, userId, onTodoAdded, existingTags = [] }) {
  const [title, setTitle] = useState('')
  const [isPeriodic, setIsPeriodic] = useState(false)
  const [periodType, setPeriodType] = useState('daily')
  const [customDays, setCustomDays] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState([])

  // Reset form when switching lists
  useEffect(() => {
    setTitle('')
    setIsPeriodic(false)
    setPeriodType('daily')
    setCustomDays(1)
    setIsSubmitting(false)
    setTags([])
  }, [listId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      // Get the highest order_index for this list to append at the end
      const { data: maxOrderData } = await supabase
        .from('todos')
        .select('order_index')
        .eq('list_id', listId)
        .order('order_index', { ascending: false })
        .limit(1)

      const maxOrder = maxOrderData?.[0]?.order_index || 0
      const newOrderIndex = maxOrder + 1000

      const todoData = {
        title: title.trim(),
        list_id: listId,
        user_id: userId,
        is_periodic: isPeriodic,
        period_type: isPeriodic ? periodType : null,
        period_days: isPeriodic && periodType === 'custom' ? customDays : null,
        tags: tags,
        order_index: newOrderIndex
      }

      console.log('Inserting todo:', todoData)

      const { error } = await supabase
        .from('todos')
        .insert([todoData])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Todo inserted successfully')

      setTitle('')
      setIsPeriodic(false)
      setPeriodType('daily')
      setCustomDays(1)
      setTags([])

      if (onTodoAdded) onTodoAdded()
    } catch (error) {
      console.error('Error adding todo:', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <div className="input-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="todo-input"
          disabled={isSubmitting}
        />
        <button type="submit" disabled={!title.trim() || isSubmitting} className="add-btn">
          Add
        </button>
      </div>

      <div className="periodic-options">
        <label className="periodic-checkbox">
          <input
            type="checkbox"
            checked={isPeriodic}
            onChange={(e) => setIsPeriodic(e.target.checked)}
          />
          Periodic task
        </label>

        {isPeriodic && (
          <div className="period-settings">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="period-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>

            {periodType === 'custom' && (
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                min="1"
                max="365"
                className="custom-days-input"
                placeholder="Days"
              />
            )}
          </div>
        )}
      </div>

      <TagInput
        tags={tags}
        onChange={setTags}
        existingTags={existingTags}
      />
    </form>
  )
}