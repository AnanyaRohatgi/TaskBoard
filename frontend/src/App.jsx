import React, {useEffect, useState} from 'react'
import axios from 'axios'
import BoardView from './components/BoardView'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export default function App(){
  const [boards, setBoards] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    axios.get(`${API_BASE}/boards/`).then(r=>setBoards(r.data)).catch(e=>console.error(e))
  },[])

  return (
    <div style={{padding:20}}>
      <h1>Trello Starter</h1>
      <div style={{display:'flex', gap:20}}>
        <div style={{width:220}}>
          <h3>Boards</h3>
          <ul>
            {boards.map(b=> (
              <li key={b.id}>
                <button onClick={()=>setSelected(b.id)} style={{background:selected===b.id? '#ddd':'transparent', border:0, padding:6}}>{b.title}</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{flex:1}}>
          {selected ? <BoardView boardId={selected} /> : <div>Select a board to view</div>}
        </div>
      </div>
    </div>
  )
}
