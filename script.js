// same async/await + fetch pattern as the professor's toggleDetails functions,
// but sending genre/mood as query params instead of a fixed route

var findMovieBtn = document.getElementById('findMovieBtn');
var result = document.getElementById('result');

findMovieBtn.addEventListener('click', async function() {
    var genre = document.getElementById('genre').value;
    var mood = document.getElementById('mood').value;

    var response = await fetch('/moviequery?genre=' + genre + '&mood=' + mood);
    var html = await response.text();
    result.innerHTML = html;
});