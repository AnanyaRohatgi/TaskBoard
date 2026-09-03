import React, { useEffect, useState } from 'react'
import api from '../api'
import { DragDropContext } from 'react-beautiful-dnd'
import ListColumn from './ListColumn'

export default function BoardView({ boardId }){
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if(!boardId) return
    api.get(`/boards/${boardId}/`).then(r=>{
      setBoard(r.data)
      setLoading(false)
    }).catch(e=>{
      console.error(e)
      setLoading(false)
    })
  },[boardId])

  const onDragEnd = async (result) => {
    if(!result.destination) return
    const { source, destination, draggableId } = result

    // moving between lists
    if(source.droppableId !== destination.droppableId){
      const newListId = parseInt(destination.droppableId)
      const newPosition = destination.index
      try{
        await api.patch(`/cards/${draggableId}/`, { list: newListId, position: newPosition })
        // refresh board
        const r = await api.get(`/boards/${boardId}/`)
        setBoard(r.data)
      }catch(err){
        console.error('Failed to move card', err)
      }
    }else{
      // reorder within same list: update position on the moved card and refresh
      const listId = parseInt(source.droppableId)
      const newPosition = destination.index
      try{
        await api.patch(`/cards/${draggableId}/`, { position: newPosition })
        const r = await api.get(`/boards/${boardId}/`)
        setBoard(r.data)
      }catch(err){
        console.error('Failed to reorder card', err)
      }
    }
  }

  if(loading) return <div>Loading board...</div>
  if(!board) return <div>No board selected</div>

  return (
    <div style={{padding:20}}>
      <h2>{board.title}</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          {board.lists.map(lst => (
            <ListColumn key={lst.id} list={lst} />
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
