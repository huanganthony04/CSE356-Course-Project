
const express = require('express');
const { MongoClient } = require('mongodb');
const userRoutes = require('./routes/userRoutes');


const app = express();

const PORT = 8080;

//Set up connection to mongo client
const uri = 'mongodb://localhost:27017';
const dbName = 'CSE356';

const client = new MongoClient(uri, {});

async function startServer() {
    try {
        await client.connect();
        console.log('Connected to Mongo');
    } catch (e) {
        console.error('Error connecting to Mongo', e);
    }
    app.use(express.json());

    app.use((req, res, next) => {
    res.header('X-CSE356', '66d155ec7f77bf55c50044bf');
    next();
    });

    const db = client.db(dbName);

    app.use('', userRoutes(db));

    app.listen(PORT);
    console.log(`Server is running on port ${PORT}`);
}

startServer();
