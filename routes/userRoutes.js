const express = require('express');
const session = require("express-session");
const bcrypt = require('bcrypt');
const UserModel = require('../models/User');

const router = express.Router();

router.post('/adduser', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'Missing required fields' });
    }
    //Check if the username already exists
    let existingUser = await UserModel.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    });
    if (existingUser) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'User already exists' });
    }

    //Create the UserModel
    const hash = await bcrypt.hash(password, 10);
    let user = new UserModel({
        username: username,
        password: hash,
        email: email,
        verified: false
    });
    
    //Save the user
    user.save()
        .then(() => {
            return res.status(200).json({ status: 'error', error: 'false', message: 'User created successfully' });
        })
        .catch((err) => {
            return res.status(200).json({ status: 'error', error: 'true', message: 'Error creating user' });
        });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'Missing required fields' });
    }
    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'User does not exist' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'Invalid credentials' });
    }
    req.session.isAuth = true;
    res.redirect('/');
});

router.post('/logout', (req, res) => {
    if (!req.session.isAuth) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'You are not logged in' });
    }
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/');
})

module.exports = router;