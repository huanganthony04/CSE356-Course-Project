import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Player from './pages/Player'
import Videos from './pages/Videos'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Videos/>} />
        <Route path="/play/:videoId" element={<Player/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
