const express = require('express');
const path = require('path');
const router = express.Router();
const crypto = require("crypto");
const IORedis = require('ioredis')
const {Queue, Worker} = require('bullmq');
const fs = require('fs')
require('dotenv').config();

//File handling solution
// const multer = require('multer')
// //const storage = multer.memoryStorage()
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
// const upload = multer({ storage: storage })
const busboy = require('busboy')

//Import models
const UserModel = require('../models/User');
const VideoModel = require('../models/Video');
const RatingModel = require('../models/Rating');
const RecommendationModel = require('../models/Recommendation');


//Having issues installing hashlib, disabling for now
//const hashlib = require('hashlib');

//Import recommender
const { generateVideoArray, ultraFastRecs } = require('../Recommender/recommender');
const { title } = require('process');

//Import video metadata
// const videoData = JSON.parse(fs.readFileSync('m1.json'));
// const videoIDs = Object.keys(videoData);
// All metadata is now in the database

//Start up queue
// const connection = new IORedis({
//     maxRetriesPerRequest: null,
//     host: process.env.REDIS_DOMAIN,
//     port: process.env.REDIS_PORT,
//     password: process.env.REDIS_PASSWORD
// });
const connection = new IORedis({
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD
});

connection.on('error', error => {
if (error.code === 'ECONNRESET') {
    console.log('Connection to Redis Session Store timed out.');
} else if (error.code === 'ECONNREFUSED') {
    console.log('Connection to Redis Session Store refused!');
} else console.log(error);
});

// Listen to 'reconnecting' event to Redis
connection.on('reconnecting', err => {
if (connection.status === 'reconnecting')
    console.log('Reconnecting to Redis Session Store...');
else console.log('Error reconnecting to Redis Session Store.');
});

// Listen to the 'connect' event to Redis
connection.on('connect', err => {
if (!err) console.log('Connected to Redis Session Store!');
});
let videoQueue = new Queue('videoQueue', { connection });

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

    let [ user, video, rating ] = await Promise.all([
        UserModel.findOne({ username: req.session.userId })
            .then((user) => {
                if (!user) {
                    return res.json({ status: 'ERROR', error: true, message: 'User not found' });
                }
                return user;
            }),
        VideoModel.findOne({ _id: req.body.id }, 'metadata')
            .then((video) => {
                if (!video) {
                    return res.json({ status: 'ERROR', error: true, message: 'Video not found' });
                }
                return video;
            }),
        RatingModel.findOne({ user: req.session.userId, video: req.body.id })
    ]);

    if (!rating) {

        rating = new RatingModel({
            user: req.session.userId,
            video: req.body.id,
            rating: req.body.value
        });

        await rating.save();

        if (req.body.value === true) {
            video.metadata.likes = video.metadata.likes + 1;
            res.send({status: 'OK', likes: video.metadata.likes});
            try {
                video.save();
            }
            catch (err) {
                return console.log(err);
            }
        }
    }

    else {

        if (req.body.value !== null && rating.rating === req.body.value) {
            return res.status(200).json({ status: 'ERROR', error: true, message: 'Rating is already given value' });
        }

        let prevRating = rating.rating;
        rating.rating = req.body.value;

        await rating.save();

        //We know the rating changed from not true -> true, so we add a like
        if (req.body.value === true) {
            video.metadata.likes = video.metadata.likes + 1;
        }
        //We know the rating changed from true -> not true, so we remove a like
        else if (prevRating === true) {
            video.metadata.likes = video.metadata.likes - 1;
        }

        res.send({status: 'OK', likes: video.metadata.likes});

        try {
            video.save();
        }
        catch (err) {
            return console.log(err);
        }
    }
});

//Should call when video is first viewed by the user
router.post('/api/view', isAuth, async (req, res) => {

    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video id' });
    }

    let [ user, video ] = await Promise.all([
        UserModel.findOne({ username: req.session.userId })
            .then((user) => {
                if (!user) {
                    return res.json({ status: 'ERROR', error: true, message: 'User not found' });
                }
                return user;
            }),
        VideoModel.findOne({ _id: req.body.id })
            .then((video) => {
                if (!video) {
                    return res.json({ status: 'ERROR', error: true, message: 'Video not found' });
                }
                return video;
            })
    ]);

    //Check if the user has already viewed the video
    if (user.watchHistory.includes(video._id)) {
        return res.status(200).json({ status: 'OK', viewed: true });
    }

    //Add view to the video
    user.watchHistory.push(video._id);
    video.metadata.views = video.metadata.views + 1;

    res.status(200).json({ status: 'OK', viewed: false });

    try {
        user.save();
        video.save();
    }
    catch(err) {
        return console.log(err);
    }
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

    if(!req.body.videoId) {
        //Old system used in infinite scroll.
        //Create a recommendation array for the user if it doesn't exist, or regenerate if continue is false
        let recommendation = await RecommendationModel.findOne({ user: user.username });
        if (!recommendation) {
            let videoArray = await generateVideoArray(user.username);
            recommendation = new RecommendationModel({
                user: req.session.userId,
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

        recommendation.save();

        let response = [];

        for(let i = 0; i < req.body.count; i++) {
            let video = await VideoModel.findOne({ _id: videos[i] }, 'metadata');
            let watched = user.watchHistory.includes(video._id);
            response.push({id: video._id, description: video.metadata.description, title: video.metadata.title,  watched: watched, likes: video.metadata.likes, views: video.metadata.views });
        }
        return res.status(200).json({ status: 'OK', videos: response });
    }
    else {
        //VideoID provided, use for video based recommendation
        let videoArray = await ultraFastRecs(user.username, req.body.videoId, req.body.count);
        let response = [];

        for (let videoId of videoArray) {
            let video = await VideoModel.findOne({ _id: videoId }, 'metadata');
            let watched = user.watchHistory.includes(video._id);
            response.push({id: video._id, description: video.metadata.description, title: video.metadata.title,  watched: watched, likes: video.metadata.likes, views: video.metadata.views });
        }

        return res.status(200).json({ status: 'OK', videos: response });
    }

});

//Check if no file
//What to do if we have an empty field, or non-existant field?
router.post('/api/upload' ,async (req,res) => {
    //author, title, description, mp4File

    let fileExists = false
    let newuid;
    while(true){
        newuid = crypto.randomBytes(8).toString("hex");
        let existingUID = await VideoModel.findOne({_id: newuid});

        if(!existingUID){
            break;
        }
    }
    //console.log(newuid)
    let newfilename = 'processing-' + newuid + '.mp4'
    let tempPathFile = path.join(__dirname,'..', 'tmp','new',newfilename);

    let reqBody = {}
    let fieldCount = 0
    const bb = busboy({ headers: req.headers });
    bb.on('file', function(fieldname, file, info) {
        fileExists = true
        file.pipe(fs.createWriteStream(tempPathFile));

    });
    bb.on('field', function(name,val,info){
        fieldCount++
        //console.log(`Field [${name}]: value: %j`, val);
        reqBody[name] = val
        
    })
    bb.on('finish', function() {

        if(fileExists == false){
            return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video'});
        }
        if(fieldCount == 3){

            if(reqBody.author == '') {
                return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing author'});
            }
            if(reqBody.title == '') {
                return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing title'});
            }
            res.status(200).json({status: 'OK', id: newuid})
        }
        //console.log('finished reading!')
        //Generate the new video record
        let newvideo = new VideoModel({
            _id: newuid,
            metadata: {
                title: reqBody.title,
                description: reqBody.description,
                author: reqBody.author
            }
        });

        // //Insert into database
        let insert_result = newvideo.save().catch((err) => {
            console.log("Error saving user: " + err);
        });
        //console.log(tempPathFile)
        videoQueue.add('processVideo', { mp4File : tempPathFile, uid : newuid},{ removeOnComplete: true, removeOnFail: true })

    });
    
    req.pipe(bb);
});
router.get('/api/processing-status', isAuth, async (req,res) => {
    let currentUser = req.session.userId
    let allUserVideos =  await VideoModel.find({'metadata.author' : currentUser}).lean().exec()

    let response = []
    allUserVideos.forEach((video) => {
        response.push({id: video._id, title: video.metadata.title, status: video.status})
    })
    res.status(200).json({status: 'OK', videos: response})
    //console.log(response)
});

module.exports = router;