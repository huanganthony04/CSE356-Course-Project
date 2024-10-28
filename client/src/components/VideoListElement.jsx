import React, { useEffect } from 'react'
import './VideoListElement.css'

const VideoListElement = (props) => {


  return (
    <div className="video_list_element">
      <img className="thumbnail" src={`http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/thumbnail/${props.id}`} alt="thumbnail"/>
      <h4 className="description">{props.description}</h4>
    </div>
  )
}

export default VideoListElement