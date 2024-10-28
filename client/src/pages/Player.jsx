import React, { useEffect,useState } from 'react'
import { useParams } from 'react-router-dom'
import * as dashjs from 'dashjs'
import axios from 'axios'
import "./stylesheets/video.css"
import playButton from "./img/play-circle.svg"
import no12x16video from "./3960164-uhd_2160_4096_25fps_dir/3960164-uhd_2160_4096_25fps.mpd"
const Player = () => {
    const { videoId } = useParams()
    
    const [mpegdashPlayer,setmpegdashPlayer] = useState();
    const [allQualities,setAllQualities] = useState();
    useEffect(() =>{
        //Get video from the videoID
        
        let url;
        //TEST CODE ONLY
        
        url = no12x16video;
        (async ()=>{
            //Get all the videos
            //Then get the manifests of a few of them (load 3 manifests at a time)
            //When scrolling switch the video
            //Then use the history API to change the URL https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method
            await axios.get(`http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/manifest/${videoId}`)
        }
        )();
        let videoElement;
        let internalPlayer = dashjs.MediaPlayer().create()
        
        videoElement = document.querySelector("#videoPlayer");
        internalPlayer.initialize(videoElement, url, true);
        
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
    },[])

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
        // player.setQualityFor('video',1,true);
        // test = player.getQualityFor('video');
    }

    return (
        <div id="mainContent" className="main-content">
            <div>Play {videoId}</div>
            <div id="videoPlayerContainer">
                <video id="videoPlayer"></video>
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
        </div>
    )
}

export default Player