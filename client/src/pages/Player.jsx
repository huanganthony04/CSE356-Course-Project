import React from 'react'
import { useParams } from 'react-router-dom'

const Player = () => {
    const { videoId } = useParams()
    return (
        <div>Play {videoId}</div>
    )
}

export default Player