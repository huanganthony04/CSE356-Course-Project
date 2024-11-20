const express = require('express');
const path = require('path');
const IORedis = require('ioredis')
const {Queue, Worker} = require('bullmq');
const crypto = require('crypto')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const app = express();
const PORT = 8008;

//Redis connection option
const redisHost = "localhost"
const connection = new IORedis({
    port: 5131,
    host: redisHost
});

const videoTestQueue = new Queue('video-test-queue', { connection });

app.post('/api/upload' ,upload.single('mp4File'), (req,res) =>{
    newuid = crypto.randomBytes(8).toString("hex");
    res.status(200).json({})
    videoTestQueue.add('videoProcess', { mp4File : req.file.buffer, uid : newuid})
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});