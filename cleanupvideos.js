const { Queue } = require('bullmq');
const IORedis = require('ioredis')

require('dotenv').config();

const mongoose = require('mongoose');

const connection = new IORedis({
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD
});
const queue = new Queue('videoQueue',{connection});

async function cleanup() {
    await queue.drain();
}

try {
    cleanup();
}
catch (err) {
    console.log('Error cleaning up: ' + err);
}

async function main() {
    await cleanup();
    process.exit(0);
}

main();