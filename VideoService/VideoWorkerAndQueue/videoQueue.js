const {Queue, Worker, SandboxedJob} = require('bullmq');
const IORedis = require('ioredis')
const {spawn,spawnSync, exec,execSync} = require("child_process")
const fs = require('fs');
const path = require('path');
const axios = require('axios')

require('dotenv').config()

const videoStore = 'http://130.245.168.185/upload'

const tempFolderFinished = path.join(__dirname,'..','..','tmp','finished')
//Mongoose
const mongoose = require('mongoose');
require('dotenv').config({path: '../../.env'});
const mongoURI = process.env.MONGOURI;

mongoose.connect(mongoURI, { maxPoolSize: 600 })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => { 
        console.log(err);
        process.exit(1);
    });
//Import models
const VideoModel = require('../../models/Video');

//Import worker
const videoWorkerFile = path.join(__dirname, 'videoWorker.js');
const redisHost = "localhost"
const connection = new IORedis({
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD
});

const videoWorker = new Worker('videoQueue', videoWorkerFile, {connection, concurrency: 2});

videoWorker.on('completed', async (job) => {
    //console.log(`${job.id} has completed!`);

    let newuid = job.data.uid
    let test = path.join(__dirname);
    fs.appendFile('/root/CSE356-Course-Project/uploads/newvids.log', newuid + '\n', function (err) {
        if (err) throw err;
        //console.log('Saved!');
    });
    let result = await VideoModel.findOneAndUpdate({_id: newuid},{status: 'complete'},{new:true})
    console.log(result._doc.status)

    //Delete the temp mp4 file
    fs.unlink(job.data.mp4File, (err) => {
        if (err) throw err;
        //console.log('The file was deleted');
    });

    fs.readdir(tempFolderFinished,(files,err) =>{
        files.forEach(file => {
            if(file.name.includes(newuid)){
                fs.readFile(file.parentPath,(err,data) =>{
                    const form = new FormData();
                    form.append('file',data)
                    axios.post(videoStore, form)
                })
            }
        })
    })
});