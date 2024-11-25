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


//Having issues installing hashlib, disabling for now
//const hashlib = require('hashlib');

//Import models
const UserModel = require('../models/User');
const VideoModel = require('../models/Video');
const RatingModel = require('../models/Rating');
const RecommendationModel = require('../models/Recommendation');

//Import recommender
const generateVideoArray = require('../Recommender/recommender');
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
    console.time('request')
    let userPromise = UserModel.findOne({ username: req.session.userId }).exec()
    let videoPromise = VideoModel.findOne({ '_id': req.body.id }, 'metadata').exec()
    let ratingPromise = RatingModel.findOne({ user: req.session.userId, video: req.body.id }).exec()

    if (!req.body.id) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing video id' });
    }

    if(req.body.value === undefined) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing like value' });
    }
    if(req.body.value !== true && req.body.value !== false && req.body.value !== null) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Invalid like value' });
    }

    // let user = await UserModel.findOne({ username: req.session.userId });
    // if (!user) {
    //     return res.json({ status: 'ERROR', error: true, message: 'User not found' });
    // }
    
    // let video = await VideoModel.findOne({ '_id': req.body.id }, 'metadata');
    // if (!video) {
    //     return res.json({ status: 'ERROR', error: true, message: 'Video not found' });
    // }
    
    let existenceTest = await Promise.all([userPromise, videoPromise]).then((result) =>{
        let user = result[0]
        let video = result[1]
        if (!user) {
            res.json({ status: 'ERROR', error: true, message: 'User not found' });
            return false
        }
        if (!video) {
            res.json({ status: 'ERROR', error: true, message: 'Video not found' });
            return false
        }
        return [user,video]
    })
    
    if(!existenceTest){
        return
    }
    let user = existenceTest[0]
    let video = existenceTest[1]
    //Check if the previous value matches the given value. If so, throw an error.
    //POSSIBLE BUG: catch errors do not terminate
    let rating = await ratingPromise

    if (!rating) {
        rating = new RatingModel({
            user: req.session.userId,
            video: req.body.id,
            rating: req.body.value
        })

        try{
            await rating.save()
        }catch(err){
            console.log(err)
            return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
        }
    }
    else {
        if (req.body.value !== null && rating.rating === req.body.value) {
            return res.status(200).json({ status: 'ERROR', error: true, message: 'Rating is already given value' });
        }
        rating.rating = req.body.value;

        try{
            let result = await rating.save()
        }catch(err){
            console.log(err)
            return res.status(200).json({ status: 'ERROR', error: true, message: `Error saving like: ${err}` });
        }
        
    }

    //Get all current likes for the video
    let totalRatings = await RatingModel.find({ video: video._id, rating: true });

    res.status(200).json({ status: 'OK', likes: totalRatings.length });
    console.timeEnd('request')

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
            let totalRatings = await RatingModel.find({ video: video._id });
            let views = totalRatings.length;
            let likes = totalRatings.filter((rating) => rating.rating === true).length;
            let watched = user.watchHistory.includes(video._id);
            response.push({id: video._id, description: video.metadata.description, title: video.metadata.title,  watched: watched, likes: likes, views: views });
        }

        console.log(response);
        return res.status(200).json({ status: 'OK', videos: response });
    }
    else {

        console.log("video with params: " + req.session.userId, req.body.videoId, req.body.count);

        //VideoID provided, use for video based recommendation
        let videoArray = await generateVideoArray(user.username, req.body.videoId, req.body.count);
        let response = [];

        for (let videoId of videoArray) {
            let video = await VideoModel.findOne({ _id: videoId }, 'metadata');
            let totalRatings = await RatingModel.find({ video: video._id });
            let views = totalRatings.length;
            let likes = totalRatings.filter((rating) => rating.rating === true).length;
            let watched = user.watchHistory.includes(video._id);
            response.push({id: video._id, description: video.metadata.description, title: video.metadata.title,  watched: watched, likes: likes, views: views });
        }
        console.log(response);
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
    let tempPathFile = path.join(__dirname,'..', 'tmp',newfilename);

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
        videoQueue.add('processVideo', { mp4File : tempPathFile, uid : newuid},{ removeOnComplete: true, removeOnFail: true })

    });
    
    req.pipe(bb);
    // if(!req.file) {
    //     return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing file'});
    // }
    // if(!req.body.author) {
    //     return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing author'});
    // }
    // if(!req.body.title) {
    //     return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing title'});
    // }
    
    // let newuid;
    
    // let description;
    // if(!req.body.description) {
    //     description = " "
    // }else{
    //     description = req.body.description
    // }
    
    // while(true){
    //     newuid = crypto.randomBytes(8).toString("hex");
    //     let existingUID = await VideoModel.findOne({_id: newuid});

    //     if(!existingUID){
    //         break;
    //     }
    // }

    // //Generate the new video record
    // let newvideo = new VideoModel({
    //     _id: newuid,
    //     metadata: {
    //         title: req.body.title,
    //         description: description,
    //         author: req.body.author
    //     }
    // });

    // //Insert into database
    // let insert_result = newvideo.save().catch((err) => {
    //     console.log("Error saving user: " + err);
    // });
    // res.status(200).json({status: 'OK', id: newuid})

    // videoQueue.add('processVideo', { mp4File : req.file.path, uid : newuid},{ removeOnComplete: true, removeOnFail: true })
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