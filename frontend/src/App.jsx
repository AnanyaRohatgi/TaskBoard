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

  if (loading) return <div>Loading...</div>

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Username</label><br />
            <input
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password</label><br />
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          {authError && <div style={{ color: 'crimson', marginBottom: 12 }}>{authError}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <style>{`
        .task-board-shell { display: flex; gap: 20px; align-items: flex-start; }
        .task-board-sidebar { width: 260px; flex-shrink: 0; }
        .task-board-main { flex: 1; min-width: 0; }
        @media (max-width: 900px) {
          .task-board-shell { flex-direction: column; }
          .task-board-sidebar { width: 100%; }
        }
        @media (max-width: 600px) {
          .task-board-sidebar .board-row { flex-wrap: wrap; }
          .task-board-sidebar .board-row button { flex: 1 1 auto; }
        }
      `}</style>

      <h1>Task Board</h1>
      <div className="task-board-shell">
        <aside className="task-board-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 8px' }}>Boards</h3>
            <button onClick={handleLogout}>Logout</button>
          </div>

          <form onSubmit={handleCreateBoard} style={{ marginBottom: 16 }}>
            <input
              placeholder="Board title"
              value={boardForm.title}
              onChange={(e) => setBoardForm({ ...boardForm, title: e.target.value })}
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <textarea
              placeholder="Description"
              value={boardForm.description}
              onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
              style={{ width: '100%', padding: 8, resize: 'vertical', minHeight: 60, marginBottom: 8 }}
            />
            <button type="submit" style={{ width: '100%' }}>Create board</button>
          </form>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {boards.map((board) => (
              <li key={board.id} style={{ marginBottom: 8 }}>
                <div className="board-row" style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setSelected(board.id)}
                    style={{ flex: 1, textAlign: 'left', background: selected === board.id ? '#dfeeff' : '#f5f5f5', border: '1px solid #ddd', padding: 8 }}
                  >
                    {board.title}
                  </button>
                  <button onClick={() => handleArchiveBoard(board.id)} title="Archive board">
                    {board.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button onClick={() => setConfirmDeleteBoardId(board.id)} title="Delete board">×</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="task-board-main">
          {selected ? <BoardView boardId={selected} /> : <div>Select a board to view</div>}
        </main>
      </div>

      {confirmDeleteBoardId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 260 }}>
            <p>Delete this board?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmDeleteBoardId(null)}>Cancel</button>
              <button onClick={() => handleDeleteBoard(confirmDeleteBoardId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
