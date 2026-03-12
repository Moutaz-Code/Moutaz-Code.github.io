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

## Phase 10: Motion, sound & signature animations

Phase 10 transformed the portfolio from a static content site into an interactive, motion-rich experience while maintaining strict performance discipline.

### BaseLayout feature toggles

All features are opt-in per page via BaseLayout props:

```typescript
interface Props {
  enableMotion?: boolean;           // initReveals, initHovers, initAccent
  enableSmoothScroll?: boolean;     // Lenis inertial scrolling
  enableAmbient?: boolean;          // Ambient background layer
  ambientVariant?: "a" | "b" | "c"; // Per-page visual variation
  enableCursor?: boolean;           // Custom cursor tracker
  enablePageTransitions?: boolean;  // Fade in/out navigation
  enableSound?: boolean;            // Web Audio micro-sounds
}
```

### Dependencies added

| Package | Purpose |
|---|---|
| `motion` | Lightweight animation library (Framer Motion successor, ~15KB) |
| `animejs` | SVG stroke/path animation (signatures, dividers) |
| `lenis` | Inertial smooth scrolling |

### Component inventory

```
src/ui/components/
  signature/
    HeroSignature.astro       # Animated SVG underline + bloom glow behind CTAs
    HeroSignatureInit.astro   # Initialization for hero signature animation
    SignatureInit.astro       # Entry point for anime.js signature animations
    SignatureUnderline.astro  # Reusable underline component
    CornerFlourish.astro      # Decorative L-shaped corner bracket (animated on scroll)
    CornerSpark.astro         # Subtle corner accent (paired with MagneticInit)
    SectionDivider.astro      # Animated SVG divider (wave / circuit / harmonic variants)
    DividerInit.astro         # IntersectionObserver-gated divider animation
  motion/
    MagneticInit.astro        # Lazy-loads pointer-tracking magnetic hover effects
  ambient/
    AmbientLayer.astro        # Decorative background (gradient blobs, parallax shapes, grain)
    AmbientInit.astro         # Blob drift, pointer tracking, scroll parallax controller
  cursor/
    CursorLayer.astro         # Pure DOM presentation (dot, ring, label elements)
    CursorInit.astro          # Interactive cursor controller with state machine
  transitions/
    PageTransitionInit.astro  # Fade in/out on internal navigation
  home/
    ProjectConstellation.astro # Interactive node network for project discovery
    ConstellationInit.astro    # IntersectionObserver-gated constellation animation
  (root level)
    MotionInit.astro          # Driver that initializes reveals, hovers, accent animations
    SmoothScrollInit.astro    # Lenis smooth scrolling initialization
    SoundToggle.astro         # Speaker icon toggle button in header
    SoundInit.astro           # Event listener for micro-sounds on [data-sfx] elements
    ThemeToggle.astro         # Animated sun/moon pill switch in header
```

### Runtime modules

| Module | Location | Purpose |
|---|---|---|
| `motion.ts` | `src/ui/motion/` | Scroll-triggered reveals (`data-reveal`), hover lifts (`data-hover="lift"`), accent animations (pop/glow/wiggle) |
| `magnetic.ts` | `src/ui/motion/` | Pointer-tracking magnetic repulsion (max 6px, lerp smoothing) |
| `constellation.ts` | `src/ui/motion/` | Node drift, pointer repulsion, curved SVG edge animation |
| `signature.ts` | `src/ui/anime/` | anime.js stroke draw for underlines, corners |
| `heroSignature.ts` | `src/ui/anime/` | Hero-specific signature animation |
| `lenis.ts` | `src/ui/scroll/` | Lenis init (lerp 0.08), anchor-link interception, header offset |
| `prefs.ts` | `src/ui/runtime/` | Cached `prefersReducedMotion()` and `isCoarsePointer()` checks |
| `sound.ts` | `src/app/` | Web Audio synthesis (toggle: 1200→800Hz sine sweep; click: 800Hz triangle), localStorage persistence |
| `theme.ts` | `src/app/` | Theme persistence (light/dark/system), `theme-dark` class toggle |

### CSS files

| File | Purpose |
|---|---|
| `src/styles/anime-signature.css` | SVG stroke animation styles |
| `src/styles/constellation.css` | Node/line styling |
| `src/styles/cursor.css` | Custom cursor DOM presentation |
| `src/styles/ambient.css` | Blob/parallax styling |
| `src/styles/transitions.css` | Page fade in/out keyframes |
| `src/styles/theme.css` | Dark/light theme variables |

### Custom cursor state machine

The cursor controller detects context by walking the DOM tree:

| State | Trigger |
|---|---|
| `default` | Normal |
| `link` | Over `<a>` tags |
| `button` | Over `<button>` or `[role="button"]` |
| `text` | Over inputs/textareas/contenteditable |
| `card` | Over `[data-hover="lift"]` elements |

Custom labels via `data-cursor-label` attribute. Dot lerp: 0.55 (snappy), ring lerp: 0.15 (laggy).

### Project constellation

Interactive node network on the homepage for project discovery:

- Deterministic hash-based layout with relaxation algorithm
- Nearest-neighbor edges (Delaunay-like connectivity)
- Drift animation with sin/cos floating per node
- Pointer repulsion: max 12px, radius 250px (disabled on touch)
- Curved SVG lines with wave modulation (amplitude 32px, freq 0.8)
- Tooltips with title and up to 3 tags

### Section divider variants

| Variant | Description |
|---|---|
| `wave` | Organic sine curves |
| `circuit` | Digital signal pulses |
| `harmonic` | Complex composite waveform (19 harmonics) |

### Performance infrastructure

**`scripts/check-perf-rules.mjs`** — import discipline enforcement:
- `animejs` only importable from `src/ui/anime/`
- `constellation` only in home components and `src/ui/motion/`
- `lenis` only in `src/ui/scroll/` and SmoothScrollInit

**`scripts/check-coupling.mjs`** — ports/adapters boundary enforcement:
- `astro:content` only importable from `src/content/config.ts` and `src/adapters/content-mdx/MdxContentSource.ts`

**`docs/perf.md`** — performance audit documentation.

### Key architectural decisions

1. **Lazy loading** — all animation modules dynamically imported, only loaded when needed
2. **RAF management** — loops start on first interaction, pause on tab hidden / out of viewport
3. **Graceful degradation** — all features hidden/disabled with CSS when JS unavailable
4. **User agency** — respects `prefers-reduced-motion`, `prefers-color-scheme`, coarse pointer detection
5. **Sound safety** — AudioContext lazy-initialized, disabled by toggle, user opt-in via localStorage
6. **Visibility-aware** — all animation systems pause when tab hidden or element scrolled out of viewport

## Phase 11: Case study project detail

Added structured case study fields and dedicated components for rich project narratives.

### Case study frontmatter fields

All fields are optional with safe defaults (backward compatible):

| Field | Type | Purpose |
|---|---|---|
| `role` | `string?` | User's role (e.g. "Solo Developer") |
| `timeframe` | `string?` | Project duration (e.g. "Oct 2025 – Jan 2026") |
| `stack` | `string[]` | Technologies used (separate from tags) |
| `highlights` | `string[]` | 3–6 key bullet points |
| `results` | `string[]` | Measurable outcomes |
| `problem` | `string?` | Problem statement |
| `constraints` | `string[]` | Project constraints |
| `approach` | `string[]` | Methodology steps |
| `architecture` | `string[]` | Architecture decisions |
| `challenges` | `string[]` | Technical challenges faced |
| `lessons` | `string[]` | Lessons learned |
| `nextSteps` | `string[]` | Future directions |

Added to: `src/content/config.ts` (Zod), `src/domain/models/view/ProjectView.ts` (ProjectDetail type), `src/adapters/content-mdx/MdxContentSource.ts` (adapter passthrough with `?? []` fallback), `public/admin/config.yml` (CMS fields with hints).

### Components created

```
src/ui/components/projects/
  QuickFacts.astro    # Sticky sidebar card: status, role, timeframe, stack, links
  Highlights.astro    # Key highlights with accent dot indicators
  Results.astro       # Measurable outcomes with left accent border
```

### Project detail page layout

`src/pages/projects/[slug].astro` refactored with:

1. **Two-column grid** — `lg:grid-cols-[1fr_260px]` with 8px gap
   - Left: Highlights + Results
   - Right: QuickFacts (sticky at lg+ with `lg:sticky lg:top-24`)
2. **Case study sections** — 7 sections (Problem, Constraints, Approach, Architecture, Challenges, Lessons, Next Steps) rendered as bullet lists or paragraphs, conditionally hidden when empty
3. **Related projects** — up to 3 projects sharing at least one tag

### Template documentation

`docs/templates/project-case-study.mdx` — comprehensive template demonstrating all case study fields with realistic example values.

## Phase 12: Content hardening & CMS flexibility

Made content schemas more forgiving for CMS-authored content.

### Post schema changes

- `publishedAt` made optional (was required) — posts without dates sort last
- `coverImage` made optional (was required)
- Sorting handles missing dates: `a.publishedAt ? a.publishedAt.getTime() : 0`

### CMS flexibility

- All optional list/select fields in `public/admin/config.yml` marked `required: false`
- Allows quick entry of minimal projects/posts without filling every field
- Validation still enforced at the Zod schema level

### Files modified

- `src/content/config.ts` — optional post fields
- `src/domain/models/Post.ts`, `src/domain/models/view/PostView.ts` — `publishedAt?: Date`
- `src/adapters/content-mdx/MdxContentSource.ts` — null-safe date sorting
- `public/admin/config.yml` — `required: false` on 14 fields across both collections
- Blog pages and post components updated for graceful missing-date handling

## Phase 14: Tag taxonomy enforcement + CMS ergonomics

### Tag registry

`src/app/tagsRegistry.ts` — canonical registry of 120+ tags across 13 categories:

| Category | Example tags |
|---|---|
| General | projects, portfolio, case-study, writing, tutorial, notes |
| University | university, coursework, capstone |
| Research | research, experiments, paper-review |
| Languages | C, C++, C#, Java, Python, Rust, Go, TypeScript, JavaScript, SQL |
| Web Development | React, Next.js, Vue, Svelte, Astro, Node.js, Express, HTML, CSS |
| .NET Ecosystem | .NET, ASP.NET, WPF, WinUI, XAML, Entity Framework |
| Game Dev | Unity, Unreal, gameplay, tools-dev, technical-art, VFX |
| Graphics & Rendering | shaders, WebGL, OpenGL, DirectX, Vulkan, Metal, PBR, NPR, ray-tracing |
| Security | cybersecurity, forensics, incident-response, crypto, appsec |
| AI/ML | AI, ML, deep-learning, NLP, computer-vision, LLM |
| DevOps / IT | databases, Linux, Windows, networking |
| Tools | Git, GitHub, Vercel, Docker, CI/CD |
| Design | UI/UX, Figma, Blender, Photoshop, pixel-art |

Each tag has: `slug` (canonical kebab-case), `label` (display name), `aliases[]` (alternative names), `category` (organizational grouping).

### Tag canonicalization

`src/domain/rules/tags.ts`:

```typescript
canonicalizeTag("C#")    → "csharp"   // raw lowercase "c#" found in ALIAS_TO_SLUG
canonicalizeTag(".NET")  → "dotnet"   // before slugify strips special chars
canonicalizeTag("react") → "react"    // direct slug match
```

The function checks raw lowercase input against `ALIAS_TO_SLUG` *before* slugifying, because `slugify()` strips characters like `#`, `.`, `+`.

### Build-time tag checker

`scripts/check-tags.mjs` — scans all MDX frontmatter for tags not in the registry. Reports warnings but doesn't fail the build. Added to `package.json` as `check:tags` and chained into the `check` script.

### CMS tag widget upgrade

Both project and post tag fields changed from `widget: list` (free-text) to `widget: select` with `multiple: true` and all 120+ tags as categorized dropdown options. Users can search and multi-select without typing.

### Adapter integration

- `MdxContentSource.getPostBySlug()` — tags use `canonicalizeTagArray()`
- `MdxContentSource.listTags()` — canonicalizes during aggregation, uses `tagLabel()` for display
- `TagChip.astro` — uses `tagLabel()` from domain rules

### Site config

`src/app/siteConfig.ts` — added `strictTags: false` (allows unknown tags at build time).

## Phase 15A: GitHub repo cards (build-time, cached)

### Architecture

Follows the same ports & adapters pattern as content:

```
Page → repoService (from src/app/repos.ts) → GitHubRepoMetadataService → GitHub API
```

### Port

`src/domain/ports/RepoMetadataService.ts`:

```typescript
type RepoMetadata = {
  fullName: string;     // "owner/repo"
  url: string;          // GitHub repo URL
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  updatedAt: string;
  homepage?: string;
};

interface RepoMetadataService {
  getRepo(fullName: string): Promise<RepoMetadata | null>;
}
```

### Adapter

`src/adapters/github/GitHubRepoMetadataService.ts`:

- Fetches from GitHub API v3 (`https://api.github.com/repos/{owner}/{repo}`)
- File-based cache at `.cache/github-repos.json` with 12-hour TTL
- Optional `GITHUB_TOKEN` env var for authenticated requests
- On fetch failure: returns stale cache entry or `null` — never throws, never breaks the build

### Composition root

`src/app/repos.ts` — exports `repoService` singleton.

### Schema + model

- `src/content/config.ts` — `githubRepo` field uses `z.preprocess()` to convert empty CMS strings to `undefined`, then `z.string().optional()`
- `src/domain/models/view/ProjectView.ts` — `githubRepo?: string` on `ProjectDetail`
- `src/adapters/content-mdx/MdxContentSource.ts` — passes `githubRepo` through

### UI component

`src/ui/components/integrations/RepoCard.astro`:

- GitHub icon + repo name link
- Description (if available)
- Stats row: stars, forks, language, last updated date
- Action buttons: "View on GitHub", "Homepage"
- Styled with rounded-lg border, consistent with QuickFacts

### Page wiring

`src/pages/projects/[slug].astro`:

- Fetches repo metadata at build time when `githubRepo` exists
- Renders `RepoCard` between media gallery and case study sections
- Falls back to a simple "View on GitHub →" link if the API fetch fails

### CMS + gitignore

- `public/admin/config.yml` — `githubRepo` string field (optional, hint: "owner/repo format")
- `.gitignore` — added `.cache/` directory

## Phase 15B: itch.io embed (responsive wrapper, per-project)

### Schema + model

- `src/content/config.ts` — `itchEmbedUrl` field uses `z.preprocess()` (empty string → undefined), then `z.string().url().optional()`
- `src/domain/models/view/ProjectView.ts` — `itchEmbedUrl?: string` on `ProjectDetail`
- `src/adapters/content-mdx/MdxContentSource.ts` — passes `itchEmbedUrl` through

### UI component

`src/ui/components/integrations/ItchEmbed.astro`:

- Gamepad icon + "Play / Demo" label
- Responsive iframe wrapper (max-width 552px, itch.io default)
- `loading="lazy"` for performance
- Accepts `src` (required) and `title` (optional, defaults to "itch.io widget")
- Styled with rounded-lg border, consistent with RepoCard

### Page wiring

`src/pages/projects/[slug].astro`:

- Renders `ItchEmbed` between GitHub repo card and case study sections when `itchEmbedUrl` exists

### CMS

- `public/admin/config.yml` — `itchEmbedUrl` string field (optional, hint: "Full iframe src URL from itch.io")

## Phase 15C: ShaderToy embed (responsive wrapper, per-project)

### Schema + model

- `src/content/config.ts` — `shaderToyId` field uses `z.preprocess()` (empty string → undefined), then `z.string().min(1).optional()`
- `src/domain/models/view/ProjectView.ts` — `shaderToyId?: string` on `ProjectDetail`
- `src/adapters/content-mdx/MdxContentSource.ts` — passes `shaderToyId` through

### UI component

`src/ui/components/integrations/ShaderToyEmbed.astro`:

- Sparkle/star icon + "ShaderToy Demo" label
- Builds iframe URL from shader ID: `https://www.shadertoy.com/embed/{id}?gui=false&t=10&paused=false&muted=true`
- Responsive 16:9 aspect-ratio wrapper (fills container width)
- `loading="lazy"`, `allowfullscreen`
- Styled with rounded-lg border, consistent with RepoCard and ItchEmbed

### Page wiring

`src/pages/projects/[slug].astro`:

- Renders `ShaderToyEmbed` between itch.io embed and case study sections when `shaderToyId` exists

### CMS

- `public/admin/config.yml` — `shaderToyId` string field (optional, hint: "Shader ID from ShaderToy")

### Integration render order on project detail page

```
Quick Facts + Highlights/Results
Media Gallery
GitHub RepoCard
itch.io ItchEmbed
ShaderToy ShaderToyEmbed
Case study sections
MDX body
```
