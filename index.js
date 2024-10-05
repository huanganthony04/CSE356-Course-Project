
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

const PORT = 8080;

//Set up connection to mongo client
const uri = 'mongodb://localhost:27017';
const dbName = 'CSE356';

const client = new MongoClient(uri, {});

async function connectToMongo() {
    try {
        await client.connect();
        console.log('Connected to Mongo');
    } catch (e) {
        console.error('Error connecting to Mongo', e);
    }
}
connectToMongo();


app.use(express.json());

app.use((req, res, next) => {
    res.header('X-CSE356', '66d155ec7f77bf55c50044bf');
    next();
});

app.post('/adduser', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'Missing required fields' });
    }
    //Get the Users collection
    const Users = client.db(dbName).collection('Users');
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
        const result = await Users.insertOne({ username, password: hash, email });
        return res.status(200).json({ status: 'error', error: 'false', message: 'User inserted Successfully' });
    } catch (e) {
        return res.status(200).json({ status: 'error', error: 'true', message: 'Error inserting user' });
    }

});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});


app.listen(PORT);
console.log(`Server is running on port ${PORT}`);
