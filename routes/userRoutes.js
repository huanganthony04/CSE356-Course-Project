const express = require('express');
const session = require("express-session");
const bcrypt = require('bcrypt');
const UserModel = require('../models/User');
const nodemailer = require('nodemailer');


const router = express.Router();

router.post('/adduser', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Missing required fields' });
    }
    //Check if the username already exists
    let existingUser = await UserModel.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    });
    if (existingUser) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'User already exists' });
    }

    //Create a random verification key
    const key = Math.random().toString(36).substring(2, 15);

    //Create the UserModel
    const hash = await bcrypt.hash(password, 10);
    let user = new UserModel({
        username: username,
        password: hash,
        email: email,
        verified: false,
        verificationKey: key
    });
    
    //Save the user
    await user.save().catch((err) => {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: `${err}` })
    });


    //Send the verification email
    const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: 'no-reply@anthonysgroup.cse356.compas.cs.stonybrook.edu',
        to: email,
        subject: 'Verify your email',
        html: 
            ` 
                <p>Hello ${username},</p>
                <p>Click the following link to verify your email: </p>
                <a href="http://anthonysgroup.cse356.compas.cs.stonybrook.edu/verify?email=${email}&key=${key}">http://anthonysgroup.cse356.compas.cs.stonybrook.edu/verify?email=${email}&key=${key}</a>
            `
    };
    transporter.sendMail(mailOptions)
        .then(() => {
            return res.status(200).json({ status: 'OK', error: 'false', message: 'User added and email sent successfully' });
        })
        .catch((err) => {
            return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Error sending email' });
        });
});

router.get('/verify', async (req, res) => {
    const { email, key } = req.query;
    if (!email || !key) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Missing required fields' });
    }
    let user = await UserModel.findOne({ email });
    if (!user) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'User with email does not exist' });
    }
    if (user.verified) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'User is already verified' });
    }
    if (key !== user.verificationKey) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Invalid verification key' });
    }
    user.verified = true;

    user.save()
        .then(() => {
            return res.status(200).json({ status: 'OK', error: 'false', message: 'User verified successfully' });
        })
        .catch((err) => {
            return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Error verifying user' });
        });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Missing required fields' });
    }
    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'User does not exist' });
    }
    if (!user.verified) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'User is not verified' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'Invalid credentials' });
    }
    req.session.isAuth = true;
    res.redirect('/');
});

router.post('/logout', (req, res) => {
    if (!req.session.isAuth) {
        return res.status(200).json({ status: 'ERROR', error: 'true', message: 'You are not logged in' });
    }
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/');
})

module.exports = router;