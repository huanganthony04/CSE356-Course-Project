const { parentPort,workerData} = require("worker_threads");
const {spawn,spawnSync, exec,execSync} = require("child_process")
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

//Import models
const VideoModel = require('../../models/Video');

module.exports = async (job) => {
    console.log("Job received!")

    let newuid = job.data.uid
    console.log(job.data.uid)

    let pathToTempFile = job.data.mp4File
    try{
    
        execSync(`sh ./VideoService/upload.sh ${pathToTempFile} ${newuid}`, {cwd: '/root/cse356/Course-Project'})
         
    }catch(err){
        console.log(err)
    }
}
