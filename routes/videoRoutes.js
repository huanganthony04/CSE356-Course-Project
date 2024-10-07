const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();

const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.status(200).json({ status: 'ERROR', error: 'true', message: 'Unauthorized' });
    }
};

router.get('/', isAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'video.html'));
});

router.get('/debug', (req,res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'video.html'));
});

router.get('/media/output.mpd', isAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'media', 'output.mpd'));
})

router.get('/media/noauth/output.mpd', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'media', 'output.mpd'));
});

router.get('/media/noauth/chunk_(\\d+)_(\\w+).mp4', (req, res) => {
    const bitrate = req.params[0];
    const segment = req.params[1];
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `chunk_${bitrate}_${segment}.mp4`));
});

router.get('/media/noauth/chunk_(\\d+)_(\\d+).m4s', (req, res) => {
    const bitrate = req.params[0];
    const segment = req.params[1];
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `chunk_${bitrate}_${segment}.m4s`));
});

router.get('/media/chunk_(\\d+)_(\\d+).m4s', (req, res) => {
    const bitrate = req.params[0];
    const segment = req.params[1];
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `chunk_${bitrate}_${segment}.m4s`));
});

router.get('/media/chunk_*', (req, res) => {
    const params = req.url.split('_');
    const bitrate = params[1];
    const segment = parseInt(params[2].substring(8, 10));
    res.sendFile(path.join(__dirname, '..', 'public', 'media', `chunk_${bitrate}_${segment}.m4s`));
});

module.exports = router;