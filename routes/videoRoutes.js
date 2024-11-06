const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();
const fs = require('fs');

//Having issues installing hashlib, disabling for now
//const hashlib = require('hashlib');

//Import models
const UserModel = require('../models/User');
const VideoModel = require('../models/Video');

//Import video metadata
const videoData = JSON.parse(fs.readFileSync('m1.json'));
const videoIDs = Object.keys(videoData);

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
    res.sendFile(path.join(__dirname, '..', 'public', 'thumbnails', `${req.params.id}_thumbnail.jpg`));
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
    console.log(video, user);

});


//Give count number of videos with metadata
let videoCounter = 0;
router.post('/api/videos', isAuth, (req, res) => {
    if(!req.body.count) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing count'});
    }
    let response = [];
    for(let i = 0; i < req.body.count; i++) {
        let j = (i + videoCounter) % videoIDs.length;
        response.push({ id: videoIDs[j], title: videoIDs[j], description: videoData[videoIDs[j]] });
    }
    videoCounter += req.body.count;
    return res.status(200).json({ status: 'OK', videos: response });
});

router.post('api/upload', (req,res) => {
    if(!req.body.author) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing author'});
    }
    if(!req.body.title) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing title'});
    }
    if(!req.body.mp4file) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing file'});
    }

});
router.post('/api/processing-status', (req,res) => {
    
});
module.exports = router;