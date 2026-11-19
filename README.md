# Movie Catalog

Browse movies, rate films, and manage the catalog with HTML, CSS and JavaScript.

[Live website](https://igli-movie-catalog.pages.dev/)

## Sign in

Click **Sign in** in the top right. The shared dialog says “Sign in to access your collection.”

| Demo account | Username | Password | Access |
| --- | --- | --- | --- |
| User | user | user123 | Browse, rate movies, view personal rated collection |
| Admin | admin | movie123 | User features plus add, edit and delete movies |

These are demonstration accounts for a static coursework app. Credentials and role checks are visible in the JavaScript, so this is not secure authentication. Real accounts need a backend that verifies credentials and permissions. Sign-in lasts until reload or sign-out. Movie edits and separate account ratings are stored in this browser; they do not sync across devices. Existing visitor ratings migrate to the user demo account when it first signs in.

## Code structure

The project uses plain JavaScript with separate script and style folders:

- `index.html`: semantic HTML, catalog, management table and dialogs.
- `styles/site.css`: shared CSS for the existing design and sign-in window.
- `scripts/index.js`: a DOMContentLoaded handler, named functions, DOM references and event listeners.
- `scripts/movie-library.js`: plain functions and objects for validation, filtering, statistics and JSON/localStorage.
- `scripts/movies.js`: starter movie objects.

No React, build tools or package installation is required. 

## Run locally

Open this folder in VS Code. Right-click `index.html` and choose **Open with Live Server**.

## Publish

Upload the contents of this folder to the existing Cloudflare Pages project, or push them to its connected repository. The output folder is the folder containing `index.html`; there is no build command.
