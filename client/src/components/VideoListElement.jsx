import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './VideoListElement.css'

const VideoListElement = (props) => {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/play/${props.id}`);
  }

  return (
    <div className="video_list_element" onClick={handleClick}>
      <img className="thumbnail" src={`http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/thumbnail/${props.id}`} alt="thumbnail"/>
      <h4 className="description">{props.description}</h4>
    </div>
  )
}

export default VideoListElement