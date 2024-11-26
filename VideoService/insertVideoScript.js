const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const ffmpeg = require('fluent-ffmpeg');

const {spawn,spawnSync, exec,execSync} = require("child_process")

const VideoModel = require('../models/Video');

require('dotenv').config();
const mongoURI = process.env.MONGOURI;
//NOTE: Run this script in the root directory

//Set up connection to mongo client
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'));

let videocount = 0
const populate = async () => {

    //Get all the mp4 files
    //Overview
    //Get all the mp4 files and the json
    //Generate UID
    //Render video
    
    const video_path = "./public/media/videos";
    const json_path = "./public/media/videos/m2.json"
    //1. Get all the mp4 files
    let videoFileArray = fs.readdirSync(video_path,{withFileTypes: true})
        .filter(dirent => dirent.name.slice((dirent.name.lastIndexOf(".") - 1 >>> 0) + 2) == "mp4")
        .map(direct => direct);

    let metadata = JSON.parse(fs.readFileSync(json_path, 'utf8'))
    //Iterate over the mp4 files
    for(let i = 0; i < 200; i++){
        let newuid;
        

        //Generate the UID, and test if there is a duplicate
        while(true){
            newuid = crypto.randomBytes(8).toString("hex");
            let existingUID = await VideoModel.findOne({_id: newuid});

            if(!existingUID){
                break;
            }
        }

        //Generate the new video record
        let newvideo = new VideoModel({
            _id: newuid,
            metadata: {
                title: "test-video",
                description: "desc-filler",
                author: "grading_script_above",
                
            },
            status : 'complete'
        });
        //Insert into database
        // await newvideo.save().catch((err) => {
        //     console.log("Error saving user: " + err);
        // });

        // const inputPath = video.parentPath + '/' + video.name
        
        
        // let result = execSync(`sh ./VideoService/upload.sh ${inputPath} ${newuid}`)
        // videocount++
        // fs.appendFile('/root/cse356/Course-Project/uploads/oldvid.log', newuid + ',' + video.name + '\n', function (err) {
        //     if (err) throw err;
        //     console.log('Saved!');
        // });
        console.log("VIDEO" + videocount)
    }
}

populate().then(()=>{
    process.exit(0)
}
)