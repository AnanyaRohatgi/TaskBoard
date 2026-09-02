import React from 'react'
import { Draggable } from 'react-beautiful-dnd'

export default function CardItem({ card, index }){
  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            padding:8,
            marginBottom:8,
            background:'#fff',
            borderRadius:4,
            boxShadow:'0 1px 2px rgba(0,0,0,0.08)',
            ...provided.draggableProps.style
          }}
        >
          <div style={{fontWeight:600}}>{card.title}</div>
          {card.description && <div style={{fontSize:12, color:'#666'}}>{card.description}</div>}
        </div>
      )}
    </Draggable>
  )
}
