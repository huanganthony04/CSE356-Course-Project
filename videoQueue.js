const {Queue, Worker} = require('bullmq');
const IORedis = require('ioredis')
const {spawn,spawnSync, exec,execSync} = require("child_process")
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

//Import models
const VideoModel = require('./models/Video');


const connection = new IORedis({
    maxRetriesPerRequest: null,
});

const videoQueue = new Queue('videoQueue', {connection});

const worker = new Worker('videoQueue', async job => {
    console.log(job.data);
    let newuid = job.data.uid
    let mp4File = Buffer.from(job.data.mp4File.data)
    try{
        let tempFileName = 'processing-' + newuid + '.mp4'
        let pathToTempFile = path.join(__dirname,'tmp',tempFileName)
        let videofile = fs.writeFileSync(pathToTempFile, mp4File)
    
        exec(`sh ./VideoService/upload.sh ${pathToTempFile} ${newuid}`, {
            cwd: '/root/cse356/Course-Project'
             },
             async (error, stdout, stderr) =>{
                 let result = await VideoModel.findOneAndUpdate({_id: newuid},{status: 'complete'},{new:true})
                 console.log(result._doc.status)
         
                 fs.appendFile('./uploads/newvids.log', newuid + '\n', function (err) {
                     if (err) throw err;
                     console.log('Saved!');
                 });
                 //Delete the temp mp4 file
                fs.unlink(pathToTempFile, (err) => {
                    if (err) throw err;
                    console.log('The file was deleted');
                }); 
                 }
             )
         
    }catch(err){
        console.log(err)
    }
  }, {connection,
        limiter: {
            max: 1,
            duration: 1000*60*1
        }
  });
module.exports = videoQueue;
