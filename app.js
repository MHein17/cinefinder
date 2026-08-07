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

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {

    try {
        if (req.url.startsWith('/moviequery')) {
            // supported query params:
            //   genre           - comma-separated, matches ANY selected genre (multi-select on Figma)
            //   certificate     - single value (PG, PG-13, R, NC-17, General)
            //   era             - single value
            //   language        - single value, matches if present in the languages array
            //   runtimeCategory - single value (Short, Standard, Long)
            //   minRating       - optional, not on current Figma screens but harmless to keep
            //   limit           - optional, defaults to 20, capped at 50
            const parsedUrl = new URL(req.url, 'http://localhost');
            const genreParam = parsedUrl.searchParams.get('genre');
            const certificate = parsedUrl.searchParams.get('certificate');
            const era = parsedUrl.searchParams.get('era');
            const language = parsedUrl.searchParams.get('language');
            const runtimeCategory = parsedUrl.searchParams.get('runtimeCategory');
            const minRating = parsedUrl.searchParams.get('minRating');
            const limitParam = parsedUrl.searchParams.get('limit');

            const filter = {};

            // genre supports multiple selections, e.g. ?genre=Action,Comedy
            // $in matches a movie if ANY of its genres appears in the selected list
            if (genreParam) {
                const genreList = genreParam.split(',').map(g => g.trim()).filter(Boolean);
                if (genreList.length > 0) filter.genres = { $in: genreList };
            }

            if (certificate) filter.certificate = certificate;
            if (era) filter.era = era;
            if (language) filter.languages = language; // matches if language is anywhere in the array
            if (runtimeCategory) filter.runtimeCategory = runtimeCategory;
            if (minRating) filter.rating = { $gte: Number(minRating) };

            // default 20 results, hard cap at 50 to avoid accidentally returning everything
            var limit = limitParam ? Number(limitParam) : 20;
            if (isNaN(limit) || limit <= 0) limit = 20;
            if (limit > 50) limit = 50;

            const client = await MongoClient.connect(mongoUri, {
                serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
            });
            const db = client.db('apan5490');
            const collection = db.collection('movies');

            const docs = await collection.find(filter).limit(limit).toArray();

            sendJson(res, 200, {
                count: docs.length,
                filters: { genre: genreParam, certificate, era, language, runtimeCategory, minRating, limit },
                results: docs
            });

            await client.close();

        } else {
            serveStaticFile(req, res);
        }
    } catch (err) {
        sendJson(res, 500, { error: 'Server error', message: String(err) });
    }
});

server.listen(8080, () => {
    console.log('Server is running at http://localhost:8080');
});