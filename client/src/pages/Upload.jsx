import React, { useEffect,useState,useRef } from 'react'
import { useParams } from 'react-router-dom'
import * as dashjs from 'dashjs'
import axios from 'axios'

import "./stylesheets/upload.css"


function upload(){

    const handleSubmit = async (event) =>{
        event.preventDefault();
        let uploadinfo = event.target
        let video = uploadinfo[0].files[0];
        let title = uploadinfo[1].value;
        let author = uploadinfo[2].value;

        if(!video){
            return
        }
        if(!title){
            return
        }
        if(!author){
            return
        }
        const form = new FormData();
        form.append('author', author)
        form.append('title', title)
        form.append('mp4File', video)
        let result = await axios.post(
            'http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/upload', 
            form,
            { withCredentials: true,
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
            }
        )
    }
    return (
        <div id="mainContent" className='main-upload-content'>
            <h1>Upload</h1>

            <div id='formContainer' className='form-container'>

                <form className="upload-form" action="/api/login" method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
                    
                    <div id='fileButtonContainer' className='file-button-container' style={{order:1}}>
                        <div id='fileButton' className='file-button'>
                            <label>Choose Video
                                <input type="file" accept="video/*" name="mp4File" style={ {display: "none"}}/>
                            </label>
                        </div>
                    </div>
                    <div id='metadataFormContainer' className='metadata-form-container' style={{order:2}}>
                        <h2>Information</h2>
                        <h3>Title</h3>
                        <input type='text' id='videoTitle' className='video-title' name='title' size={60}/>
                        <h3>Author</h3>
                        <input type='text' id='videoAuthor' className='video-Author' name='author' size={60}/>
                    </div>
                    <hr id='lineBreak' className='line-break' style={{order:3}}></hr>
                    <div id='uploadButton' className='upload-button' style={{order:4}}>
                        <input type='submit' value={"Upload"}/>
                    </div>
                </form>
            </div>

        </div>
    )
}
export default upload