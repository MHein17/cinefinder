// same pattern as backend.js from the professor's lecture with http.createServer,
// req.url routing, MongoClient.connect per request, res.writeHead/res.end

// server also serves the static files itself (index.html, script.js, styles.css)
// so everything runs on one origin

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

const mongoUri = process.env.MONGO_URI;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
};

function serveStaticFile(req, res) {
    var filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    var ext = path.extname(filePath);
    var contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, function(err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

const server = http.createServer(async (req, res) => {

    try {
        if (req.url.startsWith('/moviequery')) {
            // supported query params: genre, era, minRating, runtimeCategory
            const parsedUrl = new URL(req.url, 'http://localhost');
            const genre = parsedUrl.searchParams.get('genre');
            const era = parsedUrl.searchParams.get('era');
            const minRating = parsedUrl.searchParams.get('minRating');
            const runtimeCategory = parsedUrl.searchParams.get('runtimeCategory');

            const filter = {};
            if (genre) filter.genres = genre;
            if (era) filter.era = era;
            if (minRating) filter.rating = { $gte: Number(minRating) };
            if (runtimeCategory) filter.runtimeCategory = runtimeCategory;

            const client = await MongoClient.connect(mongoUri, {
                serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
            });
            const db = client.db('apan5490');
            const collection = db.collection('movies');

            const docs = await collection.find(filter).limit(10).toArray();

            if (docs.length > 0) {
                var html = docs.map(function(doc) {
                    var ratingDisplay = doc.rating !== null ? doc.rating : 'Not yet rated';
                    return '<h3>' + doc.title + ' (' + doc.year + ')</h3>' +
                        '<p>' + doc.plot + '</p>' +
                        '<p><strong>Genres:</strong> ' + doc.genres.join(', ') + '</p>' +
                        '<p><strong>Rating:</strong> ' + ratingDisplay +
                        ' | <strong>Runtime:</strong> ' + doc.runtime + ' min (' + doc.runtimeCategory + ')</p>';
                }).join('<hr>');

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<p>No matches found. Try different filters.</p>');
            }

            await client.close();

        } else {
            serveStaticFile(req, res);
        }
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error: ' + err);
    }
});

server.listen(8080, () => {
    console.log('Server is running at http://localhost:8080');
});