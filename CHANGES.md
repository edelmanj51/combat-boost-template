# CHANGES

## Tiger Paw Build — Complete population (May 2025)

Applied to all HTML files in `~/tiger-paw-ma/`:
- Replaced all content tokens with real Tiger Paw Martial Arts data from `CLIENT_DATA.md`
- index.html: logo, hero, nav, social proof (4.9 stars / 61 reviews / 20 years), testimonials, programs, Google reviews, FAQ, footer, modals — instructor section removed
- program-1.html: Kids Martial Arts (Ages 4–12) — real photo, descriptions, challenges, 5 reviews, 5 FAQs, kids benefits variant active
- program-2.html: Teens & Adult Taekwondo (Ages 13+) — real photo, descriptions, challenges, 5 reviews, 5 FAQs, adult benefits variant active
- programs.html: Reduced from 5 to 2 program cards with real photos and schedules
- schedules.html: Real class times — Kids (Tue/Thu 6–7pm, Sat 9–10am), Adults (Mon/Wed 6–7pm, Thu 7–8pm)
- reviews.html: 10 real Tiger Paw Google reviews replacing placeholders; rating corrected to 4.9
- news.html: 3 Tiger Paw-specific article titles and excerpts
- quick-tour.html: All 8 gallery photo placeholders replaced with real site images
- Deleted program-3.html, program-4.html, program-5.html (Tiger Paw has 2 programs only)
- Webhook URLs intentionally left as placeholders — pending GHL setup

---

## v1.4.0 — Program page redesign (Gracie HB format)

Rewrote `program-template.html` and propagated to `program-1.html` through `program-5.html` to match the conversion page format used at Gracie HB.

### Key structural changes
- **Section 0 (Pricing banner)** — Changed from dark navy to white background with blue bottom border; "Exclusive Offer" eyebrow; same headline; "Take Our Free Self-Test" button opens Quiz modal
- **Sections 1–2 merged** — Program hero (dark gradient, `[PROGRAM NAME]` h1, age/exp tags, two CTAs) sits above a two-column `#prog-content` section: photo + meta pills on the left, description paragraphs + challenges block on the right
- **Challenges block** — Moved inside the description column (not a standalone section); red ✗ icon items; "See Pricing & Program Details" link opens Starter Kit modal
- **Benefits section removed** — Replaced by challenges-inline layout
- **Section 4 — Testimonials** — Expanded to 5 cards; heading changed to "Why [CITY] Families Love [SCHOOL NAME]" with "Community Love" eyebrow
- **Section 5 — FAQ** — Heading changed to "Got Questions? We've Got Answers."
- **Section 6 — Final CTA** — Removed inline lead-gen form; replaced with two buttons (Book Free Trial + Download Starter Kit)

---

## v1.3.0 — Program page template (`program-template.html`)

New standalone template for individual program landing pages. Duplicate and rename (e.g., `kids-bjj.html`) for each program. 7 sections in order:

### Section 0 — Pricing banner (top of page, above everything)
- Dark `#07101e` full-width band with gold "Don't Miss Out" eyebrow pill
- Headline: "To Get The Most Up To Date Pricing, Schedules, Program Details & EXCLUSIVE Online Promotions. Download Our Free Starter Kit Below."
- "EXCLUSIVE" rendered in `--gold` color for emphasis
- Blue "Take Our Free Self-Test" button — opens the full Quiz popup modal (same multi-step quiz as index.html, including all branching logic and webhook submit)
- Sits directly below the 72px fixed header with no separate page-banner section above it

### Section 1 — Program identity
- Dark gradient banner: program name `<h1>`, age range tag, experience-level tag, tagline
- Tokens: `[PROGRAM NAME]`, `[AGE RANGE]`, `[EXPERIENCE LEVEL]`, `[PROGRAM SUBTITLE]`, `[PROGRAM TAGLINE]`

### Section 2 — Program description
- Photo placeholder with `<!-- SWAP: ... -->` comment
- `[PROGRAM DESCRIPTION HEADLINE]` + 3 paragraph tokens

### Section 3 — Challenges
- "Does [your child / you] face any of these challenges?" heading
- 3 challenge items (red ✗ icon, white card, hover border-blue effect)
- "See Pricing & Program Details" link — opens Starter Kit popup
- Tokens: `[CHALLENGE 1–3]`

### Section 4 — Benefits
- "How [PROGRAM NAME] Will Help You" — 3 icon cards (shield, brain, target SVGs)
- Tokens: `[BENEFIT 1–3 TITLE]`, `[BENEFIT 1–3 DESCRIPTION]`

### Section 5 — Google reviews
- Google badge, 5-star rating, 4 review cards with avatar placeholders
- Tokens: `[REVIEWER 1–4 NAME]`, `[REVIEW 1–4 TEXT]`, `[REVIEW_COUNT]`

### Section 6 — FAQ accordion
- 5 questions, same single-open accordion as index.html
- Tokens: `[FAQ Q1–Q5]`, `[FAQ A1–A5]`

### Section 7 — Final CTA band
- Same dark-gradient inline lead-gen form as index.html
- Submits to `[FINAL_CTA_WEBHOOK_URL]`

### All 3 modals included
- Trial, Starter Kit, and Quiz modals (no 60s auto-fire — user must click "Take Our Free Self-Test")

---

## v1.2.0 — Nav restructure, hero cleanup, and 5 subpages

### 1. Nav restructure (`index.html` + all subpages)
- **Pricing** now opens the Starter Kit popup modal (not a page link)
- **Programs** dropdown trimmed to 5 `[PROGRAM N NAME]` placeholders linking to `programs.html`
- **Quick Tour** links to `quick-tour.html`
- **More** dropdown contains only: Member Schedules (`schedules.html`) and News (`news.html`)
- **Get Started** header button opens the Trial popup modal
- Removed "About" and "Contact" nav items entirely

### 2. Hero cleanup (`index.html`)
- Removed `★ Serving [CITY] Since [YEAR]` badge (had been added in initial build, not needed)

### 3. New subpages (all with inline CSS, zero external deps, shared nav/footer/modals)
- **`quick-tour.html`** — Campus gallery with 8 photo placeholder cards and intro/CTA sections
- **`programs.html`** — 5 program cards with photo placeholders, age tags, schedule/duration meta, `id="program-N"` anchors for deep linking
- **`reviews.html`** — Google rating summary block + 10 review card placeholders + CTA section
- **`schedules.html`** — Weekly class schedule table (5 programs × 7 days), color-coded time slots, legend, private-lessons callout
- **`news.html`** — 3 article cards (1 featured full-width + 2 standard), newsletter opt-in strip, CTA section

### 4. Footer program links (all subpages)
- Footer Programs column links point to `programs.html` instead of `index.html#programs`

---

## v1.1.0 — Form simplification, dropdown delay, mobile CTA fix

### 1. Modal forms simplified (all 3 modals)
- Replaced split First Name / Last Name fields with a single **Name** field
- Removed `*` required markers from all modal labels (fields still validate as required)
- Program dropdown options standardised to: **Kids** / **Teens & Adults** / **Not Sure**
  (removed the old `[KIDS PROGRAM NAME]` / `[ADULT PROGRAM NAME]` / `[ADVANCED PROGRAM NAME]` token options)
- Quiz modal contact form (step 4) now includes the Program dropdown to match the other two modals

### 2. Nav dropdown hover delay
- Replaced pure-CSS `:hover` show/hide with JS-driven `.open` class toggling
- `mouseenter` on `.nav-dropdown` immediately shows the menu (cancels any pending close)
- `mouseleave` starts a **300 ms** timer before removing `.open`; re-entering before the timer fires cancels it, preventing the snap-shut problem when mousing diagonally into the submenu
- Mobile behaviour unchanged (dropdowns remain always-visible inside the expanded mobile nav)

### 3. Mobile hero CTAs — stacked full-width
- On screens ≤ 768 px the two hero buttons (`Book Free Trial` / `Download Starter Kit`) now stack vertically and stretch to full container width for easy tapping
- Added to existing `@media (max-width: 768px)` block — no new breakpoint introduced

---

## v1.0.0 — Initial Build

Single-file martial arts website template (`index.html`) built from scratch.
All CSS lives in `<head>`. All JS lives at the bottom of `<body>`.
Zero external dependencies, zero frameworks, zero web fonts.

---

### Structure (13 sections, follows Gracie HB conversion order)

| # | Section | Notes |
|---|---------|-------|
| 1 | Sticky header | Logo · center nav w/ dropdowns (Pricing, Programs, Quick Tour, More) · Get Started CTA · mobile hamburger |
| 2 | Hero | Full-viewport photo placeholder · bold headline · subheadline · Book Free Trial + Download Starter Kit CTAs |
| 3 | Mission band | Dark strip · "Your achievement is our mission" tagline |
| 4 | Social proof bar | Star rating · animated review count · animated student count · animated years counter (IntersectionObserver triggers on scroll) |
| 5 | Testimonials | 3 parent/student quote cards with avatar placeholders |
| 6 | Why Choose Us | Dark bg · 3 value-prop columns with inline SVG icons |
| 7 | Programs | 3 cards with photo placeholders, tags, meta (schedule/duration), and Learn More / Book Trial buttons |
| 8 | How To Get Started | 3 numbered steps · desktop connector line · CTA button |
| 9 | Instructors | Featured head instructor (taller card) + 2 coaches · photo placeholders |
| 10 | Google Reviews | Google-G badge · 4 review cards with "via Google" label |
| 11 | FAQ accordion | 8 questions · single-open accordion · accessible aria-expanded |
| 12 | Final CTA band | "More Confidence. More Focus." headline · inline lead-gen form |
| 13 | Footer | Brand + social links · Programs list · Useful Resources list · Contact/address/hours |

---

### Popup modals (3 total)

**Trial modal** (`modal-trial`)
- Trigger: "Get Started" header button, "Book Free Trial" hero CTA, all program card buttons, Get Started section CTA, footer link
- Fields: First Name, Last Name, Email, Phone, Program (select)
- SMS consent copy included
- Submits to `[TRIAL_WEBHOOK_URL]` — replace with Make/Zapier/GHL endpoint
- Success state: animated swap to confirmation message

**Starter Kit / Pricing modal** (`modal-kit`)
- Trigger: "Download Starter Kit" hero CTA, footer link
- Same field set as trial modal
- Submits to `[STARTER_KIT_WEBHOOK_URL]`
- Separate webhook so leads can be routed differently

**Quiz popup** (`modal-quiz`)
- Auto-fires after **60 seconds** if no other modal is open and user has not already interacted with a modal CTA
- Branch logic: "For Me" → experience level → goal → contact form; "For Kids" → age range → priority → contact form
- Progress bar updates at each step (12 → 28 → 57 → 85 → 100 %)
- All quiz answers serialized into hidden field `quizAnswers` (JSON) on submit
- Submits to `[QUIZ_WEBHOOK_URL]`
- Success state replaces form in-place

---

### Placeholder tokens (find-and-replace to customize per client)

```
[SCHOOL NAME]          — e.g., "Gracie Barra Irvine"
[CITY]                 — e.g., "Irvine"
[STATE]                — e.g., "CA"
[ZIP]                  — e.g., "92618"
[PHONE]                — e.g., "(949) 555-1234"
[EMAIL]                — e.g., "info@school.com"
[YEAR]                 — founding year, e.g., "2012"
[MARTIAL ART]          — e.g., "Brazilian Jiu-Jitsu"
[PROGRAM 1 NAME]       — e.g., "Little Champions"
[PROGRAM 2 NAME]       — e.g., "Fundamentals"
[PROGRAM 3 NAME]       — e.g., "Advanced / Competition"
[KIDS PROGRAM NAME]    — e.g., "Kids BJJ"
[ADULT PROGRAM NAME]   — e.g., "Adult BJJ"
[ADVANCED PROGRAM NAME]— e.g., "Competition Team"
[HEAD INSTRUCTOR NAME] — e.g., "Professor John Smith"
[COACH 2 NAME]         — e.g., "Coach Maria Garcia"
[COACH 3 NAME]         — e.g., "Coach Alex Kim"
[REVIEW_COUNT]         — e.g., "247"
[STUDENT_COUNT]        — e.g., "1200"
[YEARS_COUNT]          — e.g., "12"
[ADDRESS LINE 1]       — e.g., "123 Main Street"
[HOURS]                — e.g., "Mon–Fri 9am–9pm · Sat 9am–2pm"
[SITE_URL]             — canonical URL for meta tag
[TRIAL_WEBHOOK_URL]    — Make/Zapier/GHL/n8n POST endpoint
[STARTER_KIT_WEBHOOK_URL]
[QUIZ_WEBHOOK_URL]
[FINAL_CTA_WEBHOOK_URL]
```

---

### Swap comments for images

Every photo placeholder carries a `<!-- SWAP: ... -->` comment directly above
it explaining exactly what to do. Summary:

- `.hero-bg` — add `background-image: url('hero.jpg')` and remove `.hero-img-placeholder` div
- `.program-photo` — replace div with `<img src="program-N.jpg">`
- `.instructor-photo` — replace div with `<img src="instructor.jpg">`
- `.testi-avatar` — replace div with `<img>` inside same wrapper
- `.reviewer-avatar` — replace div with Google profile thumbnail if available
- `.logo-icon` — replace with `<img src="logo.svg">`

---

### Performance notes

- **No external requests** — zero CDN calls, zero font requests, zero framework scripts
- **System font stack** — `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui` — renders instantly
- **CSS** — all inline in `<head>`, ~700 lines, no unused rules
- **JS** — single IIFE at bottom of `<body>`, ~200 lines, no jQuery, no Lodash
- **Images** — all placeholders (divs with gradient backgrounds); swap in optimized WebP/AVIF images when deploying
- **IntersectionObserver** — used for scroll-reveal and counter animation; falls back gracefully (elements made visible immediately if API unsupported)
- **Lazy loading** — add `loading="lazy"` to all `<img>` tags added during customization
- **PageSpeed target** — 99+ mobile achievable once real images are compressed and served from CDN; the HTML/CSS/JS itself adds no blocking resources

---

### Accessibility

- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<address>`)
- `aria-label` on nav, social links, modal dialogs
- `aria-modal="true"` and `aria-labelledby` on all three modals
- `aria-expanded` toggled on FAQ questions and mobile nav toggle
- Focus trapped inside modals (first input focused on open; Escape closes)
- Skip-to-content link can be added if needed (not included by default)
