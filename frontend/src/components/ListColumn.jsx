import React from 'react'
import { Droppable } from 'react-beautiful-dnd'
import CardItem from './CardItem'

export default function ListColumn({ list }){
  return (
    <div style={{width:280, background:'#f5f5f5', padding:8, borderRadius:6}}>
      <h3 style={{marginTop:0}}>{list.title}</h3>
      <Droppable droppableId={String(list.id)}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} style={{minHeight:50}}>
            {list.cards.map((card, index) => (
              <CardItem key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
