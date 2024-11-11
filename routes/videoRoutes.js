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
const RatingModel = require('../models/Rating');

//Import recommender
const generateVideoStack = require('../Recommender/recommender');

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
    if(req.body.like === undefined) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing like value' });
    }
    if(req.body.like !== true && req.body.like !== false && req.body.like !== null) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Invalid like value' });
    }

    let user = await UserModel.findOne({ username: req.session.userId });
    if (!user) {
        return res.json({ status: 'ERROR', error: true, message: 'User not found' });
    }
    let video = await VideoModel.findOne({ '_id': req.body.id }, 'metadata');
    if (!video) {
        return res.json({ status: 'ERROR', error: true, message: 'Video not found' });
    }

    //Check if the previous value matches the given value. If so, throw an error.
    let rating = await RatingModel.findOne({ user: user._id, video: video._id });
    if (!rating) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'View not found' });
    }
    if (rating.rating === req.body.like) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Rating is already given value' });
    }
    rating.rating = req.body.like;
    await rating.save().catch((err) => {
        return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
    });
    return res.status(200).json({ status: 'OK' });
});

router.post('/api/view', isAuth, async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video id' });
    }

    let user = await UserModel.findOne({ username: req.session.userId });
    if (!user) {
        return res.json({ status: 'ERROR', error: true, message: 'User not found' });
    }
    let video = await VideoModel.findOne({ '_id': req.body.id }, 'metadata');
    if (!video) {
        res.json({ status: 'ERROR', error: true, message: 'Video not found' });
    }

    //Check if the user has already viewed the video
    let rating = await RatingModel.findOne({ user: user._id, video: video._id });
    if (rating) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Already viewed' });
    }

    //Add view to the video
    const newRating = new RatingModel({
        user: user._id,
        video: video._id,
        rating: null
    });
    await newRating.save().catch((err) => {
        return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving view: ${err}` });
    });

    return res.status(200).json({ status: 'OK' });
});

//A stack to store videos (their _id fields), from most to least recommended
//When /api/videos wants { count } videos, pop { count } from this stack.
//If the stack is empty recall the recommender to generate a new stack.

//This is horrendously concurrency-unsafe and bad. Fix later by moving user-specific stacks to their own database.
let videoStack = [];
let videoStackUser = "";

router.post('/api/videos', isAuth, async (req, res) => {
    if(!req.body.count) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing count'});
    }

    let user = await UserModel.findOne({ username: req.session.userId });
    if (!user) {
        return res.json({ status: 'ERROR', error: true, message: 'User not found' });
    }

    let response = [];

    if (videoStack.length < req.body.count) {
        let newStack = await generateVideoStack(req.session.userId);
        videoStack = newStack.concat(videoStack);
    }

    for(let i = 0; i < req.body.count; i++) {
        let video = await VideoModel.findOne({ _id: videoStack.pop()._id }, 'metadata');

        let totalRatings = await RatingModel.find({ video: video._id });

        let views = totalRatings.length;
        let likes = totalRatings.filter((rating) => rating.rating === true).length;
        let watched = totalRatings.filter((rating) => rating.user === user._id).length > 0;

        response.push({id: video._id, description: video.metadata.description, title: video.metadata.title,  watched: watched, likes: likes, views: views });
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