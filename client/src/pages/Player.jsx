/* eslint-disable no-unused-vars */
import React, { useEffect,useState,useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import * as dashjs from 'dashjs'
import axios from 'axios'
import PropTypes from 'prop-types'; 
import InfiniteScroll from "react-infinite-scroll-component";

import "./stylesheets/video.css"
import playButton from "./img/play-circle.svg"
// import video1 from "./testvideos/1580117-uhd_3840_2160_30fps_dir/1580117-uhd_3840_2160_30fps.mpd"
// import video2 from "./testvideos/2018959-hd_1920_1080_30fps_dir/2018959-hd_1920_1080_30fps.mpd"
// import video3 from "./testvideos/2892038-uhd_3840_2160_30fps_dir/2892038-uhd_3840_2160_30fps.mpd"
// import video4 from "./testvideos/3960164-uhd_2160_4096_25fps_dir/3960164-uhd_2160_4096_25fps.mpd"
// import video5 from "./testvideos/4008176-uhd_2160_4096_25fps_dir/4008176-uhd_2160_4096_25fps.mpd"
// import video6 from "./testvideos/4046200-hd_1920_1080_25fps_dir/4046200-hd_1920_1080_25fps.mpd"


// const idToMPD = {
//     "1580117-uhd_3840_2160_30fps": video1,
//     "2018959-hd_1920_1080_30fps": video2,
//     "2892038-uhd_3840_2160_30fps": video3,
//     "3960164-uhd_2160_4096_25fps": video4,
//     "4008176-uhd_2160_4096_25fps": video5,
//     "4046200-hd_1920_1080_25fps": video6
// }

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
    const [allVideos,setAllVideos] = useState([videoId]);
    const [ user, setUser ] = useState('');
    const [falseBuffer, setFalseBuffer] = useState(["2018959-hd_1920_1080_30fps","2892038-uhd_3840_2160_30fps","3960164-uhd_2160_4096_25fps","4008176-uhd_2160_4096_25fps","4046200-hd_1920_1080_25fps"])
    const [cursor,setCursor] = useState(0);

    let fetchData = () =>{
        axios.post("http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/videos/",{count: 6}).then(
            (response)=>{
                let buffer = []
                response.data.videos.forEach((value) =>{
                    if (videoId !== value.id) {
                        console.log(videoId);
                        console.log(value.id);
                        buffer.push(value.id)
                    }
                    else {
                        console.log("Skipping video");
                    }
                })

                setAllVideos(
                    [
                        ...allVideos,
                        ...buffer
                    ]
                )

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

                setAllVideos(
                    [
                        ...allVideos,
                        ...buffer
                    ]
                )

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
                    setUser(response.data.userId);
                    fetchData();
                }
            })
    }, []);

    let fetchTestData = () =>{
        setTimeout(() =>{
            setAllVideos(
                [
                    ...allVideos,
                    falseBuffer[cursor]
                ]
            )
            setCursor(cursor+1);
        },1500);
    }

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
                    <PlayerContainer key={index} videoID={i} />
                ))}
                
            </InfiniteScroll>
            </div>
        </>
    )
}

PlayerContainer.propTypes = {
    videoID: PropTypes.string.isRequired
}
function PlayerContainer({videoID}){

    
    const [mpegdashPlayer,setmpegdashPlayer] = useState();
    const [allQualities,setAllQualities] = useState();
    const refToVideo = useRef();
    const refToTop = useRef();
    const refToBottom = useRef();
    const refToContainer = useRef();
    useEffect(() =>{
        console.log(videoID);
        //Get video from the videoID
        
        let manifest;
        //TEST CODE ONLY
        // manifest = idToMPD[videoID];

        // let videoElement;
        // let internalPlayer = dashjs.MediaPlayer().create()
        
        // videoElement = refToVideo.current;
        // internalPlayer.initialize(videoElement, manifest, true);
        
        // internalPlayer.updateSettings({
        //     'streaming': {
        //         'abr': {
        //             'autoSwitchBitrate': {
        //                 'video' : false
        //             }
        //         }
        //     }

        // });
        // setmpegdashPlayer(internalPlayer);
        //Real code used to make the request
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/view', {id : videoID})
        .then((response) => {
            console.log(`Viewed video ${videoID}`);
        });
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

        //This is for changing URLS
        let observer;

        let options = {
          root: null,
          rootMargin: "0px",
          threshold: 0.01,
        };
      
        let handleIntersect = (entries,observer) =>{
            let currentId = window.location.href.split("/").pop();
            entries.forEach((entry)=>{
                if(entry.isIntersecting && currentId != videoID){
                    refToVideo.current.scrollIntoView({ behavior: "smooth", block: "center" })
                    history.pushState(null,"",videoID)
                }
            })
        }
        observer = new IntersectionObserver(handleIntersect, options);
        observer.observe(refToContainer.current);
        //observer.observe(refToTop.current);
        //observer.observe(refToBottom.current);


    },[videoID])

    function pausePlayButton() {

        if(mpegdashPlayer.isPaused()){
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

        if(menu.style.display == 'none'){
            menu.style.display = '';
            menu.style.top="400px";
        }else{
            menu.style.display = 'none'
        }

    }

    async function sendLikeRequest(event){
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/like', {id: videoID, value: true })
    }
    async function sendDislikeRequest(event){
        axios.post('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/like', {id: videoID, value: false })
    }
    return (
        <div id="mainContent" className="main-content">

            <div>Play {videoID}</div>
            <div ref={refToContainer}id="videoPlayerContainer">
                <video ref={refToVideo} id="videoPlayer"></video>
                <div id="videoControls" className='video-controls'>
                    <div id="playPauseBtn" className="play-pause-button" onClick={pausePlayButton}>
                        <img style={{width: "100%", height: "100%"}} src={playButton}/>
                    </div>
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