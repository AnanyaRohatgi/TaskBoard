import React from 'react'
import { Draggable } from 'react-beautiful-dnd'

export default function CardItem({ card, index, onOpenCard, onDeleteCard }){
  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            padding: 8,
            marginBottom: 8,
            background: '#fff',
            borderRadius: 4,
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            ...provided.draggableProps.style
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }} {...provided.dragHandleProps}>{card.title}</div>
              {card.description && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{card.description}</div>}
            </div>
            <button type="button" onClick={() => onDeleteCard(card.id)} title="Delete card">×</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={() => onOpenCard(card.id)}>Open</button>
          </div>
        </div>
      )}
    </Draggable>
  )
}
