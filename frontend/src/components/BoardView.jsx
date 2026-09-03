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

  const boardLabelMap = useMemo(() => {
    const mapping = {}
    ;(board?.labels || []).forEach((label) => {
      mapping[label.id] = label
    })
    return mapping
  }, [board])

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

  if (loading) return <div>Loading board...</div>
  if (!board) return <div>No board selected</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{board.title}</h2>
        <div>
          <button onClick={() => openModal({ type: 'prompt', title: 'Board title', defaultValue: board.title, action: 'renameBoard', payload: { boardId: board.id } })}>Rename Board</button>
          <button onClick={() => openModal({ type: 'prompt', title: 'Board description', defaultValue: board.description || '', action: 'editDescription', payload: { boardId: board.id } })} style={{ marginLeft: 8 }}>Edit Description</button>
        </div>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <input
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
          placeholder="New list title"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={createList}>Add list</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', alignItems: 'flex-start' }}>
          {board.lists.map((list) => (
            <div key={list.id} style={{ minWidth: 280, background: '#f4f4f4', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{list.title}</strong>
                <div>
                  <button onClick={() => moveList(list.id, -1)} disabled={board.lists.indexOf(list) === 0}>←</button>
                  <button onClick={() => moveList(list.id, 1)} disabled={board.lists.indexOf(list) === board.lists.length - 1}>→</button>
                  <button onClick={() => openModal({ type: 'prompt', title: 'List name', defaultValue: list.title, action: 'renameList', payload: { listId: list.id } })}>Rename</button>
                  <button onClick={() => openModal({ type: 'confirm', title: 'Delete this list?', action: 'deleteList', payload: { listId: list.id } })}>Delete</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={() => openModal({ type: 'prompt', title: 'Card title', defaultValue: '', action: 'createCard', payload: { listId: list.id } })} style={{ width: '100%', marginBottom: 8 }}>+ Add card</button>
                <ListColumn list={list} onOpenCard={openCardDetails} onDeleteCard={(cardId) => openModal({ type: 'confirm', title: 'Delete this card?', action: 'deleteCard', payload: { cardId } })} />
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, minWidth: 320, maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>{modal.title}</h3>
            {modal.type === 'prompt' ? (
              <input
                autoFocus
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                style={{ width: '100%', padding: 8, marginBottom: 12 }}
              />
            ) : (
              <div style={{ marginBottom: 12, color: '#444' }}>This action cannot be undone.</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setModal(null); setModalInput('') }}>Cancel</button>
              <button onClick={handleModalSubmit}>{modal.confirmText || 'OK'}</button>
            </div>
          </div>
        </div>
      )}

      {selectedCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ width: 'min(760px, 92vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', padding: 20, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{selectedCard.title}</h3>
              <button onClick={() => setSelectedCard(null)}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
              <div>
                <label>Title</label>
                <input value={cardDraft.title} onChange={(e) => setCardDraft({ ...cardDraft, title: e.target.value })} style={{ width: '100%', padding: 8, marginBottom: 12 }} />

                <label>Description</label>
                <textarea value={cardDraft.description} onChange={(e) => setCardDraft({ ...cardDraft, description: e.target.value })} style={{ width: '100%', minHeight: 110, padding: 8, marginBottom: 12 }} />

                <label>Due date</label>
                <input type="date" value={cardDraft.due_date || ''} onChange={(e) => setCardDraft({ ...cardDraft, due_date: e.target.value })} style={{ width: '100%', padding: 8, marginBottom: 12 }} />

                <div style={{ marginBottom: 12 }}>
                  <label>Labels</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {(board.labels || []).map((label) => {
                      const checked = (cardDraft.labels || []).includes(label.id)
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => {
                            const next = checked
                              ? (cardDraft.labels || []).filter((id) => id !== label.id)
                              : [...(cardDraft.labels || []), label.id]
                            setCardDraft({ ...cardDraft, labels: next })
                          }}
                          style={{ background: checked ? '#dfeeff' : '#f5f5f5', border: '1px solid #ccc', padding: '6px 10px', borderRadius: 16 }}
                        >
                          {label.name}
                        </button>
                      )
                    })}
                    <button type="button" onClick={() => openModal({ type: 'prompt', title: 'Label name', defaultValue: '', action: 'addLabel' })}>+ Add label</button>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label>Assignee</label>
                  <select
                    value={(cardDraft.assignees || [])[0] || ''}
                    onChange={(e) => setCardDraft({ ...cardDraft, assignees: e.target.value ? [Number(e.target.value)] : [] })}
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <button onClick={saveCardDetails}>Save card</button>
                </div>

                <div style={{ marginTop: 18 }}>
                  <h4>Comments</h4>
                  <div style={{ marginBottom: 8 }}>
                    {selectedCard.comments && selectedCard.comments.length > 0 ? selectedCard.comments.map((comment) => (
                      <div key={comment.id} style={{ background: '#f7f7f7', padding: 8, marginBottom: 6, borderRadius: 6 }}>
                        <strong>{comment.author}</strong>: {comment.text}
                      </div>
                    )) : <div>No comments yet.</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment" style={{ flex: 1, padding: 8 }} />
                    <button onClick={addComment}>Add</button>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <h4>Checklist</h4>
                  <div style={{ marginBottom: 8 }}>
                    {(selectedCard.checklist || []).map((item) => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <input type="checkbox" checked={!!item.done} onChange={(e) => toggleChecklistItem(item.id, e.target.checked)} />
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                      </label>
                    ))}
                    {!selectedCard.checklist || selectedCard.checklist.length === 0 ? <div>No checklist items yet.</div> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)} placeholder="Add checklist item" style={{ flex: 1, padding: 8 }} />
                    <button onClick={addChecklistItem}>Add</button>
                  </div>
                </div>
              </div>

              <aside>
                <h4>Activity</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedCard.activity || []).length === 0 ? <div>No activity yet.</div> : selectedCard.activity.map((item) => (
                    <div key={item.id} style={{ background: '#f7f7f7', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600 }}>{item.type}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{new Date(item.created_at).toLocaleString()}</div>
                      {item.payload && item.payload.text && <div>{item.payload.text}</div>}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
