import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import { DragDropContext } from 'react-beautiful-dnd'
import ListColumn from './ListColumn'

export default function BoardView({ boardId }) {
  const [board, setBoard] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newListTitle, setNewListTitle] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardDraft, setCardDraft] = useState({
    title: '',
    description: '',
    due_date: '',
    labels: [],
    assignees: []
  })
  const [newComment, setNewComment] = useState('')
  const [newChecklistText, setNewChecklistText] = useState('')
  const [modal, setModal] = useState(null)
  const [modalInput, setModalInput] = useState('')
  const [filters, setFilters] = useState({ search: '', label: 'all', dueDate: '', assignee: 'all' })

  const boardLabelMap = useMemo(() => {
    const mapping = {}
    ;(board?.labels || []).forEach((label) => {
      mapping[label.id] = label
    })
    return mapping
  }, [board])

  const filteredBoard = useMemo(() => {
    if (!board) return null

    return {
      ...board,
      lists: (board.lists || []).map((list) => ({
        ...list,
        cards: (list.cards || []).filter((card) => {
          const searchMatch = !filters.search || card.title.toLowerCase().includes(filters.search.toLowerCase())
          const labelMatch = filters.label === 'all' || (card.labels || []).includes(Number(filters.label))
          const dueDateMatch = !filters.dueDate || (card.due_date || '').slice(0, 10) === filters.dueDate
          const assigneeMatch = filters.assignee === 'all' || (card.assignees || []).some((assigneeId) => String(assigneeId) === String(filters.assignee))
          return searchMatch && labelMatch && dueDateMatch && assigneeMatch
        })
      }))
    }
  }, [board, filters])

  const loadBoard = async () => {
    const r = await api.get(`/boards/${boardId}/`)
    setBoard(r.data)
  }

  const loadUsers = async () => {
    const r = await api.get('/auth/users/')
    setUsers(r.data)
  }

  useEffect(() => {
    if (!boardId) return
    ;(async () => {
      try {
        await Promise.all([loadBoard(), loadUsers()])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [boardId])

  const openCardDetails = async (cardId) => {
    try {
      const response = await api.get(`/cards/${cardId}/`)
      setSelectedCard(response.data)
      setCardDraft({
        title: response.data.title || '',
        description: response.data.description || '',
        due_date: response.data.due_date ? response.data.due_date.slice(0, 10) : '',
        labels: response.data.labels || [],
        assignees: response.data.assignees || []
      })
      setNewComment('')
      setNewChecklistText('')
    } catch (err) {
      console.error('Failed to load card details', err)
    }
  }

  const refreshBoard = async () => {
    await loadBoard()
    if (selectedCard) {
      const res = await api.get(`/cards/${selectedCard.id}/`)
      setSelectedCard(res.data)
      setCardDraft({
        title: res.data.title || '',
        description: res.data.description || '',
        due_date: res.data.due_date ? res.data.due_date.slice(0, 10) : '',
        labels: res.data.labels || [],
        assignees: res.data.assignees || []
      })
    }
  }

  const createList = async () => {
    if (!newListTitle.trim()) return
    try {
      await api.post('/lists/', {
        board: board.id,
        title: newListTitle,
        position: board.lists.length,
      })
      setNewListTitle('')
      await loadBoard()
    } catch (err) {
      console.error('Failed to create list', err)
    }
  }

  const updateList = async (listId, patch) => {
    try {
      await api.patch(`/lists/${listId}/`, patch)
      await loadBoard()
    } catch (err) {
      console.error('Failed to update list', err)
    }
  }

  const deleteList = async (listId) => {
    try {
      await api.delete(`/lists/${listId}/`)
      await loadBoard()
      setModal(null)
    } catch (err) {
      console.error('Failed to delete list', err)
    }
  }

  const moveList = async (listId, direction) => {
    const index = board.lists.findIndex((list) => list.id === listId)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= board.lists.length) return

    try {
      await api.patch(`/lists/${listId}/`, { position: targetIndex })
      await loadBoard()
    } catch (err) {
      console.error('Failed to reorder list', err)
    }
  }

  const createCard = async (listId) => {
    const list = board.lists.find((l) => l.id === listId)
    try {
      await api.post('/cards/', {
        list: listId,
        title: modalInput.trim(),
        description: '',
        position: list.cards.length,
        labels: [],
        assignees: [],
      })
      setModal(null)
      setModalInput('')
      await loadBoard()
    } catch (err) {
      console.error('Failed to create card', err)
    }
  }

  const deleteCard = async (cardId) => {
    try {
      await api.delete(`/cards/${cardId}/`)
      setModal(null)
      await loadBoard()
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard(null)
      }
    } catch (err) {
      console.error('Failed to delete card', err)
    }
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return
    const { source, destination, draggableId } = result

    if (source.droppableId !== destination.droppableId) {
      try {
        await api.patch(`/cards/${draggableId}/`, {
          list: Number(destination.droppableId),
          position: destination.index,
        })
        await loadBoard()
      } catch (err) {
        console.error('Failed to move card', err)
      }
    } else {
      try {
        await api.patch(`/cards/${draggableId}/`, {
          list: Number(source.droppableId),
          position: destination.index,
        })
        await loadBoard()
      } catch (err) {
        console.error('Failed to reorder card', err)
      }
    }
  }

  const saveCardDetails = async () => {
    if (!selectedCard) return
    try {
      await api.patch(`/cards/${selectedCard.id}/`, {
        list: selectedCard.list,
        position: selectedCard.position,
        title: cardDraft.title,
        description: cardDraft.description,
        due_date: cardDraft.due_date || null,
        labels: cardDraft.labels,
        assignees: cardDraft.assignees,
      })
      await refreshBoard()
    } catch (err) {
      console.error('Failed to update card', err)
    }
  }

  const addComment = async () => {
    if (!selectedCard || !newComment.trim()) return
    try {
      await api.post('/comments/', {
        card: selectedCard.id,
        text: newComment.trim(),
      })
      setNewComment('')
      await refreshBoard()
    } catch (err) {
      console.error('Failed to add comment', err)
    }
  }

  const addChecklistItem = async () => {
    if (!selectedCard || !newChecklistText.trim()) return
    try {
      await api.post('/checklist/', {
        card: selectedCard.id,
        text: newChecklistText.trim(),
        done: false,
      })
      setNewChecklistText('')
      await refreshBoard()
    } catch (err) {
      console.error('Failed to add checklist item', err)
    }
  }

  const toggleChecklistItem = async (itemId, done) => {
    try {
      await api.patch(`/checklist/${itemId}/`, { done })
      await refreshBoard()
    } catch (err) {
      console.error('Failed to update checklist item', err)
    }
  }

  const addLabel = async () => {
    if (!selectedCard) return
    const labelName = modalInput.trim()
    if (!labelName) return
    try {
      const labelResponse = await api.post('/labels/', {
        board: board.id,
        name: labelName,
        color: '#5fa8ff',
      })
      const updatedLabels = [...(cardDraft.labels || []), labelResponse.data.id]
      setCardDraft({ ...cardDraft, labels: updatedLabels })
      await api.patch(`/cards/${selectedCard.id}/`, {
        list: selectedCard.list,
        position: selectedCard.position,
        labels: updatedLabels,
      })
      setModal(null)
      setModalInput('')
      await refreshBoard()
    } catch (err) {
      console.error('Failed to add label', err)
    }
  }

  const openModal = ({ type, title, defaultValue = '', confirmText = 'Confirm', action = null, payload = {} }) => {
    setModal({ type, title, confirmText, action, payload })
    setModalInput(defaultValue)
  }

  const handleModalSubmit = async () => {
    if (!modal) return

    const action = modal.action
    const payload = modal.payload || {}

    if (modal.type === 'prompt') {
      const value = modalInput.trim()
      if (!value) return

      if (action === 'renameBoard') {
        await api.patch(`/boards/${payload.boardId}/`, { title: value })
        await loadBoard()
      }

      if (action === 'editDescription') {
        await api.patch(`/boards/${payload.boardId}/`, { description: value })
        await loadBoard()
      }

      if (action === 'renameList') {
        await api.patch(`/lists/${payload.listId}/`, { title: value })
        await loadBoard()
      }

      if (action === 'createCard') {
        const list = board?.lists?.find((item) => item.id === payload.listId)
        if (!list) return
        await api.post('/cards/', {
          list: payload.listId,
          title: value,
          description: '',
          position: list.cards.length,
          labels: [],
          assignees: [],
        })
        await loadBoard()
      }

      if (action === 'addLabel') {
        await addLabel()
        return
      }
    }

    if (modal.type === 'confirm') {
      if (action === 'deleteList') {
        await api.delete(`/lists/${payload.listId}/`)
        await loadBoard()
      }

      if (action === 'deleteCard') {
        await api.delete(`/cards/${payload.cardId}/`)
        if (selectedCard && selectedCard.id === payload.cardId) {
          setSelectedCard(null)
        }
        await loadBoard()
      }
    }

    setModal(null)
    setModalInput('')
  }

  if (loading) return <div className="board-loading">Loading board…</div>
  if (!board) return <div className="empty-note">No board selected</div>

  const activeBoard = filteredBoard || board
  const hasActiveFilters = Boolean(
    filters.search || filters.label !== 'all' || filters.dueDate || filters.assignee !== 'all'
  )

  return (
    <div>
      <div className="board-shell">
        <header className="board-header">
          <div>
            <h2>{board.title}</h2>
            {board.description ? <p className="board-description">{board.description}</p> : <p className="board-description">No description yet.</p>}
          </div>
          <div className="board-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => openModal({ type: 'prompt', title: 'Board title', defaultValue: board.title, action: 'renameBoard', payload: { boardId: board.id } })}
            >
              Rename Board
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => openModal({ type: 'prompt', title: 'Board description', defaultValue: board.description || '', action: 'editDescription', payload: { boardId: board.id } })}
            >
              Edit Description
            </button>
          </div>
        </header>

        <div className="board-toolbar" role="search">
          <div className="filter-field filter-search">
            <label htmlFor="card-search">Search</label>
            <input
              id="card-search"
              value={filters.search}
              onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))}
              placeholder="Search cards by title"
            />
          </div>
          <div className="filter-controls">
            <div className="filter-field">
              <label htmlFor="filter-label">Label</label>
              <select id="filter-label" value={filters.label} onChange={(e) => setFilters((current) => ({ ...current, label: e.target.value }))}>
                <option value="all">All labels</option>
                {(board.labels || []).map((label) => (
                  <option key={label.id} value={label.id}>{label.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="filter-due">Due date</label>
              <input
                id="filter-due"
                type="date"
                value={filters.dueDate}
                onChange={(e) => setFilters((current) => ({ ...current, dueDate: e.target.value }))}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="filter-assignee">Assignee</label>
              <select id="filter-assignee" value={filters.assignee} onChange={(e) => setFilters((current) => ({ ...current, assignee: e.target.value }))}>
                <option value="all">All assignees</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={`btn ${hasActiveFilters ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilters({ search: '', label: 'all', dueDate: '', assignee: 'all' })}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="list-composer">
          <input
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="New list title"
          />
          <button type="button" className="btn btn-primary" onClick={createList}>Add list</button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="board-columns">
            {activeBoard.lists.length === 0 ? (
              <div className="empty-note">No lists yet. Add a list to start organizing cards.</div>
            ) : null}
            {activeBoard.lists.map((list) => (
              <div key={list.id} className="board-list">
                <div className="board-list-header">
                  <div className="board-list-title">
                    <strong>{list.title}</strong>
                    <span className="count-pill">{list.cards.length}</span>
                  </div>
                  <div className="board-list-actions">
                    <button type="button" className="btn btn-icon btn-sm" onClick={() => moveList(list.id, -1)} disabled={activeBoard.lists.indexOf(list) === 0} aria-label="Move list left">←</button>
                    <button type="button" className="btn btn-icon btn-sm" onClick={() => moveList(list.id, 1)} disabled={activeBoard.lists.indexOf(list) === activeBoard.lists.length - 1} aria-label="Move list right">→</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal({ type: 'prompt', title: 'List name', defaultValue: list.title, action: 'renameList', payload: { listId: list.id } })}>Rename</button>
                    <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => openModal({ type: 'confirm', title: 'Delete this list?', action: 'deleteList', payload: { listId: list.id } })}>Delete</button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => openModal({ type: 'prompt', title: 'Card title', defaultValue: '', action: 'createCard', payload: { listId: list.id } })}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  + Add card
                </button>
                {list.cards.length === 0 ? (
                  <div className="empty-note">{hasActiveFilters ? 'No cards match' : 'No cards yet'}</div>
                ) : null}
                <ListColumn
                  list={list}
                  onOpenCard={openCardDetails}
                  onDeleteCard={(cardId) => openModal({ type: 'confirm', title: 'Delete this card?', action: 'deleteCard', payload: { cardId } })}
                  labelMap={boardLabelMap}
                  users={users}
                />
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {modal && (
        <div className="overlay" style={{ zIndex: 30 }}>
          <div className="dialog" role="dialog" aria-modal="true">
            <h3>{modal.title}</h3>
            {modal.type === 'prompt' ? (
              <input
                autoFocus
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
              />
            ) : (
              <p className="dialog-copy">This action cannot be undone.</p>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setModal(null); setModalInput('') }}>Cancel</button>
              <button
                type="button"
                className={`btn ${modal.type === 'confirm' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleModalSubmit}
              >
                {modal.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCard && (
        <div className="overlay" style={{ zIndex: 10 }}>
          <div className="card-modal" role="dialog" aria-modal="true" aria-labelledby="card-modal-title">
            <div className="card-modal-header">
              <h3 id="card-modal-title">{selectedCard.title}</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedCard(null)}>Close</button>
            </div>

            <div className="card-modal-body">
              <div className="card-modal-main">
                <div className="modal-section">
                  <label htmlFor="card-title">Title</label>
                  <input id="card-title" value={cardDraft.title} onChange={(e) => setCardDraft({ ...cardDraft, title: e.target.value })} />
                </div>

                <div className="modal-section">
                  <label htmlFor="card-description">Description</label>
                  <textarea id="card-description" value={cardDraft.description} onChange={(e) => setCardDraft({ ...cardDraft, description: e.target.value })} style={{ minHeight: 110 }} />
                </div>

                <div className="modal-section">
                  <label htmlFor="card-due">Due date</label>
                  <input id="card-due" type="date" value={cardDraft.due_date || ''} onChange={(e) => setCardDraft({ ...cardDraft, due_date: e.target.value })} />
                </div>

                <div className="modal-section">
                  <label>Labels</label>
                  <div className="card-labels" style={{ marginTop: 6 }}>
                    {(board.labels || []).map((label) => {
                      const checked = (cardDraft.labels || []).includes(label.id)
                      return (
                        <button
                          key={label.id}
                          type="button"
                          className={`label-chip is-toggle${checked ? '' : ' is-inactive'}`}
                          onClick={() => {
                            const next = checked
                              ? (cardDraft.labels || []).filter((id) => id !== label.id)
                              : [...(cardDraft.labels || []), label.id]
                            setCardDraft({ ...cardDraft, labels: next })
                          }}
                          style={{ background: checked ? (label.color || '#2563eb') : undefined }}
                        >
                          {label.name}
                        </button>
                      )
                    })}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal({ type: 'prompt', title: 'Label name', defaultValue: '', action: 'addLabel' })}>+ Add label</button>
                  </div>
                </div>

                <div className="modal-section">
                  <label htmlFor="card-assignee">Assignee</label>
                  <select
                    id="card-assignee"
                    value={(cardDraft.assignees || [])[0] || ''}
                    onChange={(e) => setCardDraft({ ...cardDraft, assignees: e.target.value ? [Number(e.target.value)] : [] })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-section">
                  <button type="button" className="btn btn-primary" onClick={saveCardDetails}>Save card</button>
                </div>

                <div className="modal-section">
                  <h4>Comments</h4>
                  {selectedCard.comments && selectedCard.comments.length > 0 ? selectedCard.comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <strong>{comment.author}</strong>: {comment.text}
                    </div>
                  )) : <p className="muted">No comments yet.</p>}
                  <div className="inline-form" style={{ marginTop: 8 }}>
                    <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment" />
                    <button type="button" className="btn btn-secondary" onClick={addComment}>Add</button>
                  </div>
                </div>

                <div className="modal-section">
                  <h4>Checklist</h4>
                  {(selectedCard.checklist || []).map((item) => (
                    <label key={item.id} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={!!item.done} onChange={(e) => toggleChecklistItem(item.id, e.target.checked)} style={{ width: 'auto' }} />
                      <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                    </label>
                  ))}
                  {!selectedCard.checklist || selectedCard.checklist.length === 0 ? <p className="muted">No checklist items yet.</p> : null}
                  <div className="inline-form" style={{ marginTop: 8 }}>
                    <input value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)} placeholder="Add checklist item" />
                    <button type="button" className="btn btn-secondary" onClick={addChecklistItem}>Add</button>
                  </div>
                </div>
              </div>

              <aside className="card-modal-aside">
                <h4>Activity</h4>
                {(selectedCard.activity || []).length === 0 ? (
                  <p className="muted">No activity yet.</p>
                ) : selectedCard.activity.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div style={{ fontWeight: 600 }}>{item.type}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</div>
                    {item.payload && item.payload.text && <div>{item.payload.text}</div>}
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
