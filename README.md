# Moutaz Portfolio Platform

Personal portfolio + technical blog built with Astro, TypeScript, and MDX.

Live site: https://moutaz.vercel.app/

## Stack

- Astro (static-first)
- TypeScript (strict)
- Tailwind CSS
- MDX content collections
- Sveltia CMS (Git-based)
- Vercel deployment

## Local development

Run all commands from the project root:

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server |
| `npm run build` | Build production output |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run project checks |

## Notes

- This project follows a ports/adapters structure for content and integrations.
- Unknown tags are warning-only and do not fail builds.
- Main architecture decisions are documented in `docs/architecture.md`.
