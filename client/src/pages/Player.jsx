/* eslint-disable no-unused-vars */
import React, { useEffect,useState,useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import * as dashjs from 'dashjs'
import axios from 'axios'
import PropTypes from 'prop-types'; 
import InfiniteScroll from "react-infinite-scroll-component";

import "./stylesheets/video.css"
import playButton from "./img/play-circle.svg"

//Player
// - Wrapper over the list of PlayerContainers
// - Responsible for coordinating the infinite list
//PlayerContainer
//- Responsible for the getting of the manifest and playing the video itself
// - General Procedure:
// - Get three video IDs (Player)
// - When scrolling append the new video to the end (Player)
// - Load the manifest (PlayerContainer)
// - Then use the history API to change the URL https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method (Player)

const Player = () => {
    const navigate = useNavigate();
    const { videoId } = useParams()
    const [allVideos, setAllVideos] = useState([videoId]);

    let fetchData = () =>{
        axios.post("http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/videos/",{count: 6}).then(
            (response)=>{
                let buffer = []
                response.data.videos.forEach((value) =>{
                    if (videoId !== value.id) {
                        buffer.push(value.id)
                    }
                })

                setAllVideos([...allVideos, ...buffer]);

            }
        ); 
    }

    let fetchMoreData = () =>{
        axios.post("http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/videos/",{count: 6, continue: true}).then(
            (response)=>{
                let buffer = []
                response.data.videos.forEach((value) =>{
                    buffer.push(value.id)
                })

                setAllVideos([...allVideos, ...buffer]);

            }
        ); 
    }
    useEffect(() => {
        //Get authorization. If the user is not logged in, redirect to login page.
        axios.get('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/isloggedin', { withCredentials: true })
            .then((response) => {
                if (response.data.error || response.data.userId === undefined) {
                    navigate('/login');
                }
                else {
                    fetchData();
                }
            })
    }, []);

    return (
        <>
            <div className='infinite-scroll-container'>

                <InfiniteScroll
                    dataLength={allVideos.length}
                    next={fetchMoreData}
                    hasMore={true}
                    loader={<h4>Loading...</h4>}
                    >
                    {allVideos.map((i, index) => (
                        <PlayerContainer key={index} index={index} videoID={i} />
                    ))}
                    
                </InfiniteScroll>
            </div>
        </>
    )
}

PlayerContainer.propTypes = {
    videoID: PropTypes.string.isRequired
}
function PlayerContainer({index, videoID}){

    const [mpegdashPlayer,setmpegdashPlayer] = useState();
    const [allQualities,setAllQualities] = useState();
    const [ focused, setFocused ] = useState(false);
    const refToVideo = useRef();
    const refToContainer = useRef();

    //For focusing and unfocusing the current player
    const focusPlayer = (event) => {
        console.log('focusing ' + videoID);
        if (mpegdashPlayer) {
            console.log('test');
            mpegdashPlayer.play();
        }
        setFocused(true);
        window.addEventListener('pushstate', unfocusPlayer);
    }

    const unfocusPlayer = (event) => {
        if (mpegdashPlayer) {
            mpegdashPlayer.pause();
        }
        console.log('unfocusing ' + videoID);
        setFocused(false);
        window.removeEventListener('pushstate', unfocusPlayer);
    }

    let handleIntersect = (entries, observer) => {
        let currentId = window.location.href.split("/").pop();
        entries.forEach((entry)=>{
            if(entry.isIntersecting && currentId != videoID){

                refToVideo.current.scrollIntoView({ behavior: "smooth", block: "center" });

                //This event lets the current 'focused' player know to pass the focus to this player
                //Tells the focused player to unrender its play button
                const event = new CustomEvent('pushstate', { detail: { index: index } });
                window.dispatchEvent(event);

                history.pushState(`${videoID}`, null, videoID);
                document.title = `${videoID}`;

                //Focus the current player
                focusPlayer();

                //Add view
                axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/view', {id : videoID})
                .then((response) => {
                    console.log(`Viewed video ${videoID}`);
                });

            }
        })
    }

    function pausePlayButton() {

        if(mpegdashPlayer.isPaused()) {
            mpegdashPlayer.play();

        }else{
            mpegdashPlayer.pause();

        }
    }

    function toggleResolutionMenu(event){
        if(allQualities == null){
            let avaliableQualities = mpegdashPlayer.getBitrateInfoListFor('video');
            let list = document.getElementById("resolutionMenuList");
            avaliableQualities.forEach((element,index) => {
                let item = document.createElement("li")
                item.innerHTML = `${Math.floor(element.bitrate/1000)} (${element.width}x${element.height})`
                item.addEventListener("click",(event) => ((repr) => {
                    mpegdashPlayer.setQualityFor('video',repr);
                })(index));
                list.appendChild(item);
            });
            setAllQualities(avaliableQualities);
        }

        let menu = document.getElementById("resolutionMenu")

        if (menu.style.display == 'none'){
            menu.style.display = '';
            menu.style.top="400px";
        } else{
            menu.style.display = 'none'
        }

    }

    useEffect(() =>{
        
        let manifest;

        if (mpegdashPlayer == null) {

            //Initialize player
            manifest = `http://anthonysgroup.cse356.compas.cs.stonybrook.edu/media/${videoID}.mpd`

            let videoElement;
            let internalPlayer = dashjs.MediaPlayer().create()
            
            videoElement = refToVideo.current;
            internalPlayer.initialize(videoElement, manifest, false);
            
            internalPlayer.updateSettings({
                'streaming': {
                    'abr': {
                        'autoSwitchBitrate': {
                            'video' : false
                        }
                    }
                }
            });

            setmpegdashPlayer(internalPlayer);

        }

        //The first player should be focused
        if (index === 0) {
            focusPlayer();
        }

        //This is for changing URLS
        let observer;
        let options = {
          root: null,
          rootMargin: "0px",
          threshold: 0.01,
        };
      
        observer = new IntersectionObserver(handleIntersect, options);
        observer.observe(refToContainer.current);

        return () => {
            observer.disconnect();
            window.removeEventListener('pushstate', unfocusPlayer);
        }


    }, [videoID, mpegdashPlayer])

    async function sendLikeRequest(event){
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/like', {id: videoID, value: true })
    }
    async function sendDislikeRequest(event){
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/like', {id: videoID, value: false })
    }
    return (
        <div id="mainContent" className="main-content">

            <div>Play {videoID} {"" + focused}</div>
            <div ref={refToContainer}id="videoPlayerContainer">
                <video ref={refToVideo} id="videoPlayer"></video>
                <div id="videoControls" className='video-controls'>
                    { focused &&
                        (<div id="playPauseBtn" className="play-pause-button" onClick={pausePlayButton}>
                            <img style={{width: "100%", height: "100%"}} src={playButton}/>
                        </div>)
                    }
                    <div id="seekBar" className="seek-bar">
                        <span></span>
                    </div>
                    <input id="changeResolutionMenu" className="change-resolution-menu" type="button" value="Change Resolution" onClick={toggleResolutionMenu}/>
                    <div id="resolutionMenu" className="resolution-menu" style={{display: "none"}}>
                        <ul id="resolutionMenuList" className="resolution-menu-list">

                        </ul>
                    </div>
                </div>
                <div id='ratingButtonContainer' className='like-button-container'>
                    <button name="like" onClick={() => sendLikeRequest()}>Like</button>
                    <button name="dislike" onClick={() => sendDislikeRequest()}>Dislike</button>
                </div>
            </div>
        </div>
    )
}

export default Player