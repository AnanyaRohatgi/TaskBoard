import React from 'react'
import { Droppable } from 'react-beautiful-dnd'
import CardItem from './CardItem'

export default function ListColumn({ list, onOpenCard, onDeleteCard }){
  return (
    <Droppable droppableId={String(list.id)}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 50 }}>
          {list.cards.map((card, index) => (
            <CardItem key={card.id} card={card} index={index} onOpenCard={onOpenCard} onDeleteCard={onDeleteCard} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
