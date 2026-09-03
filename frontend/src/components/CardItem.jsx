import React from 'react'
import { Draggable } from 'react-beautiful-dnd'

function initials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

function dueTone(dueDate) {
  if (!dueDate) return ''
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)
  if (dueDay < today) return ' is-overdue'
  const soon = new Date(today)
  soon.setDate(soon.getDate() + 2)
  if (dueDay <= soon) return ' is-soon'
  return ''
}

export default function CardItem({ card, index, onOpenCard, onDeleteCard, labelMap = {}, users = [] }){
  const labels = (card.labels || []).map((id) => labelMap[id]).filter(Boolean)
  const assignees = (card.assignees || [])
    .map((id) => users.find((user) => user.id === id || String(user.id) === String(id)))
    .filter(Boolean)
  const checklist = card.checklist || []
  const doneCount = checklist.filter((item) => item.done).length
  const commentCount = (card.comments || []).length
  const dueLabel = card.due_date ? new Date(card.due_date).toLocaleDateString() : null

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`card-item${snapshot.isDragging ? ' is-dragging' : ''}`}
          style={provided.draggableProps.style}
        >
          <div className="card-item-top">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="card-title" {...provided.dragHandleProps}>{card.title}</div>
              {card.description && <div className="card-desc">{card.description}</div>}
            </div>
            <button
              type="button"
              className="btn btn-icon"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteCard(card.id)
              }}
              title="Delete card"
              aria-label="Delete card"
            >
              ×
            </button>
          </div>

          {labels.length > 0 && (
            <div className="card-labels">
              {labels.map((label) => (
                <span key={label.id} className="label-chip" style={{ background: label.color || '#64748b' }}>
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {(dueLabel || assignees.length > 0 || checklist.length > 0 || commentCount > 0) && (
            <div className="card-meta">
              {dueLabel && <span className={`meta-pill${dueTone(card.due_date)}`}>Due {dueLabel}</span>}
              {checklist.length > 0 && <span className="meta-pill">{doneCount}/{checklist.length}</span>}
              {commentCount > 0 && <span className="meta-pill">{commentCount} comment{commentCount === 1 ? '' : 's'}</span>}
              {assignees.map((user) => (
                <span key={user.id} className="avatar" title={user.username}>{initials(user.username)}</span>
              ))}
            </div>
          )}

          <div className="card-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                onOpenCard(card.id)
              }}
            >
              Open
            </button>
          </div>
        </div>
      )}
    </Draggable>
  )
}
