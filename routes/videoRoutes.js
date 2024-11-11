const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();
const fs = require('fs');
const crypto = require("crypto");
const {spawn,spawnSync, exec,execSync} = require("child_process")

const multer  = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, './../tmp/'))
    },
    filename: function (req, file, cb) {
        //Generate the UID, and test if there is a duplicate
        let tempid = crypto.randomBytes(8).toString("hex");
        
        cb(null, 'processing-' + tempid + '.mp4')
    }
  })
const upload = multer({ storage: storage })

//Having issues installing hashlib, disabling for now
//const hashlib = require('hashlib');

//Import models
const UserModel = require('../models/User');
const VideoModel = require('../models/Video');

//Import video metadata
// const videoData = JSON.parse(fs.readFileSync('m1.json'));
// const videoIDs = Object.keys(videoData);
// All metadata is now in the database

const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(200).json({ status: 'ERROR', error: 'true', message: 'Unauthorized' });
    }
};

router.get('/api/', isAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'video.html'));
});

router.get('/api/manifest/:id', isAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `${req.params.id}.mpd`));
});

router.get('/api/videoRequest/:id/:file', isAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `${req.params.file}`));
})

router.get('/media/:file', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `${req.params.file}`));
})

router.get('/api/thumbnail/:id', isAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'thumbnails', `${req.params.id}.jpg`));
});

//Body should contain {"id":"videoID", "like":"true/false/null"}
router.post('/api/like', isAuth, async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video id' });
    }
    let video = await VideoModel.findOne({ '_id': req.body.id }, 'metadata');
    if (!video) {
        return res.json({ status: 'ERROR', error: true, message: 'Video not found' });
    }
    let user = await UserModel.findOne({ username: req.session.userId });
    if (!user) {
        return res.json({ status: 'ERROR', error: true, message: 'User not found' });
    }
    //Check if the previous value matches the given value. If so, throw an error.
    let likedBy = video.metadata.likedBy;
    for(let i = 0; i < likedBy.length; i++) {
        if(likedBy[i].userId === req.session.userId) {
            if((req.body.like === 'true' && likedBy[i].likeType === true) || (req.body.like === 'false' && likedBy[i].likeType === false) || (req.body.like === 'null' && likedBy[i].likeType === null)) { 
                return res.status(200).json({ status: 'ERROR', error: true, message: 'Already liked' });
            }
            else {
                likedBy[i].likeType = req.body.like;
                if (req.body.like === 'null') {
                    likedBy[i].likeType = null;
                }
                await video.save().catch((err) => {
                    return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
                })
                return res.status(200).json({ status: 'OK' });
            }
        }
    }
    return res.status(200).json({ status: 'ERROR', error: true, message: 'View not found' });
});

router.post('/api/view', isAuth, async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video id' });
    }
    let video = await VideoModel.findOne({ '_id': req.body.id }, 'metadata');
    if (!video) {
        res.json({ status: 'ERROR', error: true, message: 'Video not found' });
    }
    //Check if the user has already viewed the video
    let likedBy = video.metadata.likedBy;
    for(let i = 0; i < likedBy.length; i++) {
        if(likedBy[i].userId === req.session.userId) {
            return res.status(200).json({ status: 'ERROR', error: true, message: 'Already viewed' });
        }
    }
    //Add view to the video
    likedBy.push({ userId: req.session.userId, likeType: null });
    await video.save().catch((err) => {
        return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
    })
    return res.status(200).json({ status: 'OK' });
});

//Give count number of videos with metadata
// let videoCounter = 0;
// router.post('/api/videos', isAuth, async (req, res) => {
//     if(!req.body.count) {
//         return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing count'});
//     }
//     let response = [];
//     for(let i = 0; i < req.body.count; i++) {
//         let j = (i + videoCounter) % videoIDs.length;
//         response.push({ id: videoIDs[j], title: videoIDs[j], description: videoData[videoIDs[j]] });
//     }
//     videoCounter += req.body.count;
//     return res.status(200).json({ status: 'OK', videos: response });
// });
// Old route

router.post('/api/videos', isAuth, async (req, res) => {
    if(!req.body.count) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing count'});
    }
    let response = [];
    //let query = await VideoModel.find({},null,{limit:req.body.count}).lean().exec();
    let query = await VideoModel.aggregate([{ $sample : { size : req.body.count}}])
    console.log(query);
    for(let i = 0; i < req.body.count; i++) {
        let likedBy = query[i].metadata.likedBy;
        let watched = likedBy.includes(req.session.userId);
        response.push({id: query[i]._id, description: query[i].metadata.description, title: query[i].metadata.title,  watched: watched, likes: query[i].metadata.likes, views: query[i].metadata.views });
    }
    return res.status(200).json({ status: 'OK', videos: response });
});

router.post('/api/upload', upload.single('mp4File') ,async (req,res) => {

    console.log('Current directory:', __dirname); 

    if(!req.file) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing file'});
    }
    if(!req.body.author) {
        fs.unlink(req.file.path, (err) => {
            if (err) throw err;
            console.log('The file was deleted');
          }); 
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing author'});
    }
    if(!req.body.title) {
        fs.unlink(req.file.path, (err) => {
            if (err) throw err;
            console.log('The file was deleted');
          }); 
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing title'});
    }
    
    let newuid;
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
            title: req.body.title,
            description: "none",
            author: req.body.author
        }
    });
    //Insert into database
    await newvideo.save().catch((err) => {
        console.log("Error saving user: " + err);
    });

    //Upload works
    //Will reimplement with a threadpool and moved off to another machine
    execSync(`sh ./VideoService/upload.sh ${req.file.path} ${newuid}`, {
       cwd: '/root/cse356/Course-Project'
    })

    VideoMode.findOneAndUpdate({_id: newuid},{status: 'completed'})

    fs.appendFile('/root/cse356/Course-Project/uploads/newvids.log', newuid + '\n', function (err) {
        if (err) throw err;
        console.log('Saved!');
    });

    //Delete the temp mp4 file
    fs.unlink(req.file.path, (err) => {
        if (err) throw err;
        console.log('The file was deleted');
      }); 

    res.status(200).json({id: newuid})
});
router.post('/api/processing-status', isAuth, async (req,res) => {
    let currentUser = req.session.userId
    //currentUser = 'testuser1' For test user
    let allUserVideos =  await VideoModel.find({'metadata.author' : currentUser}).lean().exec()
    console.log(allUserVideos)
    let response = []
    allUserVideos.forEach((video) => {
        response.push({id: video._id, title: video.metadata.title, status: video.status})
    })
    res.status(200).json({videos: response})
});

module.exports = router;