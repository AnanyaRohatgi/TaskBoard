import React from 'react'
import { Droppable } from 'react-beautiful-dnd'
import CardItem from './CardItem'

export default function ListColumn({ list, onOpenCard, onDeleteCard, labelMap, users }){
  return (
    <Droppable droppableId={String(list.id)}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`list-dropzone${snapshot.isDraggingOver ? ' is-over' : ''}`}
        >
          {list.cards.map((card, index) => (
            <CardItem
              key={card.id}
              card={card}
              index={index}
              onOpenCard={onOpenCard}
              onDeleteCard={onDeleteCard}
              labelMap={labelMap}
              users={users}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
