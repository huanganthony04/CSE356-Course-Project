const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const ffmpeg = require('fluent-ffmpeg');

const {spawn,spawnSync, exec,execSync} = require("child_process")

const VideoModel = require('../models/Video');

const mongoURI = 'mongodb://localhost:27017/CSE356';

//Set up connection to mongo client
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'));

const populate = async () => {

    //Get all the mp4 files
    //Overview
    //Get all the mp4 files and the json
    //Generate UID
    //Render video
    
    const media_path = "./public/media/";
    const json_path = "./public/media/m1.json"
    //1. Get all the mp4 files
    let videoFileArray = fs.readdirSync(media_path,{withFileTypes: true})
        .filter(dirent => dirent.name.slice((dirent.name.lastIndexOf(".") - 1 >>> 0) + 2) == "mp4")
        .map(direct => direct);

    let metadata = JSON.parse(fs.readFileSync(json_path, 'utf8'))
    //Iterate over the mp4 files
    for(const video of videoFileArray){
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
                title: video.name,
                description: metadata[video.name]
            }
        });
        //Insert into database
        await newvideo.save().catch((err) => {
            console.log("Error saving user: " + err);
            return res.status(200).json({ status: 'ERROR', error: true, message: `${err}` })
        });

        const inputPath = video.parentPath + video.name
        
        let result = execSync(`sh testbash.sh ${inputPath} ${newuid}`)
        console.log(result)
    }
}

populate().then(()=>{
    process.exit(0)
}
)