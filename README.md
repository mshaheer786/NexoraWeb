# NexoraWeb

A modern digital agency landing page for NexoraWeb, built with static HTML, CSS, and JavaScript.

## Features

- Responsive mobile-first design
- AI chatbot widget with keyword-based responses
- Accessible navigation, FAQ accordion, and keyboard support
- Contact form integration with FormSubmit.co
- Smooth scroll interactions and reveal animations
- SEO enhancements including structured data, sitemap, and robots.txt
- GitHub Pages deployment support via workflow

## Files

- `index.html` — Landing page content and structure
- `style.css` — Styling, responsive layout, and visual system
- `script.js` — Site interactivity, form validation, chatbot logic, FAQ accordion, and cookie consent
- `sitemap.xml` — Sitemap for search engines
- `robots.txt` — Crawler rules and sitemap path
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

## Deploying

This repository can be published to GitHub Pages automatically when changes are pushed to `main`.

### How it works

The workflow defined in `.github/workflows/pages.yml` deploys the repository root to the `gh-pages` branch using `peaceiris/actions-gh-pages`.

### Manual setup

1. Ensure the branch name is `main`.
2. Push changes to GitHub.
3. Enable GitHub Pages for the repository in GitHub settings:
   - Settings → Pages
   - Source: `gh-pages` branch
   - Folder: `/ (root)`

## Local preview

You can preview the website locally by opening `index.html` in your browser.

## Notes

- The site is designed for static hosting.
- The contact form uses FormSubmit.co for email submissions.
- Update the `og:image` and `logo` URLs in `index.html` when using a real domain.
