const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();
const fs = require('fs');

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

module.exports = router;