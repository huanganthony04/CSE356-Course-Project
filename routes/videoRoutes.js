const express = require('express');
const path = require('path');
const session = require("express-session");
const router = express.Router();

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
    //TODO
});

router.get('/api/thumbnail/:id', isAuth, (req, res) => {
    //TODO
});

module.exports = router;