const express = require('express');
const session = require("express-session");
const bcrypt = require('bcrypt');
const UserModel = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/adduser', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        console.log("Missing required fields");
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing required fields' });
    }
    //Check if the username already exists
    let existingUser = await UserModel.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    });
    if (existingUser) {
        console.log("User already exists");
        return res.status(200).json({ status: 'ERROR', error: true, message: 'User already exists' });
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

    //Send the verification email
    const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    const link = `http://anthonysgroup.cse356.compas.cs.stonybrook.edu/verify?email=${encodeURIComponent(email)}&key=${key}`;

    const mailOptions = {
        from: 'root@anthonysgroup.cse356.compas.cs.stonybrook.edu',
        to: email,
        subject: 'Verify your email',
        text: `${link}`
    };
    await transporter.sendMail(mailOptions).catch((err) => {
        console.log("Error sending email: " + err);
        return res.status(200).json({ status: 'ERROR', error: true, message: `${err}` })
    });

    console.log("Email sent");

    //Save the user
    await user.save().catch((err) => {
        console.log("Error saving user: " + err);
        return res.status(200).json({ status: 'ERROR', error: true, message: `${err}` })
    });

    console.log("User created successfully");
    return res.status(200).json({ status: 'OK' });
});

router.get('/verify', async (req, res) => {
    let { email, key } = req.query;
    email = decodeURIComponent(email);
    console.log('Verifying' + email, key);
    if (!email || !key) {
        console.log("Missing required fields");
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing required fields' });
    }
    let user = await UserModel.findOne({ email });
    if (!user) {
        console.log("User with email does not exist");
        return res.status(200).json({ status: 'ERROR', error: true, message: 'User with email does not exist' });
    }
    if (user.verified) {
        console.log("User is already verified");
        return res.status(200).json({ status: 'ERROR', error: true, message: 'User is already verified' });
    }
    if (key !== user.verificationKey) {
        console.log("Invalid verification key");
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Invalid verification key' });
    }
    user.verified = true;

    await user.save().catch((err) => {
            console.log("Error verifying user: " + err);
            return res.status(200).json({ status: 'ERROR', error: true, message: 'Error verifying user' });
    });
    
    console.log("User verified successfully");
    return res.status(200).json({ status: 'OK' });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Missing required fields' });
    }
    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'User does not exist' });
    }
    if (!user.verified) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'User is not verified' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'Invalid credentials' });
    }
    req.session.isAuth = true;
    return res.status(200).json({ status: 'OK' });
});

router.post('/logout', (req, res) => {
    if (!req.session.isAuth) {
        return res.status(200).json({ status: 'ERROR', error: true, message: 'You are not logged in' });
    }
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.status(200).json({ status: 'OK' });
})

module.exports = router;
