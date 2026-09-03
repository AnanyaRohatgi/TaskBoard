import React, { useEffect, useState } from 'react'
import api from './api'
import BoardView from './components/BoardView'

export default function App(){
  const [boards, setBoards] = useState([])
  const [selected, setSelected] = useState(null)
  const [boardForm, setBoardForm] = useState({ title: '', description: '' })
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [confirmDeleteBoardId, setConfirmDeleteBoardId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadBoards = async () => {
    try {
      const r = await api.get('/boards/')
      setBoards(r.data)
      if (selected && !r.data.some(board => board.id === selected)) {
        setSelected(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    ;(async () => {
      await loadBoards()
      setLoading(false)
    })()
  }, [isLoggedIn])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError(null)
    try {
      const r = await api.post('/auth/token/', credentials)
      const token = r.data.token
      localStorage.setItem('token', token)
      setIsLoggedIn(true)
      await loadBoards()
    } catch (err) {
      console.error(err)
      setAuthError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setSelected(null)
  }

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    if (!boardForm.title.trim()) return
    try {
      const r = await api.post('/boards/', boardForm)
      setSelected(r.data.id)
      setBoardForm({ title: '', description: '' })
      setCreateOpen(false)
      await loadBoards()
    } catch (err) {
      console.error('Failed to create board', err)
    }
  }

  const handleArchiveBoard = async (boardId) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return
    try {
      await api.patch(`/boards/${boardId}/`, { archived: !board.archived })
      await loadBoards()
    } catch (err) {
      console.error('Failed to archive board', err)
    }
  }

  const handleDeleteBoard = async (boardId) => {
    try {
      await api.delete(`/boards/${boardId}/`)
      setSelected(null)
      setConfirmDeleteBoardId(null)
      await loadBoards()
    } catch (err) {
      console.error('Failed to delete board', err)
    }
  }

  if (loading) return <div className="app-loading">Loading workspace…</div>

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>Task Board</h1>
          <p className="muted">Sign in to open your boards.</p>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
          </div>
          {authError && <div className="auth-error">{authError}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h1 className="brand">Task Board</h1>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm board-create-toggle"
          aria-expanded={createOpen}
          onClick={() => setCreateOpen((open) => !open)}
        >
          {createOpen ? 'Hide form' : 'New board'}
        </button>
        <form onSubmit={handleCreateBoard} className={`board-create${createOpen ? ' is-open' : ''}`}>
          <input
            placeholder="Board title"
            value={boardForm.title}
            onChange={(e) => setBoardForm({ ...boardForm, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={boardForm.description}
            onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create board</button>
        </form>

        {boards.length === 0 ? (
          <p className="empty-note">No boards yet. Create one to get started.</p>
        ) : (
          <ul className="board-list-nav">
            {boards.map((board) => (
              <li key={board.id}>
                <div className="board-row">
                  <button
                    type="button"
                    onClick={() => setSelected(board.id)}
                    className={`board-select${selected === board.id ? ' is-active' : ''}${board.archived ? ' is-archived' : ''}`}
                  >
                    <span className="board-title-row">
                      <span className="board-title-text">{board.title}</span>
                      {board.archived ? <span className="badge">Archived</span> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleArchiveBoard(board.id)}
                    title="Archive board"
                  >
                    {board.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={() => setConfirmDeleteBoardId(board.id)}
                    title="Delete board"
                    aria-label="Delete board"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="workspace">
        {selected ? (
          <BoardView boardId={selected} />
        ) : (
          <div className="workspace-empty">
            <h2>Select a board</h2>
            <p>Choose a board from the sidebar, or create a new one.</p>
          </div>
        )}
      </main>

      {confirmDeleteBoardId && (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-board-title">
            <h3 id="delete-board-title">Delete this board?</h3>
            <p className="dialog-copy">This action cannot be undone.</p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteBoardId(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleDeleteBoard(confirmDeleteBoardId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
