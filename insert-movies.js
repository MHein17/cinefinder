// insert-movies.js — run once to load the trimmed IMDb dataset into Atlas
// same MongoClient + serverApi pattern as app.js / assignment4's app.js


const fs = require('fs');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const mongoUri = process.env.MONGO_URI;

async function run() {
    const client = new MongoClient(mongoUri, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });

    try {
        await client.connect();
        const db = client.db('apan5490');
        const collection = db.collection('movies');

        // wipe out anything currently in the collection so it only contains
        // one consistent shape of data (useful when re-seeding from scratch)
        const deleteResult = await collection.deleteMany({});
        console.log(`Cleared ${deleteResult.deletedCount} old documents`);

        const movies = JSON.parse(fs.readFileSync('movies_subset.json', 'utf-8'));
        // each movie document includes: id, title, year, era, runtime,
        // runtimeCategory, genres, rating, plot, cast, certificate,
        // countries, languages, poster
        const insertResult = await collection.insertMany(movies);
        console.log(`Inserted ${insertResult.insertedCount} movies`);

    } finally {
        await client.close();
    }
}

run().catch(console.error);