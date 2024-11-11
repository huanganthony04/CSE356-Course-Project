const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const ffmpeg = require('fluent-ffmpeg');

const {spawn,spawnSync, exec,execSync} = require("child_process")

const VideoModel = require('../models/Video');

const mongoURI = 'mongodb://localhost:27017/CSE356';
//NOTE: Run this script in the root directory

//Set up connection to mongo client
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'));

let videocount = 0

const populate = async () =>{

    for(let i = 1; i < 4; i++){
        let newvideo = new VideoModel({
            _id: i,
            metadata: {
                title: 'apitest',
                description: 'apitest',
                author: "testuser1"
            },
            status : 'completed'
        });
        //Insert into database
        await newvideo.save().catch((err) => {
            console.log("Error saving user: " + err);
        });
    }
    for(let i = 4; i < 7; i++){
        let newvideo = new VideoModel({
            _id: i,
            metadata: {
                title: 'apitest',
                description: 'apitest',
                author: "testuser1"
            },
            status : "processing"
        });
        //Insert into database
        await newvideo.save().catch((err) => {
            console.log("Error saving user: " + err);
        });
    }
    
}

populate()