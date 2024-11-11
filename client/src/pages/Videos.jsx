import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import VideoListElement from '../components/VideoListElement'
import InfiniteScroll from 'react-infinite-scroll-component'

const Videos = () => {

    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);

    const fetchVideos = () => {
        //Get list of videos to display
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/videos', {count: 10}, { withCredentials: true })
            .then((response) => {
                console.log(videos);
                setVideos(videos.concat(response.data.videos));
            });
    }

    const fetchMoreVideos = () => {
        //Continue with the list of videos to display
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/videos', {count: 10, continue: true}, { withCredentials: true })
            .then((response) => {
                console.log(videos);
                setVideos(videos.concat(response.data.videos));
            });

    }

    useEffect(() => {

        //Get authorization. If the user is not logged in, redirect to login page.
        axios.get('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/isloggedin', { withCredentials: true })
            .then((response) => {
                if (response.data.error) {
                    navigate('/login');
                }
                else {
                    fetchVideos();
                }
            })
    }, []);

    const videosList = videos.map((video, i) =>
        <VideoListElement key={i} id={video.id} description={video.description}/>
    );

    return (
        <InfiniteScroll dataLength={videos.length} next={fetchMoreVideos} hasMore={true} loader={<h4>Loading...</h4>}>
            {videosList}
        </InfiniteScroll>
    )
}

export default Videos