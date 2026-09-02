import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { DragDropContext } from 'react-beautiful-dnd'
import ListColumn from './ListColumn'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export default function BoardView({ boardId }){
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if(!boardId) return
    axios.get(`${API_BASE}/boards/${boardId}/`).then(r=>{
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
        await axios.patch(`${API_BASE}/cards/${draggableId}/`, { list: newListId, position: newPosition })
        // refresh board
        const r = await axios.get(`${API_BASE}/boards/${boardId}/`)
        setBoard(r.data)
      }catch(err){
        console.error('Failed to move card', err)
      }
    }else{
      // reorder within same list: update position on the moved card and refresh
      const listId = parseInt(source.droppableId)
      const newPosition = destination.index
      try{
        await axios.patch(`${API_BASE}/cards/${draggableId}/`, { position: newPosition })
        const r = await axios.get(`${API_BASE}/boards/${boardId}/`)
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
