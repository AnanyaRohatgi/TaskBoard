import React, {useEffect, useState} from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export default function App(){
  const [boards, setBoards] = useState([])

  useEffect(()=>{
    axios.get(`${API_BASE}/boards/`).then(r=>setBoards(r.data)).catch(e=>console.error(e))
  },[])

  return (
    <div style={{padding:20}}>
      <h1>Trello Starter</h1>
      <p>Boards (from API):</p>
      <ul>
        {boards.map(b=> <li key={b.id}>{b.title}</li>)}
      </ul>
      <p>Open frontend/src/pages and components to continue.</p>
    </div>
  )
}
