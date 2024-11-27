const express = require('express');
const path = require('path');
const session = require("express-session");
const cors = require('cors');

require('dotenv').config();

const mongoURI = process.env.MONGOURIREPL;
console.log(mongoURI);

const morgan = require('morgan');

const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = 8080;

console.log('Starting server');

//Set up connection to mongo client
mongoose.connect(mongoURI, { readPreference: 'primaryPreferred' })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => { 
        console.log(err);
        process.exit(1);
    });

const store = new MongoDBSession(
    {
        uri: mongoURI,
        collection: 'sessions',
    }
);

store.on('error', (err) => {
    console.log(err);
    process.exit(1);
});

//Added for communication with frontend through axios
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

app.use(morgan('dev'));


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
