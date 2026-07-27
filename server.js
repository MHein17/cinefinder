const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);
let moviesCollection;

client.connect().then(() => {
    const db = client.db('movieNightPicker');
    moviesCollection = db.collection('movies');
    console.log('Connected to MongoDB');
});

app.get('/api/movies', async (req, res) => {
    const { genre, mood, maxRuntime } = req.query;
    const filter = {};
    if (genre) filter.genre = genre;
    if (mood) filter.mood = mood;
    if (maxRuntime) filter.runtime = { $lte: Number(maxRuntime) };

    const movies = await moviesCollection.find(filter).toArray();
    res.json(movies);
});

app.listen(3000, () => console.log('Server running on port 3000'));