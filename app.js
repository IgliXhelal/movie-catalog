const byId = id => document.getElementById(id);
const grid = byId('movie-grid');
const search = byId('search');
const genreFilter = byId('genre-filter');
const form = byId('movie-form');
const editor = byId('movie-editor');
const details = byId('movie-details');
const deleteDialog = byId('delete-dialog');
const fieldNames = ['title', 'director', 'genre', 'year', 'duration', 'image', 'description'];
let collection;
let userRatings = {};
let adminSignedIn = false;
let editingId;
let deletingId;
let searchTimer;
let toastTimer;

try {
  collection = MovieLibrary.load(window.localStorage, starterMovies);
} catch {
  collection = starterMovies.map(movie => new MovieLibrary.Movie(movie));
  showMessage('storage-status', 'Saved movies could not be loaded. The starter collection is shown.');
}

try {
  userRatings = MovieLibrary.loadRatings(window.localStorage);
} catch {
  showMessage('ratings-status', 'Saved ratings could not be loaded. You can try rating a movie again.');
}

for (const genre of MovieLibrary.genres) {
  genreFilter.add(new Option(genre, genre));
  byId('genre').add(new Option(genre, genre));
}
byId('year').max = MovieLibrary.maxYear;

function showMessage(id, message) {
  const element = byId(id);
  element.textContent = message;
  element.hidden = !message;
}

function notify(message) {
  clearTimeout(toastTimer);
  showMessage('toast', message);
  toastTimer = setTimeout(() => showMessage('toast', ''), 3200);
}

function paintPoster(image, movie, decorative = false) {
  if (image.getAttribute('src') !== movie.image) image.classList.remove('unavailable');
  image.alt = decorative ? '' : movie.title + ' poster';
  image.referrerPolicy = 'no-referrer';
  if (MovieLibrary.validPoster(movie.image)) image.src = movie.image;
  else image.classList.add('unavailable');
}

function renderFeatured() {
  const movie = collection.find(item => item.title === 'The Dark Knight') ?? collection[0];
  byId('featured-label').hidden = !movie;
  byId('featured-details').hidden = !movie;
  byId('hero-art').hidden = !movie;
  byId('hero-title').textContent = movie?.title ?? 'Movie catalog';
  byId('hero-meta').textContent = movie ? `${movie.year} · ${movie.genre} · ${movie.duration} min` : '';
  byId('hero-description').textContent = movie?.description ?? 'There are no movies in the catalog yet.';
  if (movie) {
    byId('featured-details').dataset.id = movie.id;
    paintPoster(byId('featured-poster'), movie, true);
  }
}

function movieCard(movie) {
  const card = byId('movie-card').content.cloneNode(true);
  paintPoster(card.querySelector('img'), movie, true);
  const rating = userRatings[movie.id];
  card.querySelector('.rating').textContent = rating ? `Your ★ ${rating}/5` :
    (movie.rating ? `Sample ★ ${movie.rating}/5` : 'Not rated');
  card.querySelector('.card-meta').textContent = `${movie.genre} · ${movie.year} · ${movie.duration} min`;
  card.querySelector('h3').textContent = movie.title;
  const button = card.querySelector('button');
  button.dataset.id = movie.id;
  button.setAttribute('aria-label', `View details for ${movie.title}`);
  const ratingSelect = card.querySelector('[data-rating]');
  ratingSelect.id = 'rate-' + movie.id;
  ratingSelect.dataset.id = movie.id;
  ratingSelect.value = rating ?? '';
  ratingSelect.setAttribute('aria-label', `Your rating for ${movie.title}`);
  card.querySelector('.card-rating label').htmlFor = ratingSelect.id;
  return card;
}

function renderCatalog() {
  const movies = MovieLibrary.search(collection, search.value, genreFilter.value);
  grid.replaceChildren(...movies.map(movieCard));
  byId('result-count').textContent = `${movies.length} ${movies.length === 1 ? 'movie' : 'movies'}`;
  byId('catalog-empty').hidden = movies.length > 0;
}

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function actionButton(action, movie) {
  const label = action === 'edit' ? 'Edit' : 'Delete';
  const button = textElement('button', label, 'button small ' + (action === 'edit' ? 'secondary' : 'danger'));
  button.type = 'button';
  button.dataset.action = action;
  button.dataset.id = movie.id;
  button.setAttribute('aria-label', `${label} ${movie.title}`);
  return button;
}

function movieRow(movie) {
  const row = document.createElement('tr');
  const title = textElement('th', movie.title);
  title.scope = 'row';
  row.append(title);
  const rating = userRatings[movie.id];
  const values = [movie.genre, rating ? `${rating}/5` : 'Not rated', movie.year, movie.director, `${movie.duration} min`];
  row.append(...values.map(value => textElement('td', value)));
  const actions = textElement('td', '', 'row-actions');
  actions.append(actionButton('edit', movie), actionButton('delete', movie));
  row.append(actions);
  return row;
}

function renderManage() {
  const { total, rated, average, counts } = MovieLibrary.summarize(collection, userRatings);
  byId('total-movies').textContent = total;
  byId('average-rating').textContent = average === null ? '—' : `${average}/5`;
  byId('rated-count').textContent = `${rated} of ${total} movies rated`;
  const items = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))
    .map(([genre, count]) => textElement('li', `${genre} ${count}`));
  byId('genre-counts').replaceChildren(...items);
  byId('manage-rows').replaceChildren(...collection.map(movieRow));
  byId('manage-empty').hidden = total > 0;
}

function render() {
  const adminRoute = location.hash === '#admin' || location.hash === '#manage';
  byId('catalog').hidden = adminRoute;
  byId('manage').hidden = !adminRoute || !adminSignedIn;
  byId('admin-login').hidden = !adminRoute || adminSignedIn;
  byId('admin-logout').hidden = !adminSignedIn;
  document.querySelectorAll('[data-admin]').forEach(element => {
    element.hidden = !adminSignedIn;
  });
  document.querySelectorAll('nav a').forEach(link => {
    const active = link.hash === (adminRoute ? '#admin' : '#catalog');
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (adminRoute && adminSignedIn) renderManage();
  if (!adminRoute) {
    renderFeatured();
    renderCatalog();
  }
}

function updateCollection(next) {
  if (!adminSignedIn) return false;
  try {
    MovieLibrary.save(window.localStorage, next);
    collection = next;
    showMessage('storage-status', '');
    return true;
  } catch {
    return false;
  }
}

function openDetails(movie) {
  byId('details-title').textContent = movie.title;
  byId('details-description').textContent = movie.description;
  paintPoster(byId('details-poster'), movie);
  const facts = {
    Genre: movie.genre, 'Sample rating': movie.rating ? `${movie.rating}/5` : 'Not available', Director: movie.director,
    'Release year': movie.year, Duration: `${movie.duration} min`
  };
  byId('details-facts').replaceChildren(...Object.entries(facts).map(([label, value]) => {
    const group = document.createElement('div');
    group.append(textElement('dt', label), textElement('dd', value));
    return group;
  }));
  byId('details-edit').dataset.id = movie.id;
  byId('details-delete').dataset.id = movie.id;
  byId('details-rating').dataset.id = movie.id;
  byId('details-rating').value = userRatings[movie.id] ?? '';
  byId('details-rating').setAttribute('aria-label', `Your rating for ${movie.title}`);
  details.querySelector('[data-admin]').hidden = !adminSignedIn;
  details.showModal();
}

function showFieldError(name, error) {
  showMessage(name + '-error', error ?? '');
  if (error) byId(name).setAttribute('aria-invalid', 'true');
  else byId(name).removeAttribute('aria-invalid');
}

function formMovie() {
  const values = Object.fromEntries(fieldNames.map(name => [name, byId(name).value.trim()]));
  const original = collection.find(movie => movie.id === editingId);
  return new MovieLibrary.Movie({ id: editingId, rating: original?.rating ?? null, ...values });
}

function openEditor(movie) {
  if (!adminSignedIn) return;
  editingId = movie?.id;
  form.reset();
  fieldNames.forEach(name => {
    if (movie) byId(name).value = movie[name];
    showFieldError(name, '');
  });
  showMessage('form-status', '');
  byId('editor-title').textContent = movie ? 'Edit movie' : 'Add movie';
  byId('save-movie').textContent = movie ? 'Save changes' : 'Add movie';
  if (details.open) details.close();
  editor.showModal();
}

function openDelete(movie) {
  if (!adminSignedIn) return;
  deletingId = movie.id;
  showMessage('delete-message', `Remove “${movie.title}” from this browser's collection?`);
  showMessage('delete-status', '');
  if (details.open) details.close();
  deleteDialog.showModal();
}

function deleteMovie() {
  if (!adminSignedIn) return;
  const remaining = collection.filter(movie => movie.id !== deletingId);
  if (!updateCollection(remaining)) {
    showMessage('delete-status', 'The movie could not be deleted. Check that browser storage is available.');
    return;
  }
  deleteDialog.close();
  render();
  notify('Movie deleted.');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!adminSignedIn) return;
  const movie = formMovie();
  const errors = MovieLibrary.validate(movie, collection);
  fieldNames.forEach(name => showFieldError(name, errors[name]));
  const firstError = fieldNames.find(name => errors[name]);
  if (firstError) {
    byId(firstError).focus();
    return;
  }
  movie.id ??= crypto.randomUUID?.() ?? ('movie-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const next = editingId ? collection.map(item => item.id === editingId ? movie : item) : [...collection, movie];
  if (!updateCollection(next)) {
    showMessage('form-status', 'The movie could not be saved. Check that browser storage is available.');
    return;
  }
  editor.close();
  render();
  notify(editingId ? 'Changes saved.' : 'Movie added.');
});

function updateFieldError(event) {
  const { name } = event.target;
  if (event.target.hasAttribute('aria-invalid') && fieldNames.includes(name)) {
    showFieldError(name, MovieLibrary.validate(formMovie(), collection)[name]);
  }
}

form.addEventListener('input', updateFieldError);
form.addEventListener('change', updateFieldError);

function saveVisitorRating(select) {
  const id = select.dataset.id;
  if (!collection.find(movie => movie.id === id)) return;
  const next = { ...userRatings };
  if (select.value === '') delete next[id];
  else {
    const rating = Number(select.value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    next[id] = rating;
  }
  try {
    MovieLibrary.saveRatings(window.localStorage, next);
    userRatings = next;
    showMessage('ratings-status', '');
  } catch {
    select.value = userRatings[id] ?? '';
    showMessage('ratings-status', 'Your rating could not be saved. Check that browser storage is available.');
    return;
  }
  document.querySelectorAll('[data-rating]').forEach(control => {
    if (control.dataset.id === id) control.value = userRatings[id] ?? '';
  });
  if (location.hash === '#admin' || location.hash === '#manage') renderManage();
  else {
    renderCatalog();
    if (!details.open) byId('rate-' + id)?.focus();
  }
  notify(select.value ? 'Your rating was saved.' : 'Your rating was removed.');
}

document.addEventListener('change', event => {
  if (event.target.matches('select[data-rating]')) saveVisitorRating(event.target);
});

byId('admin-login-form').addEventListener('submit', event => {
  event.preventDefault();
  const username = byId('admin-username').value.trim();
  const password = byId('admin-password').value;
  const errors = {
    username: username ? '' : 'Enter the demo username.',
    password: password ? '' : 'Enter the demo password.'
  };
  for (const name of ['username', 'password']) {
    showMessage(name + '-error', errors[name]);
    const input = byId('admin-' + name);
    if (errors[name]) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  showMessage('login-error', '');
  if (errors.username || errors.password) {
    byId(errors.username ? 'admin-username' : 'admin-password').focus();
    return;
  }
  if (username !== 'admin' || password !== 'movie123') {
    showMessage('login-error', 'The demo username or password is incorrect.');
    return;
  }
  adminSignedIn = true;
  byId('admin-login-form').reset();
  render();
  byId('manage-title').tabIndex = -1;
  byId('manage-title').focus();
});

byId('admin-login-form').addEventListener('input', event => {
  const { name } = event.target;
  if (name !== 'username' && name !== 'password') return;
  showMessage('login-error', '');
  showMessage(name + '-error', '');
  event.target.removeAttribute('aria-invalid');
});

byId('admin-logout').addEventListener('click', () => {
  adminSignedIn = false;
  [details, editor, deleteDialog].forEach(dialog => {
    if (dialog.open) dialog.close();
  });
  location.hash = '#catalog';
  render();
  notify('Signed out.');
});

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const movie = collection.find(item => item.id === id);
  if (action === 'add') openEditor();
  if (action === 'details' && movie) openDetails(movie);
  if (action === 'edit' && movie) openEditor(movie);
  if (action === 'delete' && movie) openDelete(movie);
  if (action === 'confirm-delete') deleteMovie();
  if (action === 'close') button.closest('dialog').close();
});

document.addEventListener('error', event => {
  if (event.target.matches?.('.poster img')) event.target.classList.add('unavailable');
}, true);

search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderCatalog, 180);
});
genreFilter.addEventListener('change', renderCatalog);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = byId('main');
  main.focus();
  main.scrollIntoView();
});
window.addEventListener('hashchange', render);
render();
