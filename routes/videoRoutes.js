const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();
const fs = require('fs');
const crypto = require("crypto");
const {spawn,spawnSync, exec,execSync} = require("child_process")

//Gorse SDK
const { Gorse } = require("gorsejs")
const GorseClient = new Gorse({ endpoint: "http://127.0.0.1:8088" })

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

router.post('/api/like', isAuth, async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing id' });
    }
    let video = await VideoModel.findOne({ '_id': req.body.id }, 'title description');
    if (!video) {
        res.json({ status: 'ERROR', error: true, message: 'Video not found' });
    }
    let user = await UserModel.findOne({ username: req.session.userId });
    if (!user) {
        res.json({ status: 'ERROR', error: true, message: 'User not found' });
    }
    console.log(video, user, " found");
    await GorseClient.insertFeedbacks([{ FeedbackType: "like", UserId: req.session.userId, ItemId: req.body.id }]);
    return res.status(200).json({ status: 'OK' });
});

router.post('/api/view', isAuth, async (req, res) => {
    //TODO
})



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
    let query = await VideoModel.find({},null,{limit:req.body.count}).lean().exec();
    console.log(query);
    for(let i = 0; i < req.body.count; i++) {
        response.push({id: query[i]._id, title: query[i].metadata.title, description: query[i].metadata.description });
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
    execSync(`sh ./VideoService/upload.sh ${req.file.path} ${newuid}`, {
       cwd: '/root/cse356/Course-Project'
    })

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
router.post('/api/processing-status', (req,res) => {
    let currentUser = req.session.userId
});

module.exports = router;