const { parentPort,workerData} = require("worker_threads");
const {spawn,spawnSync, exec,execSync} = require("child_process")
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

//Import models
const VideoModel = require('./models/Video');

//MongoDB
const mongoURI = 'mongodb://admin:cse356courseproject@127.0.0.1:27017/CSE356?authSource=admin';

//Set up connection to mongo client
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'));


try{
    let newuid = workerData.uid
    let tempFileName = 'processing-' + newuid + '.mp4'
    let pathToTempFile = path.join(__dirname, 'tmp',tempFileName)
    let videofile = fs.writeFileSync(pathToTempFile, workerData.mp4File)

    exec(`sh ./VideoService/upload_test.sh ${pathToTempFile} ${newuid}`, {
        cwd: '/root/cse356/Course-Project'
         },
         async (error, stdout, stderr) =>{
             insert_result.then(() =>{
                 VideoModel.findOneAndUpdate({_id: newuid},{status: 'completed'})
             })
             
     
             fs.appendFile('/root/cse356/Course-Project/uploads/newvids.log', newuid + '\n', function (err) {
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


