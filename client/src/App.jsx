import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Player from './pages/Player'
import Videos from './pages/Videos'
import Login from './pages/Login'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Videos/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/play/:videoId" element={<Player/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
