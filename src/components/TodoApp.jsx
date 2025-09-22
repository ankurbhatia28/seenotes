import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import TodoList from './TodoList'
import AddTodo from './AddTodo'
import TagFilter from './TagFilter'

export default function TodoApp({ session }) {
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  useEffect(() => {
    fetchLists()
    fetchAllTags()
  }, [])

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('tags')
        .eq('user_id', session.user.id)

      if (error) throw error

      const tagSet = new Set()
      data.forEach(todo => {
        if (todo.tags && Array.isArray(todo.tags)) {
          todo.tags.forEach(tag => tagSet.add(tag))
        }
      })

      setAllTags(Array.from(tagSet).sort())
    } catch (error) {
      console.error('Error fetching tags:', error.message)
    }
  }

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data.length === 0) {
        await createDefaultList()
      } else {
        // Remove any potential duplicates by ID
        const uniqueLists = data.filter((list, index, self) =>
          index === self.findIndex(l => l.id === list.id)
        )
        setLists(uniqueLists)
        setActiveListId(uniqueLists[0].id)
      }
    } catch (error) {
      console.error('Error fetching lists:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultList = async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ name: 'My Tasks', user_id: session.user.id }])
        .select()

      if (error) throw error

      setLists(data)
      setActiveListId(data[0].id)
    } catch (error) {
      console.error('Error creating default list:', error.message)
    }
  }

  const createNewList = async (name) => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ name, user_id: session.user.id }])
        .select()

      if (error) throw error

      setLists(prevLists => [...prevLists, data[0]])
      setActiveListId(data[0].id)
    } catch (error) {
      console.error('Error creating list:', error.message)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error.message)
  }

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setSelectedTags([])
  }

  const handleTodoAdded = () => {
    fetchAllTags() // Refresh tags when new todo added
    window.dispatchEvent(new CustomEvent('todoAdded'))
  }

  if (loading) {
    return <div className="loading">Loading your lists...</div>
  }

  return (
    <div className="todo-app">
      <header className="app-header">
        <h1>Todo Tracker</h1>
        <button onClick={signOut} className="sign-out-btn">
          Sign Out
        </button>
      </header>

      <div className="lists-tabs">
        {lists.map(list => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={`list-tab ${activeListId === list.id ? 'active' : ''}`}
          >
            {list.name}
          </button>
        ))}
        <button
          onClick={() => {
            const name = prompt('Enter list name:')
            if (name) createNewList(name)
          }}
          className="add-list-btn"
        >
          + New List
        </button>
      </div>

      {activeListId && (
        <div className="active-list">
          <AddTodo
            listId={activeListId}
            userId={session.user.id}
            key={`add-${activeListId}`}
            onTodoAdded={handleTodoAdded}
            existingTags={allTags}
          />

          <TagFilter
            availableTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearFilters={handleClearFilters}
          />

          <TodoList
            listId={activeListId}
            userId={session.user.id}
            key={`list-${activeListId}`}
            selectedTags={selectedTags}
            onTagClick={handleTagToggle}
          />
        </div>
      )}
    </div>
  )
}