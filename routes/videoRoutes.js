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

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'video.html'));
});

module.exports = router;