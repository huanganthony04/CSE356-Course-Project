const express = require('express');
const bcrypt = require('bcrypt');

module.exports =  function userRoutes(db) {

    const router = express.Router();
    const Users = db.collection('Users');

    router.post('/adduser', async (req, res) => {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(200).json({ status: 'error', error: 'true', message: 'Missing required fields' });
        }
        //Check if the username already exists
        const existingUser = await Users.findOne({ 
            $or: [ 
                {username: username}, 
                {email: email}
            ]
        });
        if (existingUser) {
            return res.status(200).json({ status: 'error', error: 'true', message: 'User already exists' });
        }

        //Hash the password
        const hash = await bcrypt.hash(password, 10);
        //Insert the user
        try {
            const result = await Users.insertOne({ username, password: hash, email, verified: false });
            return res.status(200).json({ status: 'error', error: 'false', message: 'User inserted Successfully' });
        } catch (e) {
            return res.status(200).json({ status: 'error', error: 'true', message: 'Error inserting user' });
        }
    });

    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(200).json({ status: 'error', error: 'true', message: 'Missing required fields' });
        }
        const user = await Users.findOne({ username });
        if (!user) {
            return res.status(200).json({ status: 'error', error: 'true', message: 'User does not exist' });
        }
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(200).json({ status: 'error', error: 'true', message: 'Invalid password' });
        }
        return res.status(200).json({ status: 'error', error: 'false', message: 'Login Successful' });
    });

    return router;
}