const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
})

client.on('connect', () => {
    console.log('Connected to Redis');
});

async function main() {
    try {
        await client.connect();

        await client.subscribe('api-queue', (request) => {
            let info = JSON.parse(request);
            console.log(info);
        })
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();