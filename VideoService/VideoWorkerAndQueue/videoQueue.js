const {Queue, Worker, SandboxedJob} = require('bullmq');
const IORedis = require('ioredis')
const {spawn,spawnSync, exec,execSync} = require("child_process")
const fs = require('fs');
const path = require('path');

//Mongoose
const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = process.env.MONGOURI;
mongoose.connect(mongoURI).then(() => console.log('Connected to MongoDB'));

//Import models
const VideoModel = require('../../models/Video');

//Import worker
const videoWorkerFile = path.join(__dirname, 'videoWorker.js');
const redisHost = "localhost"
const connection = new IORedis({
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD
});

const videoWorker = new Worker('videoQueue', videoWorkerFile, {connection, concurrency: 1});

videoWorker.on('completed', async (job) => {
    console.log(`${job.id} has completed!`);

    let newuid = job.data.uid
    fs.appendFile('/root/cse356/Course-Project/uploads/newvids.log', newuid + '\n', function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
    let result = await VideoModel.findOneAndUpdate({_id: newuid},{status: 'complete'},{new:true})
    console.log(result._doc.status)

    //Delete the temp mp4 file
    fs.unlink(job.data.mp4File, (err) => {
        if (err) throw err;
        console.log('The file was deleted');
    }); 
});