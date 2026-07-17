# AGENTS.md — Portfolio Project Context

## Project Overview

This is **Alex Kim's personal portfolio website** — a statically exported Next.js application serving as a resume, blog, projects showcase, and contact page. Deployed to **GitHub Pages** at `https://alexa8596.github.io/portfolio`.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.x | Static export (`output: "export"`) |
| Language | TypeScript | ^5 | Strict mode enabled |
| UI | React | 19.x | |
| Styling | Tailwind CSS | v4 | CSS-first config (no `tailwind.config.ts`) |
| PostCSS | `@tailwindcss/postcss` | v4 | |
| Typography | `@tailwindcss/typography` | ^0.5.20 | Prose styling for blog content |
| Markdown | `remark` + `remark-html` | 15.x / 16.x | Blog content processing |
| Frontmatter | `gray-matter` | ^4.0.3 | YAML frontmatter parsing |
| Fonts | Geist Sans + Geist Mono | via `next/font/google` | |
| Linting | ESLint 9 | flat config | `eslint-config-next` |
| Deploy | GitHub Actions → GitHub Pages | | `actions/deploy-pages@v4` |

---

## Directory Structure

```
portfolio/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Navbar, ThemeProvider, fonts, dark mode script)
│   ├── page.tsx                  # Home page (Introduction + Timeline)
│   ├── globals.css               # Tailwind v4 config, dark mode variant, custom CSS
│   ├── favicon.ico
│   ├── blog/
│   │   ├── page.tsx              # Blog listing with sidebar (categories + tags)
│   │   └── [...slug]/page.tsx    # Individual blog post (catch-all route)
│   ├── builder/page.tsx          # Interactive resume builder (client, localStorage)
│   ├── contact/page.tsx          # Contact page with email/social links
│   ├── projects/page.tsx         # Projects grid filtered from resume.json
│   └── resume/print/page.tsx     # Print-friendly resume view
├── components/
│   ├── Introduction.tsx          # Hero section (server component)
│   ├── Navbar.tsx                # Fixed nav with theme toggle (client component)
│   ├── ThemeProvider.tsx          # Dark/light theme context (client component)
│   └── Timeline.tsx              # Interactive scrolling timeline (client component)
├── content/
│   └── blog/                     # Blog posts as .md files with YAML frontmatter
│       ├── career/
│       ├── design/
│       ├── web-building/
│       └── web-development/
├── data/
│   └── resume.json               # Central data source for all resume/profile data
├── lib/
│   └── blog.ts                   # Blog utilities (filesystem reads, frontmatter, HTML rendering)
├── public/                       # Static assets (SVGs)
└── .github/workflows/nextjs.yml  # CI/CD: build + deploy to GitHub Pages
```

---

## Routes

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/` | `app/page.tsx` | Server | Home: hero intro + interactive timeline |
| `/projects` | `app/projects/page.tsx` | Server | Project cards from resume.json |
| `/blog` | `app/blog/page.tsx` | Server | Blog listing with category/tag sidebar |
| `/blog/[...slug]` | `app/blog/[...slug]/page.tsx` | Server (async) | Individual blog post; uses `generateStaticParams` |
| `/contact` | `app/contact/page.tsx` | Server | Email, location, social links |
| `/builder` | `app/builder/page.tsx` | Client | Resume builder with localStorage persistence |
| `/resume/print` | `app/resume/print/page.tsx` | Client | Print-optimized resume view |

---

## Data Architecture

### Single Source of Truth: `data/resume.json`

All resume/profile data flows from this file. It contains:

```json
{
  "profile": { "name", "title", "email", "location", "summary" },
  "items": [
    {
      "id": "unique-id",
      "category": "education | employment | project | certification",
      "title": "...",
      "organization": "...",
      "location": "...",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM | present",
      "description": "...",
      "highlights": ["..."]
    }
  ],
  "skills": ["skill1", "skill2", ...]
}
```

**Consumers**: Home page, Introduction, Timeline, Projects, Contact, Builder, Print resume.

### Blog Content: `content/blog/**/*.md`

Markdown files with YAML frontmatter:

```yaml
---
title: "Post Title"
description: "Brief description"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
---
```

The **category** is determined by the directory path relative to `content/blog/` (e.g., `design/frontend`). Supports any nesting depth.

---

## Styling

### Tailwind CSS v4 (CSS-first)

No `tailwind.config.ts` exists. All configuration is in `app/globals.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@variant dark (&:where(.dark, .dark *));
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Dark Mode

- **Mechanism**: Class-based (`.dark` on `<html>`)
- **Default**: Dark
- **Flash prevention**: Inline `<script>` in `layout.tsx` reads `localStorage` before hydration
- **Persistence**: `ThemeProvider` saves to `localStorage`
- **Toggle**: Sun/moon button in Navbar

### Design Tokens

- **Color palette**: Zinc (zinc-50/950 backgrounds, zinc-900/100 text)
- **Category colors**: Blue (education), Green (employment), Purple (project), Orange (certification)
- **Glassmorphism**: Navbar and filter bars use `backdrop-blur-md` with semi-transparent backgrounds
- **Gradient text**: Name uses `bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent`

---

## Component Patterns

### Client vs Server

- **Server** (default): `Introduction.tsx`, `app/page.tsx`, `app/blog/page.tsx`, `app/projects/page.tsx`, `app/contact/page.tsx`, `app/blog/[...slug]/page.tsx`
- **Client** (`"use client"`): `Navbar.tsx`, `ThemeProvider.tsx`, `Timeline.tsx`, `app/builder/page.tsx`, `app/resume/print/page.tsx`

**Rule**: Use `"use client"` only when the component needs `useState`, `useEffect`, `useContext`, `usePathname`, browser APIs, or event handlers.

### Export Patterns

- Pages: `export default function PageName()`
- Layout: `export const metadata` (named) + `export default function RootLayout()`
- Blog static gen: `export async function generateStaticParams()` + `export async function generateMetadata()`
- Library functions: Named exports (`export function getAllPosts()`)

### Key Component Details

#### `Timeline.tsx` (most complex)

- Uses `position: sticky` for scroll-pinned sections
- SVG connection lines drawn via `requestAnimationFrame` loop
- Dynamic font sizing to fit content in sticky containers
- Category filtering, condensed mode toggle, scroll progress bar
- Continuity map tracks which items persist across time intervals
- Item positions measured via refs + `getBoundingClientRect()`

#### `ThemeProvider.tsx`

- React Context pattern with `ThemeContext`
- Exports `useTheme()` hook (throws if used outside provider)
- Uses `mounted` state to avoid hydration mismatch

#### `Navbar.tsx`

- Active link detection via `usePathname()`
- Fixed position with glassmorphism effect
- Responsive: no mobile menu (simple horizontal layout)

---

## Blog System

### File Structure

Posts live in `content/blog/` with **arbitrary nesting depth**:

```
content/blog/
  career/post.md                    → slug: career/post
  design/frontend/post.md           → slug: design/frontend/post
  design/frameworks/react/post.md   → slug: design/frameworks/react/post
```

### Slug Format

Slugs include the full path relative to `content/blog/` (without `.md` extension). The route uses Next.js catch-all `[...slug]` to handle nested paths.

### URL Structure

URLs mirror the filesystem: `/blog/career/post`, `/blog/design/frontend/post`.

### Category Derivation

Categories are derived from the directory path (not frontmatter). `getAllCategories()` returns all ancestor categories (e.g., both `design` and `design/frontend`).

### Key Functions (`lib/blog.ts`)

| Function | Returns | Notes |
|----------|---------|-------|
| `getAllPostSlugs()` | `string[]` | All slugs (path-based, e.g., `"career/post"`) |
| `getAllPosts()` | `BlogPostMeta[]` | All posts sorted by date descending |
| `getPostBySlug(slug)` | `BlogPost \| null` | Single post with HTML content |
| `getAllCategories()` | `string[]` | All unique category paths (including ancestors) |
| `getPostsByCategory(cat)` | `BlogPostMeta[]` | Matches category or subcategories |
| `getPostsByTag(tag)` | `BlogPostMeta[]` | Matches tag |
| `getAllTags()` | `string[]` | All unique tags |

---

## Build & Deploy

### Static Export

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  basePath: process.env.NODE_ENV === 'production' ? '/portfolio' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/portfolio/' : '',
};
```

### NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Development server |
| `build` | `next build` | Static build → `out/` |
| `start` | `next start` | Production server |
| `lint` | `eslint` | Run ESLint |

### CI/CD

- **Trigger**: Push to `main` or manual dispatch
- **Runner**: Ubuntu latest, Node 20
- **Steps**: Install → Build → Upload `out/` → Deploy via `actions/deploy-pages@v4`
- **Caching**: `.next/cache` between builds

### Environment Variables

Only `process.env.NODE_ENV` is used (auto-set by Next.js). No `.env` files exist.

---

## Type Definitions

### `ResumeItem` (defined inline in Timeline.tsx)

```typescript
type ResumeItem = {
  id: string;
  category: string;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
};
```

### `BlogPost` / `BlogPostMeta` (defined in `lib/blog.ts`)

```typescript
interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
}

interface BlogPost extends BlogPostMeta {
  contentHtml: string;
}
```

**Note**: TypeScript types for resume data are duplicated across files (Introduction.tsx, Timeline.tsx, builder/page.tsx) rather than shared from a central types file. When modifying resume data shapes, update all consumers.

---

## Conventions

### Naming

- **Files**: PascalCase for components (`Timeline.tsx`), kebab-case for utilities (`blog.ts`), lowercase for data (`resume.json`)
- **Directories**: All lowercase (`app/`, `components/`, `content/`, `data/`, `lib/`)
- **Interfaces**: PascalCase (`BlogPost`, `ResumeItem`)
- **Functions**: camelCase (`getAllPosts`, `formatDateRange`)

### Code Style

- No comments unless asked for
- Tailwind utility classes for all styling (no CSS modules, no styled-components)
- Prefer existing patterns and libraries already in the project
- Follow existing import order: React → Next.js → third-party → local (`@/`)

### Path Alias

`@/*` maps to the project root. Use `@/components/...`, `@/lib/...`, `@/data/...`.

---

## Known Technical Debt

1. **Duplicated types**: `ResumeItem` type is defined inline in multiple files instead of a shared types file
2. **Dead code**: `app/builder/page.tsx` has a `fetch("/api/resume")` call but no API route exists
3. **No tests**: No test files, test frameworks, or test scripts exist
4. **No `loading.tsx` or `error.tsx`**: Uses Next.js defaults for loading/error states
5. **Static site limitations**: Blog content is processed at build time; new posts require a rebuild

---

## Key Files Reference

| File | Path | Why It Matters |
|------|------|----------------|
| Resume data | `data/resume.json` | Central data source — changes here affect most pages |
| Blog logic | `lib/blog.ts` | All blog filesystem operations and content processing |
| Timeline | `components/Timeline.tsx` | Most complex component; sticky sections, SVG connections, filtering |
| Global styles | `app/globals.css` | Tailwind v4 config, dark mode, custom CSS |
| Root layout | `app/layout.tsx` | Font loading, dark mode script, Navbar + ThemeProvider wrapping |
| Next config | `next.config.ts` | Static export, basePath for GitHub Pages |
| CI/CD | `.github/workflows/nextjs.yml` | Build and deploy pipeline |
