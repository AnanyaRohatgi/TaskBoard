import React, {useEffect, useState} from 'react'
import api from './api'
import BoardView from './components/BoardView'

export default function App(){
  const [boards, setBoards] = useState([])
  const [selected, setSelected] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [credentials, setCredentials] = useState({username:'', password:''})
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  const loadBoards = async () => {
    try{
      const r = await api.get('/boards/')
      setBoards(r.data)
    }catch(e){
      console.error(e)
    }
  }

  useEffect(()=>{
    (async ()=>{
      await loadBoards()
      setLoading(false)
    })()
  },[])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError(null)
    try{
      const r = await api.post('/auth/token/', credentials)
      const token = r.data.token
      localStorage.setItem('token', token)
      setIsLoggedIn(true)
      await loadBoards()
    }catch(err){
      console.error(err)
      setAuthError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
  }

  if(loading) return <div>Loading...</div>

  if(!isLoggedIn){
    return (
      <div style={{padding:20}}>
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={{maxWidth:400}}>
          <div style={{marginBottom:8}}>
            <label>Username</label><br />
            <input value={credentials.username} onChange={e=>setCredentials({...credentials, username:e.target.value})} />
          </div>
          <div style={{marginBottom:8}}>
            <label>Password</label><br />
            <input type="password" value={credentials.password} onChange={e=>setCredentials({...credentials, password:e.target.value})} />
          </div>
          {authError && <div style={{color:'red'}}>{authError}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{padding:20}}>
      <h1>Trello Starter</h1>
      <div style={{display:'flex', gap:20}}>
        <div style={{width:220}}>
          <h3>Boards</h3>
          <button onClick={handleLogout} style={{marginBottom:10}}>Logout</button>
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
