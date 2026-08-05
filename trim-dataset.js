// trim-dataset.js — reads movies_batch_1.json through movies_batch_20.json,
// strips out unused/bloated fields (trailer URLs, akas, company credits, etc.)
// and writes one combined, lightweight file: movies_subset.json

const fs = require('fs');
const path = require('path');

const BATCH_COUNT = 20; // how many batch files you downloaded
const inputDir = './raw_batches';
const outputPath = 'movies_subset.json';

function getEra(year) {
    if (!year) return null;
    if (year < 1960) return 'Pre-1960s';
    if (year < 1980) return '1960s-70s';
    if (year < 2000) return '1980s-90s';
    if (year < 2020) return '2000s-10s';
    return '2020+';
}

let results = [];

for (let i = 1; i <= BATCH_COUNT; i++) {
    const filePath = path.join(inputDir, `movies_batch_${i}.json`);

    if (!fs.existsSync(filePath)) {
        console.log(`Skipping missing file: ${filePath}`);
        continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const trimmed = raw.map(doc => {
        const castCredit = doc.principalCredits?.find(c => c.category?.id === 'cast');

        return {
            id: doc.id,
            title: doc.titleText?.text,
            year: doc.releaseYear?.year,
            era: getEra(doc.releaseYear?.year),
            runtime: doc.runtime ? Math.round(doc.runtime.seconds / 60) : null,
            genres: doc.genres?.genres?.map(g => g.text) || [],
            rating: doc.ratingsSummary?.aggregateRating ?? null,
            plot: doc.plot?.plotText?.plainText || '',
            cast: castCredit?.credits?.map(c => c.name?.nameText?.text) || [],
            certificate: doc.certificate?.rating || null,
            countries: doc.countriesOfOrigin?.countries?.map(c => c.text) || [],
            languages: doc.spokenLanguages?.spokenLanguages?.map(l => l.text) || [],
            poster: doc.primaryImage?.url || null
        };
    });

    results = results.concat(trimmed);
    console.log(`Processed batch ${i}, running total: ${results.length}`);
}

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`Done. Wrote ${results.length} trimmed movies to ${outputPath}`);