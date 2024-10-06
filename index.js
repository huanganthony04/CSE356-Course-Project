const express = require('express');
const path = require('path');
const session = require("express-session");
require('dotenv').config();

const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = 8080;

const mongoURI = 'mongodb://localhost:27017/CSE356';

//Set up connection to mongo client
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'));

const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'sessions'
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(express.json());
app.use((req, res, next) => {
    res.header('X-CSE356', '66d155ec7f77bf55c50044bf');
    next();
});

app.use('', userRoutes);
app.use('', videoRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
