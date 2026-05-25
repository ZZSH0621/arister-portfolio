# Personal Portfolio Website

Bilingual (Chinese/English) personal website built with pure HTML/CSS/JS. No frameworks, no build tools.

## Quick Start

Open `index.html` in any modern browser. No server required.

## Features

- Bilingual toggle (中文 / English) with localStorage persistence
- WebGL image mask distortion effect (1:1 replication of aristidebenoist.com technique)
- Stack-to-content portfolio layout with FLIP animations
- Custom cursor with lerp trailing
- Keyboard navigation (arrow keys, Enter, Escape)
- Scroll reveal animations via Intersection Observer
- Responsive design (mobile to ultrawide)
- Independent blog page with markdown rendering

## Project Structure

```
├── index.html              # Main page
├── blog.html               # Blog page
├── css/                    # Stylesheets (13 files)
├── js/
│   ├── core/               # i18n, theme, utils
│   └── components/         # UI components
├── data/                   # Content (edit these to update site)
│   ├── site-config.js      # Site metadata & social links
│   ├── translations.js     # All UI text (both languages)
│   ├── projects.js         # Portfolio projects
│   └── blog-posts.js       # Blog posts
└── assets/
    ├── images/             # Images (WebP or PNG)
    └── fonts/              # Self-hosted fonts (WOFF2)
```

## How to Edit

### Update your name & info
Edit `data/site-config.js` — change siteName, email, social links.

### Add/change text
Edit `data/translations.js` — all visible text in both languages.

### Add a project
Edit `data/projects.js` — add a new object to the array:
```js
{
  id:"proj-7", slug:"my-project",
  title:{"zh-CN":"项目名","en":"Project Name"},
  category:{"zh-CN":"分类","en":"Category"},
  year:2026,
  themeColor:"#ff5e2c",
  thumbnail:"assets/images/projects/proj7-thumb.png",
  images:["assets/images/projects/proj7-1.png","assets/images/projects/proj7-2.png"],
  description:{"zh-CN":"描述...","en":"Description..."},
  technologies:["HTML","CSS","JS"],
  links:{live:"https://...",github:"https://..."}
}
```

### Add a blog post
Edit `data/blog-posts.js` — add a new object with title, date, excerpt, and body in both languages. Body supports Markdown (## headings, **bold**, `code`, - lists).

## Tech Stack

- Pure HTML5, CSS3, JavaScript (ES5+)
- Three.js (CDN) for WebGL effects
- No npm, no webpack, no frameworks
- JSON-driven content via script tags
