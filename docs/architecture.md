# Architecture Decisions

## Stack

- **Framework**: Astro (static-first, content-oriented)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Language**: TypeScript (strict mode)
- **Content**: MDX via Astro Content Collections
- **CMS**: Sveltia CMS with Git backend (planned — later phase)
- **Deployment**: Vercel

## Module boundaries

```
src/
  app/              # Composition root — selects adapter implementations
  domain/
    models/         # Framework-agnostic types (Project, Post, Tag, etc.)
    ports/          # Interfaces (ContentSource, etc.)
    rules/          # Pure business logic
  adapters/
    content-mdx/    # Reads Astro content collections, implements ports
  ui/
    components/     # Presentational components
    layouts/        # Page shells (BaseLayout, etc.)
    islands/        # Interactive client-side components (React, later)
  pages/            # Astro routes
  content/          # MDX entries (projects, posts)
```

## Core rule

**Pages must not read Astro content collections directly.**

Pages call a port interface (e.g. `ContentSource`) which is implemented by
an adapter (`MdxContentSource`) for the MVP. The composition root in `src/app/`
wires the chosen adapter. This keeps the system modular — the content backend
can be swapped to a database or headless CMS without touching page code.

## Phase 2: Route map locked

All routes are scaffolded with placeholder content. No content collections used yet.

| Route | Page | Description |
|---|---|---|
| `/` | Home | Portfolio-first hero + featured projects + skills + experience + writing + contact CTA |
| `/projects` | Projects index | Grid of project cards with filter bar placeholder |
| `/projects/[slug]` | Project detail | Dynamic route with media, tags, links, body |
| `/blog` | Blog index | List of posts with dates and tags |
| `/blog/[slug]` | Blog detail | Post with cover image, code snippet, body |
| `/tags` | Tags index | Grid of tag chips linking to tag pages |
| `/tags/[tag]` | Tag detail | Matching projects and posts for a given tag |
| `/about` | About | What I do, interests, toolbox, currently |
| `/contact` | Contact | Social links + form placeholder |
| `/resume` | Resume | PDF download link + resume highlights |
| `404` | Not found | Friendly error page with navigation links |

### Key decisions in Phase 2

- **`siteConfig.ts`** in `src/app/` is the single source of truth for site name, nav items, and social links.
- **`HeaderNav`** component handles active link states via server-rendered prefix matching (no JS).
- **`BaseLayout`** accepts SEO props (`title`, `description`, `ogImage`, `noIndex`) and generates Open Graph tags.
- Dynamic routes (`[slug]`, `[tag]`) use `getStaticPaths` with sample data — will be replaced by content adapter calls in Phase 3.

## Phase 3: Content collections + domain models

### Domain models (`src/domain/models/`)

Framework-agnostic types — no Astro imports.

| Type | Fields |
|---|---|
| `Tag` | `slug`, `label`, `count?` |
| `Link` | `label`, `url` |
| `Media` | `type` (image/gif/video/embed), `src`, `alt?`, `caption?` |
| `Project` | `title`, `slug`, `summary`, `tags[]`, `status`, `featured`, `dateStart?`, `dateEnd?`, `links[]`, `media[]`, `body`, `updatedAt?` |
| `Post` | `title`, `slug`, `excerpt`, `tags[]`, `publishedAt`, `coverImage?`, `body` |

### Domain rules (`src/domain/rules/`)

- `slug.ts` — `slugify()` for URL-safe strings
- `tags.ts` — `normalizeTagLabel()`, `toTagSlug()`, `normalizeTagArray()`
- `sort.ts` — `sortProjectsDefault()` (featured > ongoing > date), `sortPostsDefault()` (newest first)

### Content collection schemas (`src/content/config.ts`)

- **Projects**: zod-validated with `dateEnd >= dateStart` refinement, link URL validation, media type enum
- **Posts**: zod-validated with `publishedAt` date coercion

### Tagging convention

Tags are stored as **lowercase slugs** in MDX frontmatter (e.g. `webgl`, `dotnet`, `unity`).
Display labels can be derived later. All tag links point to `/tags/<slug>`.

### Media convention

Media paths use `/uploads/projects/` and `/uploads/posts/` under `public/`.
This prepares for CMS media uploads in a later phase.

### Slug handling

Astro v5 uses the full filename (including `.mdx`) as `entry.id`. The `entrySlug()`
helper in `src/app/entrySlug.ts` strips the extension for clean URLs.

### Content entries

| Collection | File | Title |
|---|---|---|
| projects | `hexa-sentinal.mdx` | HexaSentinal |
| projects | `shaderfoundry.mdx` | ShaderFoundry |
| projects | `portfolio-site.mdx` | Portfolio Site |
| posts | `building-this-site.mdx` | Building this portfolio site |
| posts | `notes-on-clean-architecture.mdx` | Notes on clean architecture in frontend apps |
| posts | `getting-started-with-webgl-shaders.mdx` | Getting started with WebGL shaders |

### What Phase 3 does NOT do

- Pages still call `getCollection()` directly (Phase 4 introduces the `ContentSource` adapter)
- No filtering/search JS yet
- No prose/typography plugin yet

## Phase 4: Ports & adapters

### Architecture enforcement

Pages no longer import `astro:content`. All content access goes through the `ContentSource` port:

```
Page → contentSource (from src/app/content.ts) → MdxContentSource → getCollection()
```

The only files that import `astro:content` are:
- `src/content/config.ts` (schema definitions)
- `src/adapters/content-mdx/MdxContentSource.ts` (adapter implementation)

### View models (`src/domain/models/view/`)

| Type | Purpose |
|---|---|
| `ProjectSummary` | List page data (no rendered MDX) |
| `ProjectDetail` | Detail page data (includes rendered Content component) |
| `PostSummary` | List page data |
| `PostDetail` | Detail page data (includes rendered Content component) |
| `RenderedContent` | Opaque wrapper for Astro's Content component |

### ContentSource interface (`src/domain/ports/ContentSource.ts`)

| Method | Returns |
|---|---|
| `listProjects(filters?)` | `ProjectSummary[]` |
| `getProjectBySlug(slug)` | `ProjectDetail \| null` |
| `listPosts(filters?)` | `PostSummary[]` |
| `getPostBySlug(slug)` | `PostDetail \| null` |
| `listTags()` | `TagCounts[]` |

### Composition root (`src/app/content.ts`)

Exports `contentSource` — the single wired instance of `MdxContentSource`.

## Phase 5: UI component system + filtering + prose

### Component inventory

```
src/ui/components/
  primitives/
    Container.astro       # Centered container with size variants (sm, md, lg)
    PageHeader.astro      # Standardized page title + subtitle
    Section.astro         # Consistent vertical spacing with optional heading
    ButtonLink.astro      # Styled anchor (primary, secondary, ghost variants)
    Card.astro            # Rounded border card with optional link behavior
  content/
    TagChip.astro         # Tag pill with auto-derived label, links to /tags/<slug>
    StatusBadge.astro     # Project status pill (ongoing/completed)
    ProjectCard.astro     # Project summary card with image, tags, status
    PostCard.astro        # Blog post card with date, tags, excerpt
    MediaGallery.astro    # Responsive image gallery (single or grid)
    Prose.astro           # Typography wrapper for MDX content
    FilterPills.astro     # Horizontal pill navigation with active states
    ProjectsFilterBar.astro  # Status + tag filter bar for projects page
    BlogFilterBar.astro   # Tag filter bar for blog page
  home/
    Hero.astro            # Homepage hero section
    FeaturedProjects.astro  # Featured projects grid
    SkillsStrip.astro     # Skills tag cloud
    ExperienceSection.astro # Experience timeline
    LatestPosts.astro     # Latest blog posts list
    ContactCTA.astro      # Contact call-to-action
```

### Query-param filtering (client-side, static-site compatible)

Since the site is statically generated, query-param filtering uses a minimal inline script:

1. All items are rendered into the HTML at build time with `data-status` and `data-tags` attributes
2. A small `<script>` reads `window.location.search` and hides non-matching items
3. Filter pills use `data-pill-active` attribute toggled by the script for active states

**Supported filter URLs:**
- `/projects?status=ongoing` — filter by status
- `/projects?tag=dotnet` — filter by tag
- `/projects?status=ongoing&tag=dotnet` — combined filters
- `/blog?tag=astro` — blog tag filter

### URL builder (`src/domain/rules/url.ts`)

`buildUrl(path, params)` — builds URLs with query params, omitting undefined values, stable sort order.

### Profile config (`src/app/profileConfig.ts`)

Centralizes homepage content: name, role, pitch, CTAs, skills list, experience entries. Used by homepage section components.

### Prose styling

Uses `@tailwindcss/typography` plugin with a `<Prose>` wrapper component that applies:
- `prose prose-zinc` base styles
- Custom code block styling (dark background)
- Accent-colored links and blockquote borders
- Rounded images

### Accessibility

- Skip-to-content link in BaseLayout (visible on focus)
- `id="main"` on main content area
- `:focus-visible` outline on all interactive elements
- `aria-current="page"` on active nav links (from Phase 2)

### Tag chip link behavior by context

| Context | TagChip links to |
|---|---|
| Project card | `/projects?tag=<tag>` |
| Post card | `/blog?tag=<tag>` |
| Project detail (browse more) | `/projects?tag=<tag>` |
| Blog detail (browse more) | `/blog?tag=<tag>` |
| Tags index | `/tags/<tag>` |
| Default (no href) | `/tags/<tag>` |

## Phase 6: Sveltia CMS + GitHub OAuth

### CMS setup

Sveltia CMS is loaded at `/admin` via CDN (`@sveltia/cms`). Configuration lives in `public/admin/config.yml`.

| File | Purpose |
|---|---|
| `public/admin/index.html` | CMS entry point — loads Sveltia CMS from CDN |
| `public/admin/config.yml` | Collection definitions, backend, and media settings |

### Collections in CMS config

Both collections (`projects`, `posts`) map to their Phase 3 Zod schemas:

- **Projects**: title, summary, tags, status (select), featured, dateStart/End, links (nested list), media (nested list with type/src/alt/caption), body (MDX)
- **Posts**: title, excerpt, tags, publishedAt, coverImage, body (MDX)

Media uploads are stored per-collection:
- Projects → `public/uploads/projects/` (referenced as `/uploads/projects/...`)
- Posts → `public/uploads/posts/` (referenced as `/uploads/posts/...`)

### GitHub OAuth flow

Authentication uses GitHub OAuth with a custom helper deployed as Vercel serverless functions:

```
User clicks Login → CMS opens popup to /api/auth
  → Redirect to GitHub OAuth authorize (with CSRF state cookie)
  → GitHub redirects to /api/auth/callback with code
  → Callback exchanges code for access_token
  → Returns HTML with postMessage to send token to CMS popup opener
  → CMS receives token, commits to repo via GitHub API
```

| Endpoint | File | Purpose |
|---|---|---|
| `GET /api/auth` | `api/auth/index.ts` | Generates CSRF state, redirects to GitHub OAuth |
| `GET /api/auth/callback` | `api/auth/callback.ts` | Validates state, exchanges code for token, sends via postMessage |

### Required environment variables (Vercel)

| Variable | Description |
|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | From GitHub OAuth App settings |
| `GITHUB_OAUTH_CLIENT_SECRET` | From GitHub OAuth App settings |
| `GITHUB_OAUTH_REDIRECT_URI` | `https://<your-domain>/api/auth/callback` |

### GitHub OAuth App setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set:
   - Application name: `Portfolio CMS`
   - Homepage URL: `https://<your-vercel-domain>`
   - Authorization callback URL: `https://<your-vercel-domain>/api/auth/callback`
3. Copy Client ID and Client Secret to Vercel env vars
4. Update `base_url` in `public/admin/config.yml` to your Vercel domain

### Security measures

- CSRF protection via `cms_oauth_state` cookie (httpOnly, secure, sameSite=lax, 10min TTL)
- State parameter validated in callback before token exchange
- Cookie cleared after successful auth
- OAuth scope: `repo` (required for committing to the repository)

### Content hardening

The `MdxContentSource` adapter was hardened for CMS-authored content:
- Media `src` paths are normalized with a leading `/` (`normalizeSrc()`)
- Arrays default to `[]` via `?? []` fallback (in addition to Zod `.default([])`)
- Cover image paths are also normalized

### How to publish content

1. Visit `https://<your-domain>/admin`
2. Click "Login with GitHub" and authorize
3. Create or edit a Project or Post
4. Upload images via the media widget
5. Click Publish
6. CMS commits the MDX file (and any images) to the repo
7. Vercel automatically rebuilds and deploys

## Phase 7: SEO, feeds & production polish

### Site URL

The canonical site URL is set in two places (keep them in sync):

- `astro.config.mjs` → `site: "https://moutaz-code.github.io"`
- `src/app/siteConfig.ts` → `siteUrl: "https://moutaz-code.github.io"`

Astro exposes the configured `site` via `Astro.site` at build time. BaseLayout resolves
the canonical URL from `Astro.site` with a fallback to `siteConfig.siteUrl`.

### SEO meta in BaseLayout

BaseLayout accepts these SEO-related props:

| Prop | Default | Purpose |
|---|---|---|
| `title` | Site name + tagline | Used in `<title>` and OG/Twitter title |
| `description` | Site tagline | Meta description, OG/Twitter description |
| `ogImage` | `siteConfig.defaultOgImage` | Open Graph and Twitter card image (resolved to absolute URL) |
| `ogType` | `"website"` | Open Graph type (`website` or `article`) |
| `noIndex` | `false` | Outputs `<meta name="robots" content="noindex, nofollow">` |

Every page gets: canonical URL, OG tags, Twitter card tags, RSS autodiscovery link.

### Default OG image

Placeholder at `public/og/default.png`. Replace with a real 1200x630 PNG.

### robots.txt

Static file at `public/robots.txt`. Points to the sitemap.

### Sitemap

Generated automatically by `@astrojs/sitemap` integration at `/sitemap-index.xml`.
Requires `site` to be set in `astro.config.mjs`.

### RSS feed

Endpoint at `src/pages/rss.xml.ts` → produces `/rss.xml`.

- Fetches posts via `contentSource.listPosts()` (respects port/adapter boundary)
- Includes: title, pubDate, description (excerpt), link

Autodiscovery `<link>` tag is in BaseLayout `<head>`.

### Detail page SEO specialization

| Page | `ogType` | `ogImage` source |
|---|---|---|
| Blog post | `article` | `post.coverImage` (falls back to default) |
| Project | `website` (default) | `project.primaryImage?.src` (falls back to default) |

### Related content

- Blog post detail shows up to 3 related posts (sharing at least one tag)
- Project detail shows up to 3 related projects (sharing at least one tag)
- Both exclude the current item and use existing `contentSource` calls

### What Phase 7 does NOT do

- No dynamic OG image generation (static placeholder only)
- No JSON-LD structured data
- No analytics integration

## Phase 8: Search & discoverability

### Approach

Uses **Pagefind** (static search index) via the `astro-pagefind` integration (Approach A).
Pagefind runs automatically after `astro build`, generates an index at `dist/pagefind/`,
and loads on demand only when the user visits `/search`.

### Integration setup

- `astro-pagefind` and `pagefind` installed as devDependencies
- `pagefind()` added to `astro.config.mjs` integrations (after `sitemap()`)
- No custom build scripts needed — the integration handles everything

### What gets indexed

Only pages with `data-pagefind-body` are indexed:

| Page | Indexed content |
|---|---|
| `projects/[slug].astro` | Title, summary, tags, MDX body |
| `blog/[slug].astro` | Title, excerpt, tags, MDX body |

Each indexed page carries Pagefind meta attributes:
- `data-pagefind-meta="type:Project"` or `data-pagefind-meta="type:Post"`
- `data-pagefind-meta="tags:tag1,tag2,..."`

### What is excluded

| Element | Method |
|---|---|
| Header nav | `data-pagefind-ignore` on `<header>` in BaseLayout |
| Footer | `data-pagefind-ignore` on `<footer>` in BaseLayout |
| Back links | `data-pagefind-ignore` on back-navigation div |
| Browse more / related sections | `data-pagefind-ignore` wrapper |
| `/admin` page | `data-pagefind-ignore` on `<body>` in admin HTML |
| All other pages (listing, tags, about, etc.) | No `data-pagefind-body` = not indexed |

### Search page

`/search` — uses `astro-pagefind`'s `Search` component with custom CSS variable
overrides to match the site theme. Includes quick links to tags, projects, and blog.
Marked `noIndex` (robots) since it has no indexable content of its own.

### Files added/modified

- `src/pages/search.astro` — new search page
- `astro.config.mjs` — added `pagefind()` integration
- `src/app/siteConfig.ts` — added "Search" nav item
- `src/pages/projects/[slug].astro` — `data-pagefind-body`, meta, ignore wrappers
- `src/pages/blog/[slug].astro` — `data-pagefind-body`, meta, ignore wrappers
- `public/admin/index.html` — `data-pagefind-ignore` on body

## Phase 9: Cloudinary delivery + responsive images + performance hardening

### Architecture

Follows the same ports & adapters pattern as content:

- **Port**: `src/domain/ports/MediaService.ts` — defines `MediaService` interface,
  `ResponsiveVariant`, `ResponsiveImage`, `ResolvedMedia` types
- **Local adapter**: `src/adapters/media-local/LocalMediaService.ts` — normalizes
  leading `/`, returns `{ src }` only (no srcset for local assets)
- **Cloudinary adapter**: `src/adapters/media-cloudinary/CloudinaryMediaService.ts` —
  detects Cloudinary URLs, inserts `f_auto,q_auto,c_limit,w_<W>` transforms,
  generates `srcset` and `sizes` per variant
- **Router**: `src/app/media.ts` — exports `mediaService` singleton that routes
  to the correct adapter based on URL pattern

### Responsive variants

| Variant | Widths (srcset) | Default width | Sizes |
|---|---|---|---|
| `card` | 320, 480, 640, 800 | 800 | `(max-width: 768px) 100vw, 420px` |
| `prose` | 480, 768, 1024, 1280 | 1024 | `(max-width: 768px) 100vw, 768px` |
| `hero` | 768, 1024, 1440, 1920 | 1440 | `100vw` |
| `gallery` | 480, 768, 1024, 1440 | 1024 | `(max-width: 768px) 100vw, 900px` |

### ResponsiveImage component

`src/ui/components/content/ResponsiveImage.astro` — single component for all images.
Props: `src`, `alt`, `variant`, `loading`, `class`.

- All images get `decoding="async"`
- Hero variant: `loading="eager"`, `fetchpriority="high"`
- All others: `loading="lazy"`
- Cloudinary URLs get `srcset` + `sizes`; local/external URLs get plain `src`

### CLS hardening

ProjectCard and PostCard wrap images in `<div class="aspect-video overflow-hidden rounded">`.
The fixed 16:9 aspect ratio prevents layout shift before images load.

### URL routing logic

| URL pattern | Adapter | Behavior |
|---|---|---|
| Starts with `http` + contains `res.cloudinary.com` | CloudinaryMediaService | Transforms + srcset |
| Starts with `http` (other) | External passthrough | Plain src |
| Local path (e.g. `/uploads/...`) | LocalMediaService | Normalize leading `/` |

### Components updated

All raw `<img>` tags replaced with `<ResponsiveImage>`:
- `ProjectCard.astro` — variant `card`
- `PostCard.astro` — variant `card`
- `MediaGallery.astro` — variant `gallery`
- `blog/[slug].astro` cover image — variant `hero`
- Project detail uses MediaGallery (inherits `gallery` variant)

### Example generated srcset (Cloudinary)

For a card variant with source URL
`https://res.cloudinary.com/demo/image/upload/v1234/photo.jpg`:

```
https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_320/v1234/photo.jpg 320w,
https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_480/v1234/photo.jpg 480w,
https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1234/photo.jpg 640w,
https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_800/v1234/photo.jpg 800w
```

### Backward compatibility

- Local `/uploads/...` paths continue to work unchanged (LocalMediaService)
- External non-Cloudinary URLs pass through unchanged
- No new binary assets committed to the repo for Cloudinary content
