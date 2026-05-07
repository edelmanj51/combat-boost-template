# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static multi-page HTML website for Tiger Paw Martial Arts (Middle River, MD). No build system, no framework, no package manager. Open any `.html` file directly in a browser to preview.

## Architecture

**Single-file pattern** — every HTML page is fully self-contained: all CSS lives inside `<style>` in `<head>`, all JS lives in a single IIFE `<script>` at the bottom of `<body>`. There are no external stylesheets, no external scripts, and no CDN dependencies. This is intentional for zero-blocking-resource performance.

**Design tokens** — CSS custom properties defined in `:root` control the entire color system. The core tokens are `--red` / `--red-dark`, `--blue` / `--blue-dark` / `--blue-light`, `--gold`, `--dark` / `--dark-2`, `--gray` / `--gray-light`, `--light`, `--white`. Always use these tokens rather than hard-coded hex values.

**Pages**

| File | Purpose |
|------|---------|
| `index.html` | Main landing page (hero, social proof, testimonials, programs, reviews, FAQ, final CTA) |
| `program-1.html` | Kids Martial Arts program landing page |
| `program-2.html` | Teens & Adult Taekwondo program landing page |
| `program-template.html` | Blank template for adding future program pages |
| `programs.html` | Programs overview (card grid) |
| `schedules.html` | Weekly class schedule table |
| `reviews.html` | Google reviews summary + 10-card grid |
| `quick-tour.html` | Facility photo gallery |
| `news.html` | Article cards + newsletter strip |
| `thank-you.html` | Post-form-submission confirmation page |

**Modals (index.html + program pages)** — three popup modals are wired on every full conversion page:
- `modal-trial` — free intro session lead capture → `[TRIAL_WEBHOOK_URL]`
- `modal-kit` — $29 starter kit lead capture → `[STARTER_KIT_WEBHOOK_URL]`
- `modal-quiz` — multi-step branching quiz (auto-fires after 60 s if no modal interaction) → `[QUIZ_WEBHOOK_URL]`

Webhooks POST to GoHighLevel (GHL) endpoints. All four webhook URLs are currently placeholders pending GHL setup — see `CLIENT_DATA.md`.

## Source of truth

`CLIENT_DATA.md` contains all client-specific content: contact info, program names, testimonials, schedules, social links, offers, and webhook URLs. When any content needs to change, update `CLIENT_DATA.md` first, then reflect the change in the relevant HTML files.

## Making a new program page

Duplicate `program-template.html`, rename it (e.g. `program-3.html`), and find-replace the bracket tokens listed at the bottom of `CHANGES.md`. Add a card to `programs.html` and a footer link to all other pages.

## Images

All images are `.webp` (or `.png` for the logo) in the `images/` directory. When swapping placeholder divs for real images, add `loading="lazy"` and serve compressed WebP. Each placeholder div in the HTML has a `<!-- SWAP: ... -->` comment explaining what to replace.
