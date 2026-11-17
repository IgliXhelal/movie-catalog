const MovieLibrary = (() => {
  const storageKey = 'movie-app.collection.v1';
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

  class Movie {
    constructor({ id, title, genre, rating, image, director, year, duration, description }) {
      this.id = id;
      this.title = title;
      this.genre = genre;
      this.rating = Number(rating);
      this.image = image;
      this.director = director;
      this.year = Number(year);
      this.duration = Number(duration);
      this.description = description;
    }
  }

  function validate(movie, collection = []) {
    const { id, title, genre, rating, image, director, year, duration, description } = movie;
    const errors = {};
    if (!title || title.length > 120) errors.title = 'Enter a title of up to 120 characters.';
    else if (collection.find(item => item.id !== id && item.title.toLowerCase() === title.toLowerCase())) {
      errors.title = 'A movie with this title is already in your collection.';
    }
    if (!genres.includes(genre)) errors.genre = 'Choose a genre.';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choose a rating from 1 to 5.';
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
    if (stored === null) return fallback.map(movie => new Movie(movie));
    const data = JSON.parse(stored);
    if (!Array.isArray(data)) throw new Error('Invalid movie data.');
    const movies = data.map(movie => new Movie(movie));
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

  function search(collection, query, genre) {
    const term = query.trim().toLowerCase();
    return collection.filter(movie => {
      const textMatches = movie.title.toLowerCase().includes(term) || movie.director.toLowerCase().includes(term);
      return textMatches && (!genre || movie.genre === genre);
    });
  }

  function summarize(collection) {
    const total = collection.length;
    const ratings = collection.reduce((sum, movie) => sum + movie.rating, 0);
    const counts = collection.reduce((genresByCount, movie) => {
      genresByCount[movie.genre] = (genresByCount[movie.genre] ?? 0) + 1;
      return genresByCount;
    }, {});
    return { total, average: total ? (ratings / total).toFixed(1) : null, counts };
  }

  return { Movie, genres, maxYear, validate, validPoster, load, save, search, summarize };
})();
