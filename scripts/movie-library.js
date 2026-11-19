const storageKey = 'movie-app.collection.v1';
const ratingsKey = 'movie-app.ratings.v1';
const genres = ['Action', 'Animation', 'Comedy', 'Documentary', 'Drama', 'Fantasy',
  'Horror', 'Romance', 'Sci-Fi', 'Thriller'];
const maxYear = new Date().getFullYear() + 1;

function validPoster(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function createMovie(values) {
  return {
    id: values.id,
    title: values.title,
    genre: values.genre,
    rating: values.rating === null || values.rating === undefined || values.rating === '' ? null : Number(values.rating),
    image: values.image,
    director: values.director,
    year: Number(values.year),
    duration: Number(values.duration),
    description: values.description
  };
}

function validate(movie, collection = []) {
  const { id, title, genre, rating, image, director, year, duration, description } = movie;
  const errors = {};
  if (!title || title.length > 120) errors.title = 'Enter a title of up to 120 characters.';
  else if (collection.find(item => item.id !== id && item.title.toLowerCase() === title.toLowerCase())) {
    errors.title = 'A movie with this title is already in your collection.';
  }
  if (!genres.includes(genre)) errors.genre = 'Choose a genre.';
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    errors.rating = 'The sample rating must be a whole number from 1 to 5.';
  }
  if (!validPoster(image) || image.length > 2000) errors.image = 'Enter a valid HTTPS poster URL.';
  if (!director || director.length > 120) errors.director = 'Enter a director of up to 120 characters.';
  if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
    errors.year = `Enter a whole year between 1900 and ${maxYear}.`;
  }
  if (!Number.isSafeInteger(duration) || duration < 1) errors.duration = 'Enter a whole number of minutes greater than zero.';
  if (!description || description.length > 1200) errors.description = 'Enter a description of up to 1,200 characters.';
  return errors;
}

function load(storage, fallback) {
  const stored = storage.getItem(storageKey);
  if (stored === null) return fallback.map(movie => createMovie(movie));
  const data = JSON.parse(stored);
  if (!Array.isArray(data)) throw new Error('Invalid movie data.');
  const movies = data.map(movie => createMovie(movie));
  const ids = new Set();
  for (const movie of movies) {
    const validText = ['title', 'genre', 'image', 'director', 'description']
      .every(key => typeof movie[key] === 'string');
    if (typeof movie.id !== 'string' || !movie.id || ids.has(movie.id) ||
        !validText || Object.keys(validate(movie)).length) {
      throw new Error('Invalid movie record.');
    }
    ids.add(movie.id);
  }
  return movies;
}

function save(storage, collection) {
  storage.setItem(storageKey, JSON.stringify(collection));
}

function loadRatings(storage, username = 'user') {
  const saved = storage.getItem(ratingsKey + '.' + username);
  const legacy = username === 'user' ? storage.getItem(ratingsKey) : null;
  const data = JSON.parse(saved ?? legacy ?? '{}');
  if (!data || Array.isArray(data) || typeof data !== 'object' ||
      Object.values(data).some(rating => !Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error('Invalid saved ratings.');
  }
  return data;
}

function saveRatings(storage, ratings, username = 'user') {
  storage.setItem(ratingsKey + '.' + username, JSON.stringify(ratings));
}

function search(collection, query, genre) {
  const term = query.trim().toLowerCase();
  return collection.filter(movie => {
    const textMatches = movie.title.toLowerCase().includes(term) || movie.director.toLowerCase().includes(term);
    return textMatches && (!genre || movie.genre === genre);
  });
}

function summarize(collection, ratings = {}) {
  const total = collection.length;
  const ratedMovies = collection.filter(movie => Object.hasOwn(ratings, movie.id));
  const ratingTotal = ratedMovies.reduce((sum, movie) => sum + ratings[movie.id], 0);
  const counts = collection.reduce((genresByCount, movie) => {
    genresByCount[movie.genre] = (genresByCount[movie.genre] ?? 0) + 1;
    return genresByCount;
  }, {});
  const rated = ratedMovies.length;
  return { total, rated, average: rated ? (ratingTotal / rated).toFixed(1) : null, counts };
}

const MovieLibrary = { createMovie, genres, maxYear, validate, validPoster, load, save, loadRatings, saveRatings, search, summarize };
