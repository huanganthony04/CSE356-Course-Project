/* eslint-disable no-unused-vars */
import React, { useEffect,useState,useRef } from 'react'
import { useParams } from 'react-router-dom'
import * as dashjs from 'dashjs'
import axios from 'axios'
import PropTypes from 'prop-types'; 
import InfiniteScroll from "react-infinite-scroll-component";

import "./stylesheets/video.css"
import playButton from "./img/play-circle.svg"
import video1 from "./testvideos/1580117-uhd_3840_2160_30fps_dir/1580117-uhd_3840_2160_30fps.mpd"
import video2 from "./testvideos/2018959-hd_1920_1080_30fps_dir/2018959-hd_1920_1080_30fps.mpd"
import video3 from "./testvideos/2892038-uhd_3840_2160_30fps_dir/2892038-uhd_3840_2160_30fps.mpd"
import video4 from "./testvideos/3960164-uhd_2160_4096_25fps_dir/3960164-uhd_2160_4096_25fps.mpd"
import video5 from "./testvideos/4008176-uhd_2160_4096_25fps_dir/4008176-uhd_2160_4096_25fps.mpd"
import video6 from "./testvideos/4046200-hd_1920_1080_25fps_dir/4046200-hd_1920_1080_25fps.mpd"


const idToMPD = {
    "1580117-uhd_3840_2160_30fps": video1,
    "2018959-hd_1920_1080_30fps": video2,
    "2892038-uhd_3840_2160_30fps": video3,
    "3960164-uhd_2160_4096_25fps": video4,
    "4008176-uhd_2160_4096_25fps": video5,
    "4046200-hd_1920_1080_25fps": video6
}

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
    const { videoId } = useParams()
    const [allVideos,setAllVideos] = useState([videoId]);
    const [falseBuffer, setFalseBuffer] = useState(["2018959-hd_1920_1080_30fps","2892038-uhd_3840_2160_30fps","3960164-uhd_2160_4096_25fps","4008176-uhd_2160_4096_25fps","4046200-hd_1920_1080_25fps"])
    const [cursor,setCursor] = useState(0);

    let fetchMoreData = () =>{
        axios.post("http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/videos/",{count: 3}).then(
            (response)=>{
                let buffer = []
                response.data.videos.forEach((value) =>{
                    buffer.push(value.title)
                })

                setAllVideos(
                    [
                        ...allVideos,
                        buffer
                    ]
                )

            }
        ); 
    }

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
        <div className='infinite-scroll-container'>
            <InfiniteScroll
                dataLength={allVideos.length}
                next={fetchTestData}
                hasMore={true}
                loader={<h4>Loading...</h4>}
                onScroll={console.log("hi!")}
                >
                {allVideos.map((i, index) => (
                    <PlayerContainer key={index} videoID={i} />
                ))}
                
            </InfiniteScroll>
      </div>
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

    useEffect(() =>{
        //Get video from the videoID
        
        let manifest;
        //TEST CODE ONLY
        manifest = idToMPD[videoID];

        let videoElement;
        let internalPlayer = dashjs.MediaPlayer().create()
        
        videoElement = refToVideo.current;
        internalPlayer.initialize(videoElement, manifest, true);
        
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
        //Real code used to make the request
        // (async ()=>{
        //     //Get all the videos
        //     //Then get the manifests of a few of them (load 3 manifests at a time)
        //     //When scrolling switch the video
        //     //Then use the history API to change the URL https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method

        //     let response = await axios.get(`http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/manifest/${videoID}`)
        //     manifest = response.data
        //     let videoElement;
        //     let internalPlayer = dashjs.MediaPlayer().create()
            
        //     videoElement = refToVideo.current;
        //     internalPlayer.initialize(videoElement, manifest, true);
            
        //     internalPlayer.updateSettings({
        //         'streaming': {
        //             'abr': {
        //                 'autoSwitchBitrate': {
        //                     'video' : false
        //                 }
        //             }
        //         }

        //     });
        //     setmpegdashPlayer(internalPlayer);
        // }

        // )();
        //This is for changing URLS
        let observer;

        let options = {
          root: null,
          rootMargin: "0px",
          threshold: 1.0,
        };
      
        let handleIntersect = (entries,observer) =>{
            entries.forEach((entry)=>{
                if(entry.isIntersecting){
                    history.pushState(null,"",videoID)
                }
            })
        }
        observer = new IntersectionObserver(handleIntersect, options);
        observer.observe(refToTop.current);
        observer.observe(refToBottom.current);


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

    return (
        <div id="mainContent" className="main-content">
            <div id="topAnchor" className="top-anchor" ref={refToTop}>
            </div>
            <div>Play {videoID}</div>
            <div id="videoPlayerContainer">
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
            </div>
            <div id="bottomAnchor" className="bottom-anchor" ref={refToBottom}>
            </div>
        </div>
    )
}

export default Player