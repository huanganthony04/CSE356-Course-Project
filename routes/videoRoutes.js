const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();
const fs = require('fs');
const crypto = require("crypto");
const videoQueue = require('./../videoQueue');

const {spawn,spawnSync, exec,execSync} = require("child_process")

//const {Worker,parentPort, MessageChannel } = require('worker_threads');

// const multer  = require('multer');
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, './../tmp/'))
//     },
//     filename: function (req, file, cb) {
//         //Generate the UID, and test if there is a duplicate
//         let tempid = crypto.randomBytes(8).toString("hex");
        
//         cb(null, 'processing-' + tempid + '.mp4')
//     }
//   })
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

//Having issues installing hashlib, disabling for now
//const hashlib = require('hashlib');

//Import models
const UserModel = require('../models/User');
const VideoModel = require('../models/Video');
const RatingModel = require('../models/Rating');
const RecommendationModel = require('../models/Recommendation');

//Import recommender
const generateVideoArray = require('../Recommender/recommender');

//Import video metadata
// const videoData = JSON.parse(fs.readFileSync('m1.json'));
// const videoIDs = Object.keys(videoData);
// All metadata is now in the database

//Start up queue

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

//Body should contain {"id":"videoID", "value":"true/false/null"}
router.post('/api/like', isAuth, async (req, res) => {
    
    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video id' });
    }
    if(req.body.value === undefined) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing like value' });
    }
    if(req.body.value !== true && req.body.value !== false && req.body.value !== null) {
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
        rating = new RatingModel({
            user: user._id,
            video: video._id,
            rating: req.body.value
        })
        await rating.save().catch((err) => {
            return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
        })
    }
    else {
        if (req.body.value !== null && rating.rating === req.body.value) {
            return res.status(200).json({ status: 'ERROR', error: true, message: 'Rating is already given value' });
        }
        rating.rating = req.body.value;
        await rating.save().catch((err) => {
            return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
        });
    }

    //Get all current likes for the video
    let totalRatings = await RatingModel.find({ video: video._id, rating: true });
    return res.status(200).json({ status: 'OK', likes: totalRatings.length });
});

//Should call when video is first viewed by the user
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
    if (user.watchHistory.includes(video._id)) {
        return res.status(200).json({ status: 'OK', viewed: true });
    }

    //Add view to the video
    user.watchHistory.push(video._id);

    await user.save().catch((err) => {
        return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving view: ${err}` });
    });

    return res.status(200).json({ status: 'OK', viewed: false });
});

//If { continue: true }, continue using the current recommendation list and return { count } videos (use for infinite scrolling)
//Otherwise regenerate the recommendation list for the current user and return { count } videos
router.post('/api/videos', isAuth, async (req, res) => {
    if(!req.body.count) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing count'});
    }

    let user = await UserModel.findOne({ username: req.session.userId });
    if (!user) {
        return res.json({ status: 'ERROR', error: true, message: 'User not found' });
    }

    //Create a recommendation array for the user if it doesn't exist, or regenerate if continue is false
    let recommendation = await RecommendationModel.findOne({ user: user._id });
    if (!recommendation) {
        let videoArray = await generateVideoArray(user.username);
        recommendation = new RecommendationModel({
            user: user._id,
            videoIds: videoArray,
            index: 0
        })
    }
    else if (!req.body.continue) {
        let videoArray = await generateVideoArray(user.username);
        recommendation.videoIds = videoArray;
        recommendation.index = 0;
    }

    let videos = recommendation.videoIds.slice(recommendation.index, recommendation.index + req.body.count);
    recommendation.index += req.body.count;

    await recommendation.save().catch((err) => {
        return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving recommendation: ${err}` });
    });

    let response = [];

    for(let i = 0; i < req.body.count; i++) {
        let video = await VideoModel.findOne({ _id: videos[i] }, 'metadata');
        let totalRatings = await RatingModel.find({ video: video._id });
        let views = totalRatings.length;
        let likes = totalRatings.filter((rating) => rating.rating === true).length;
        let watched = user.watchHistory.includes(video._id);
        response.push({id: video._id, description: video.metadata.description, title: video.metadata.title,  watched: watched, likes: likes, views: views });
    }

    return res.status(200).json({ status: 'OK', videos: response });
});

router.post('/api/upload', upload.single('mp4File') ,async (req,res) => {

    if(!req.file) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing file'});
    }
    if(!req.body.author) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing author'});
    }
    if(!req.body.title) {
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
    let insert_result = newvideo.save().catch((err) => {
        console.log("Error saving user: " + err);
    });
    videoQueue.add('videoQueue', { mp4File : req.file.buffer, uid : newuid})
    //const videoWorker = new Worker("./videoWorker.js", {workerData : { mp4File : req.file.buffer, uid : newuid}});
    // //Generate the new video record
    // let newvideo = new VideoModel({
    //     _id: newuid,
    //     metadata: {
    //         title: req.body.title,
    //         description: "none",
    //         author: req.body.author
    //     }
    // });
    // //Insert into database
    // let insert_result = newvideo.save().catch((err) => {
    //     console.log("Error saving user: " + err);
    // });

    // //Upload works
    // //Will reimplement with a threadpool and moved off to another machine
    // exec(`sh ./VideoService/upload.sh ${req.file.path} ${newuid}`, {
    //    cwd: '/root/cse356/Course-Project'
    // },
    //     async (error, stdout, stderr) =>{
    //         insert_result.then(() =>{
    //             VideoModel.findOneAndUpdate({_id: newuid},{status: 'completed'})
    //         })
            

    //         fs.appendFile('/root/cse356/Course-Project/uploads/newvids.log', newuid + '\n', function (err) {
    //             if (err) throw err;
    //             console.log('Saved!');
    //         });

    //         //Delete the temp mp4 file
    //         fs.unlink(req.file.path, (err) => {
    //             if (err) throw err;
    //             console.log('The file was deleted');
    //         }); 
    // })

    res.status(200).json({status: 'OK', id: newuid})
});
router.get('/api/processing-status', isAuth, async (req,res) => {
    let currentUser = req.session.userId
    //currentUser = 'testuser1' For test user
    let allUserVideos =  await VideoModel.find({'metadata.author' : currentUser}).lean().exec()
    console.log(allUserVideos)
    let response = []
    allUserVideos.forEach((video) => {
        response.push({id: video._id, title: video.metadata.title, status: video.status})
    })
    res.status(200).json({status: 'OK', videos: response})
});

module.exports = router;