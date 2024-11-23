const {Queue, Worker} = require('bullmq');
const IORedis = require('ioredis')
const {spawn,spawnSync, exec,execSync} = require("child_process")
const fs = require('fs');
const path = require('path');
const childNumber = process.argv[2]
//Import models

const redisHost = "localhost"
const connection = new IORedis({
    maxRetriesPerRequest: null,
    port: 5131,
    host: redisHost
});

const worker = new Worker('video-test-queue', async job => {
    let newuid = job.data.uid
    let mp4File = Buffer.from(job.data.mp4File.data)
    try{
        let tempFileName = 'processing-' + newuid + '.mp4'
        let pathToTempFile = path.join(__dirname,'VideoDump'+childNumber,tempFileName)
        let videofile = fs.writeFileSync(pathToTempFile, mp4File)
    
        // exec(`sh ./VideoService/upload.sh ${pathToTempFile} ${newuid}`, {
        //     cwd: '/root/cse356/Course-Project'
        //      },
        //      async (error, stdout, stderr) =>{
        //          let result = await VideoModel.findOneAndUpdate({_id: newuid},{status: 'complete'},{new:true})
        //          console.log(result._doc.status)
         
        //          fs.appendFile('./uploads/newvids.log', newuid + '\n', function (err) {
        //              if (err) throw err;
        //              console.log('Saved!');
        //          });
        //          //Delete the temp mp4 file
        //         fs.unlink(pathToTempFile, (err) => {
        //             if (err) throw err;
        //             console.log('The file was deleted');
        //         }); 
        //          }
        //      )
        return
    }catch(err){
        console.log(err)
    }
  }, {connection,
    concurrency : 2
  });
