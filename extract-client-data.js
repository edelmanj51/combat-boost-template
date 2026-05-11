#!/usr/bin/env node
/**
 * extract-client-data.js
 *
 * Visits a martial arts school's website and extracts all data needed to
 * populate the combat-boost-template. Outputs client-data.json with keys
 * matching the exact bracket tokens used in index.html.
 *
 * Usage:
 *   node extract-client-data.js <URL>
 *   node extract-client-data.js https://www.example-martial-arts.com
 *
 * Requires:
 *   npm install puppeteer
 */

'use strict';

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const targetUrl = process.argv[2];

if (!targetUrl || !targetUrl.startsWith('http')) {
  console.error('Usage: node extract-client-data.js <URL>');
  console.error('Example: node extract-client-data.js https://www.example-ma.com\n');
  process.exit(1);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🚀 Starting extraction...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`⏳ Loading ${targetUrl} ...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    // Scroll to trigger lazy-loaded content, then return to top
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise(r => setTimeout(r, 900));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));

    console.log('🔍 Extracting data...\n');

    const extracted = await page.evaluate(() => {

      // ── Helpers ────────────────────────────────────────────────

      function getText(selectors) {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel);
            const t = el && el.textContent.trim();
            if (t && t.length > 0) return t;
          } catch (_) {}
        }
        return '';
      }

      function getAttr(selectors, attr) {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel);
            const v = el && el.getAttribute(attr);
            if (v) return v;
          } catch (_) {}
        }
        return '';
      }

      function resolveUrl(src) {
        if (!src) return '';
        try { return new URL(src, window.location.href).href; } catch (_) { return src; }
      }

      function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
        const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return rgb;
        return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
      }

      function firstSection(candidates) {
        for (const sel of candidates) {
          try {
            const el = document.querySelector(sel);
            if (el) return el;
          } catch (_) {}
        }
        return null;
      }

      // Parse all JSON-LD blocks, unwrap @graph arrays
      function getStructuredData() {
        return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .flatMap(s => {
            try {
              const parsed = JSON.parse(s.textContent);
              return parsed['@graph'] ? parsed['@graph'] : [parsed];
            } catch (_) { return []; }
          });
      }

      // Best-effort image label from alt, src path, and surrounding section
      function guessLabel(img, sectionId, sectionClass) {
        const alt    = (img.getAttribute('alt') || '').toLowerCase();
        const src    = (img.getAttribute('src') || img.getAttribute('data-src') || '').toLowerCase();
        const combo  = `${alt} ${src} ${sectionId} ${sectionClass}`;
        if (/logo/.test(combo))                                             return 'logo';
        if (/hero|banner|bg[-_]?img|background/.test(combo))               return 'hero-image';
        if (/owner|founder|instructor|coach|teacher|sensei|master|professor|staff|team/.test(combo)) return 'instructor-photo';
        if (/kid|child|junior|little.?dragon|youth|young|boy|girl/.test(combo)) return 'kids-class';
        if (/(adult|teen).*(class|train|spar|kick|punch)/.test(combo))     return 'adult-class';
        if (/bjj|jiu.?jitsu|grappl|ground/.test(combo))                   return 'bjj-class';
        if (/mma|mixed.?martial/.test(combo))                              return 'mma-class';
        if (/facilit|gym|dojo|floor|mat|building|exterior|interior|location/.test(combo)) return 'facility';
        if (/spar|fight|kick|punch|compet|tournament/.test(combo))         return 'action';
        if (/belt|ceremony|graduation|promotion|rank/.test(combo))         return 'belt-ceremony';
        if (/class|train|student/.test(combo))                             return 'class-photo';
        return 'photo';
      }

      // Nearby text for human labeling review
      function nearbyText(el, maxLen) {
        const parent = el.closest('section, article, header, footer') || el.parentElement;
        if (!parent) return '';
        return parent.textContent.replace(/\s+/g, ' ').trim().substring(0, maxLen || 120);
      }

      // ── Structured data ───────────────────────────────────────

      const sd     = getStructuredData();
      const bizTypes = ['LocalBusiness', 'SportsActivityLocation', 'MartialArtsSchool',
                        'HealthAndBeautyBusiness', 'Organization', 'Corporation'];
      let biz = {};
      for (const t of bizTypes) {
        biz = sd.find(d => String(d['@type'] || '').includes(t)) || {};
        if (biz.name) break;
      }
      const ldAddr   = biz.address || {};
      const ldRating = biz.aggregateRating ||
                       sd.find(d => d['@type'] === 'AggregateRating') || {};

      const out = {};

      // ── School identity ───────────────────────────────────────

      out['[SCHOOL NAME]'] =
        biz.name ||
        getAttr(['meta[property="og:site_name"]', 'meta[name="application-name"]'], 'content') ||
        getText(['.logo-text', '#logo span', '.navbar-brand', '.site-title', '.brand-name']) ||
        document.title.split(/[|–\-—]/)[0].trim();

      out['[SITE_URL]'] = window.location.origin;

      // ── Contact ───────────────────────────────────────────────

      out['[ADDRESS LINE 1]'] =
        ldAddr.streetAddress ||
        getText(['[itemprop="streetAddress"]', '.address-street', '[class*="street"]']);

      out['[CITY]'] =
        ldAddr.addressLocality ||
        getText(['[itemprop="addressLocality"]', '.address-city', '[class*="city"]']);

      out['[STATE]'] =
        ldAddr.addressRegion ||
        getText(['[itemprop="addressRegion"]', '.address-state', '[class*="state"]']);

      out['[ZIP]'] =
        ldAddr.postalCode ||
        getText(['[itemprop="postalCode"]', '.address-zip', '[class*="postal"]']);

      const telEl = document.querySelector('a[href^="tel:"]');
      out['[PHONE]'] =
        biz.telephone ||
        (telEl ? (telEl.textContent.trim() || telEl.getAttribute('href').replace(/^tel:/, '')) : '') ||
        getText(['[itemprop="telephone"]', '.phone', '[class*="phone-number"]']);

      const mailEl = document.querySelector('a[href^="mailto:"]');
      out['[EMAIL]'] =
        biz.email ||
        (mailEl ? mailEl.getAttribute('href').replace(/^mailto:/, '').split('?')[0] : '') ||
        getText(['[itemprop="email"]', '.email', '[class*="email-address"]']);

      // ── Hours ─────────────────────────────────────────────────

      const ldHours = biz.openingHours;
      if (Array.isArray(ldHours))       out['[HOURS]'] = ldHours.join(' · ');
      else if (typeof ldHours === 'string') out['[HOURS]'] = ldHours;
      else out['[HOURS]'] = getText([
        '[itemprop="openingHours"]', '[class*="hours"]',
        '[class*="schedule"] time', 'address'
      ]);

      // ── Founding year ─────────────────────────────────────────

      const rawYear = biz.foundingDate || biz.foundingYear || '';
      const yearMatch = String(rawYear).match(/\d{4}/);
      if (yearMatch) {
        out['[YEAR]'] = yearMatch[0];
      } else {
        const bodyText = document.body.textContent;
        const m = bodyText.match(/(?:founded|established|since|est\.?)\s+(?:in\s+)?(\d{4})/i);
        out['[YEAR]'] = m ? m[1] : '';
      }
      out['[YEARS_COUNT]'] = out['[YEAR]']
        ? String(new Date().getFullYear() - parseInt(out['[YEAR]'], 10))
        : '';

      // ── Martial art ───────────────────────────────────────────

      const artList = [
        'Brazilian Jiu-Jitsu', 'Jiu-Jitsu', 'BJJ', 'Taekwondo', 'Tang Soo Do',
        'Muay Thai', 'Karate', 'Kickboxing', 'Boxing', 'Judo', 'Wrestling',
        'MMA', 'Mixed Martial Arts', 'Kung Fu', 'Krav Maga', 'Aikido', 'Hapkido'
      ];
      const bodyRaw = document.body.textContent;
      out['[MARTIAL ART]'] = artList.find(a => bodyRaw.includes(a)) || '';

      // ── Hero ──────────────────────────────────────────────────

      const heroEl = firstSection([
        '#hero', '.hero', '[class*="hero"]', '[class*="banner"]',
        '.jumbotron', 'header.page-header', '.intro-section'
      ]);
      const heroH = heroEl ? heroEl.querySelector('h1, h2') : document.querySelector('main h1, h1');
      out['[HERO HEADLINE]'] = heroH ? heroH.textContent.trim() : '';

      const heroSubEl = heroEl
        ? heroEl.querySelector('p, h2:not(h1), h3, [class*="sub"], [class*="tagline"]')
        : null;
      out['[HERO SUBHEADLINE]'] = heroSubEl ? heroSubEl.textContent.trim() : (
        getAttr(['meta[name="description"]', 'meta[property="og:description"]'], 'content')
      );

      // ── School tagline (footer / about blurb) ─────────────────

      out['[SCHOOL TAGLINE]'] = getText([
        'footer .about p', 'footer [class*="brand"] p', 'footer [class*="col"]:first-child p',
        '[class*="about-text"] p', '[class*="mission"] p', '[class*="intro"] p'
      ]) || getAttr(['meta[name="description"]'], 'content') || '';

      // ── Social proof ──────────────────────────────────────────

      out['[STAR_RATING]'] = String(ldRating.ratingValue || ldRating.bestRating || '');
      out['[REVIEW_COUNT]'] = String(ldRating.reviewCount || ldRating.ratingCount || '');
      out['[STUDENT_COUNT]'] = '';  // Rarely public — confirm with client

      // ── Programs ──────────────────────────────────────────────

      const programs = [];
      const progSec = firstSection([
        '#programs', '.programs', '[id*="program"]', '[class*="programs"]',
        '[class*="classes"]', '[id*="classes"]', '[class*="offerings"]', '[id*="offerings"]'
      ]);
      if (progSec) {
        progSec.querySelectorAll('article, .card, [class*="program-card"], [class*="class-card"], [class*="item"]')
          .forEach(card => {
            const h = card.querySelector('h2, h3, h4, [class*="title"], [class*="name"]');
            const p = card.querySelector('p, [class*="desc"]');
            const t = h && h.textContent.trim();
            if (t && t.length > 1 && t.length < 80) {
              programs.push({ name: t, description: p ? p.textContent.trim() : '' });
            }
          });
      }
      // Fallback: nav submenu links
      if (programs.length === 0) {
        document.querySelectorAll('nav [class*="dropdown"] a, nav .submenu a, nav ul ul a').forEach(a => {
          const t = a.textContent.trim();
          if (t.length > 2 && t.length < 60) programs.push({ name: t, description: '' });
        });
      }

      out['_programs']         = programs;
      out['[PROGRAM 1 NAME]']  = programs[0]?.name || '';
      out['[PROGRAM 2 NAME]']  = programs[1]?.name || '';

      // ── Instructors ───────────────────────────────────────────

      const instructors = [];
      const instrSec = firstSection([
        '#instructors', '#team', '#staff', '#coaches',
        '[class*="instructor"]', '[class*="our-team"]', '[class*="staff-section"]',
        '[class*="coaches"]', '[id*="team"]', '[id*="staff"]'
      ]);
      if (instrSec) {
        instrSec.querySelectorAll(
          'article, .card, [class*="instructor-card"], [class*="team-card"], ' +
          '[class*="member"], [class*="person"], [class*="coach-card"]'
        ).forEach(card => {
          const nameEl  = card.querySelector('h2, h3, h4, [class*="name"]');
          const titleEl = card.querySelector('[class*="title"], [class*="rank"], [class*="role"], [class*="position"]');
          const bioEl   = card.querySelector('p, [class*="bio"], [class*="desc"]');
          const imgEl   = card.querySelector('img');
          if (nameEl && nameEl.textContent.trim()) {
            instructors.push({
              name:      nameEl.textContent.trim(),
              title:     titleEl ? titleEl.textContent.trim() : '',
              bio:       bioEl   ? bioEl.textContent.trim()   : '',
              photo_url: imgEl   ? resolveUrl(imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '') : ''
            });
          }
        });
      }

      out['_instructors']      = instructors;
      out['[HEAD COACH NAME]'] = instructors[0]?.name  || '';
      out['[TITLE / RANK]']    = instructors[0]?.title || '';
      out['[BIO]']             = instructors[0]?.bio   || '';

      // ── Testimonials ──────────────────────────────────────────

      const testimonials = [];
      const testiSec = firstSection([
        '[class*="testimonial"]', '[id*="testimonial"]',
        '[class*="reviews-section"]', '[id*="reviews"]', '[class*="quotes"]'
      ]);
      if (testiSec) {
        testiSec.querySelectorAll(
          'article, blockquote, .card, [class*="testimonial-card"], ' +
          '[class*="review-card"], [class*="quote-card"], [class*="item"]'
        ).forEach(card => {
          if (testimonials.length >= 4) return;
          const qEl = card.querySelector('p, blockquote, [class*="text"], [class*="quote"], [class*="body"]');
          const nEl = card.querySelector('[class*="name"], [class*="author"], cite, strong, [class*="customer"]');
          const rEl = card.querySelector('[class*="role"], [class*="title"], [class*="label"], [class*="position"]');
          const text = qEl ? qEl.textContent.trim().replace(/^["'"«]+|["'"»]+$/g, '') : '';
          if (text.length > 20) {
            testimonials.push({
              quote: text,
              name:  nEl ? nEl.textContent.trim() : '',
              role:  rEl ? rEl.textContent.trim() : ''
            });
          }
        });
      }

      out['_testimonials'] = testimonials;
      for (let i = 0; i < 3; i++) {
        const n = i + 1;
        const t = testimonials[i] || {};
        out[`[TESTIMONIAL ${n} NAME]`] = t.name  || '';
        out[`[TESTIMONIAL ${n} QUOTE]`] = t.quote || '';
        out[`[TESTIMONIAL ${n} ROLE]`]  = t.role  || '';
        out[`[T${n} INITIAL]`]          = t.name  ? t.name[0].toUpperCase() : '';
      }

      // ── Google reviews (visible cards on page) ────────────────

      const reviews = [];
      document.querySelectorAll(
        '[class*="review-card"], [class*="google-review"], ' +
        '[itemtype*="Review"], [class*="review-item"]'
      ).forEach(card => {
        if (reviews.length >= 4) return;
        const nEl = card.querySelector('[class*="name"], [class*="author"], [itemprop="author"]');
        const tEl = card.querySelector('[class*="text"], [class*="body"], p, [itemprop="reviewBody"]');
        const dEl = card.querySelector('[class*="date"], time');
        const text = tEl ? tEl.textContent.trim().replace(/^["'"«]+|["'"»]+$/g, '') : '';
        if (text.length > 10) {
          reviews.push({
            name: nEl ? nEl.textContent.trim() : '',
            text,
            date: dEl ? dEl.textContent.trim() : ''
          });
        }
      });

      out['_google_reviews'] = reviews;
      for (let i = 0; i < 4; i++) {
        const n = i + 1;
        const r = reviews[i] || {};
        out[`[REVIEWER ${n} NAME]`] = r.name || '';
        out[`[REVIEW ${n} TEXT]`]   = r.text || '';
        out[`[REVIEW ${n} DATE]`]   = r.date || '';
        out[`[R${n}]`] = r.name ? r.name[0].toUpperCase() : '';
      }

      // ── Social links ──────────────────────────────────────────

      const social = { facebook: '', instagram: '', youtube: '', tiktok: '', twitter: '', yelp: '' };
      document.querySelectorAll('a[href]').forEach(a => {
        const h = a.getAttribute('href') || '';
        if (!social.facebook  && h.includes('facebook.com'))  social.facebook  = h;
        if (!social.instagram && h.includes('instagram.com')) social.instagram = h;
        if (!social.youtube   && h.includes('youtube.com'))   social.youtube   = h;
        if (!social.tiktok    && h.includes('tiktok.com'))    social.tiktok    = h;
        if (!social.twitter   && (h.includes('twitter.com') || h.includes('/x.com/'))) social.twitter = h;
        if (!social.yelp      && h.includes('yelp.com'))      social.yelp      = h;
      });

      out['[FACEBOOK_URL]']  = social.facebook;
      out['[INSTAGRAM_URL]'] = social.instagram;
      out['[YOUTUBE_URL]']   = social.youtube;
      out['[TIKTOK_URL]']    = social.tiktok;
      out['_other_social']   = Object.entries(social)
        .filter(([k, v]) => !['facebook', 'instagram', 'youtube', 'tiktok'].includes(k) && v)
        .map(([platform, url]) => ({ platform, url }));

      // ── Brand colors ──────────────────────────────────────────

      const colors = {};
      const rootCSS = getComputedStyle(document.documentElement);
      const cssVarNames = [
        '--primary', '--secondary', '--accent', '--color-primary', '--color-secondary',
        '--color-accent', '--brand-color', '--main-color', '--theme-color',
        '--primary-color', '--secondary-color', '--accent-color',
        '--red', '--blue', '--gold', '--green', '--orange',
        '--dark', '--light', '--white', '--black',
        '--font-color', '--heading-color', '--link-color', '--bg-color'
      ];
      cssVarNames.forEach(v => {
        const val = rootCSS.getPropertyValue(v).trim();
        if (val) colors[v] = val;
      });

      const samplers = [
        { sel: 'header, nav, .header, #header',              label: 'header_bg',          prop: 'backgroundColor' },
        { sel: '.btn-primary, [class*="btn-primary"], .cta',  label: 'primary_button_bg',  prop: 'backgroundColor' },
        { sel: '.btn-primary, [class*="btn-primary"], .cta',  label: 'primary_button_text',prop: 'color' },
        { sel: 'h1, [class*="hero"] h1',                      label: 'h1_color',           prop: 'color' },
        { sel: 'footer, #footer',                             label: 'footer_bg',          prop: 'backgroundColor' },
        { sel: 'a:not([class])',                              label: 'link_color',         prop: 'color' },
        { sel: 'body',                                        label: 'body_bg',            prop: 'backgroundColor' }
      ];
      samplers.forEach(({ sel, label, prop }) => {
        try {
          const el = document.querySelector(sel);
          if (el) {
            const hex = rgbToHex(getComputedStyle(el)[prop]);
            if (hex) colors[label] = hex;
          }
        } catch (_) {}
      });

      out['_brand_colors'] = colors;

      // ── Images ────────────────────────────────────────────────

      const images  = [];
      const seenUrls = new Set();

      // 1. All <img> tags
      document.querySelectorAll('img').forEach(img => {
        const raw = img.getAttribute('src') || img.getAttribute('data-src') ||
                    img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
        if (!raw || raw.startsWith('data:') || raw.length < 4) return;
        const url = resolveUrl(raw);
        if (seenUrls.has(url)) return;
        seenUrls.add(url);

        const sec    = img.closest('section, header, footer') || img.parentElement;
        const secId  = sec ? (sec.id || '') : '';
        const secCls = sec ? (sec.className || '').split(/\s+/).slice(0, 3).join(' ') : '';

        images.push({
          url,
          alt:          img.getAttribute('alt') || '',
          label:        guessLabel(img, secId, secCls),
          section_id:   secId,
          section_class: secCls,
          nearby_text:  nearbyText(img, 120)
        });
      });

      // 2. CSS background-image on prominent sections
      const bgSelectors = [
        '#hero', '.hero', '[class*="hero"]', '[class*="banner"]',
        '[class*="cta"]', 'header', 'section'
      ];
      bgSelectors.forEach(sel => {
        try {
          document.querySelectorAll(sel).forEach(el => {
            const bg = getComputedStyle(el).backgroundImage;
            if (!bg || bg === 'none') return;
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (!m) return;
            const url = resolveUrl(m[1]);
            if (!url || seenUrls.has(url) || url.includes('gradient') || url.includes('data:')) return;
            seenUrls.add(url);
            images.push({
              url,
              alt:           '',
              label:         guessLabel({ getAttribute: () => url }, el.id || '', el.className || ''),
              section_id:    el.id || '',
              section_class: (el.className || '').split(/\s+/).slice(0, 3).join(' '),
              nearby_text:   '(CSS background-image)',
              is_css_background: true
            });
          });
        } catch (_) {}
      });

      out['_images'] = images;

      // Specific token shortcuts for the two most important images
      const logoImg = document.querySelector(
        '.logo img, #logo img, header .brand img, .navbar-brand img, ' +
        '[class*="logo"] img, [id*="logo"] img'
      );
      out['[LOGO_IMAGE]'] = logoImg
        ? resolveUrl(logoImg.getAttribute('src') || logoImg.getAttribute('data-src') || '')
        : '';

      const heroBgEl = document.querySelector('#hero, .hero, [class*="hero"], [class*="banner"]');
      if (heroBgEl) {
        const bgStyle = getComputedStyle(heroBgEl).backgroundImage;
        const bgMatch = bgStyle && bgStyle !== 'none' ? bgStyle.match(/url\(["']?([^"')]+)["']?\)/) : null;
        out['[HERO_IMAGE]'] = bgMatch
          ? resolveUrl(bgMatch[1])
          : resolveUrl((heroBgEl.querySelector('img') || { getAttribute: () => '' })
              .getAttribute('src') || '');
      } else {
        out['[HERO_IMAGE]'] = '';
      }

      // ── Manual-only tokens (no auto-fill) ────────────────────

      out['[GOOGLE_MAPS_EMBED_URL]']   = '';  // Get from Google Maps → Share → Embed a map
      out['[TRIAL_WEBHOOK_URL]']        = '';  // Set up in GHL, then paste here
      out['[STARTER_KIT_WEBHOOK_URL]']  = '';  // Set up in GHL, then paste here
      out['[QUIZ_WEBHOOK_URL]']         = '';  // Set up in GHL, then paste here
      out['[FINAL_CTA_WEBHOOK_URL]']    = '';  // Set up in GHL, then paste here
      out['[BOOKING_CALENDAR_URL]']     = '';  // GHL calendar widget URL

      return out;
    }); // end page.evaluate

    await browser.close();

    // ── Build final JSON ────────────────────────────────────────

    const output = {
      _meta: {
        source_url:   targetUrl,
        extracted_at: new Date().toISOString(),
        instructions: [
          'Review every field — extraction is best-effort and may miss or misread content.',
          'Fields starting with _ are arrays/objects for reference (not direct template tokens).',
          'Webhook tokens must be filled in after GHL is configured.',
          '[GOOGLE_MAPS_EMBED_URL]: Google Maps → Share → Embed a map → copy iframe src.',
          '[STUDENT_COUNT]: usually not public — confirm with client.',
          '[LOGO_IMAGE] and [HERO_IMAGE]: download and rename the detected images, ' +
            'then update to relative paths like images/logo.png and images/hero.webp.',
          'Use _images to review all found images; check label and nearby_text to identify each.'
        ]
      },
      ...extracted
    };

    const outPath = path.join(process.cwd(), 'client-data.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

    // ── Console summary ─────────────────────────────────────────

    const e = extracted;
    console.log('─'.repeat(54));
    console.log('✅  Extraction complete\n');
    console.log(`📁  Saved: ${outPath}\n`);
    console.log('📋  Results:');
    console.log(`    School Name    ${e['[SCHOOL NAME]']     || '(not found)'}`);
    console.log(`    City           ${e['[CITY]']            || '(not found)'}`);
    console.log(`    State          ${e['[STATE]']           || '(not found)'}`);
    console.log(`    Phone          ${e['[PHONE]']           || '(not found)'}`);
    console.log(`    Email          ${e['[EMAIL]']           || '(not found)'}`);
    console.log(`    Founded        ${e['[YEAR]']            || '(not found)'}`);
    console.log(`    Martial Art    ${e['[MARTIAL ART]']     || '(not found)'}`);
    console.log(`    Star Rating    ${e['[STAR_RATING]']     || '(not found)'}`);
    console.log(`    Review Count   ${e['[REVIEW_COUNT]']    || '(not found)'}`);
    console.log(`    Programs       ${(e['_programs']     || []).length} found`);
    console.log(`    Instructors    ${(e['_instructors']  || []).length} found`);
    console.log(`    Testimonials   ${(e['_testimonials'] || []).length} found`);
    console.log(`    Images         ${(e['_images']       || []).length} found`);
    console.log(`    Social links   ${[e['[FACEBOOK_URL]'], e['[INSTAGRAM_URL]'], e['[YOUTUBE_URL]'], e['[TIKTOK_URL]']].filter(Boolean).length}/4 found`);

    const emptyRequired = [
      '[SCHOOL NAME]', '[CITY]', '[STATE]', '[ZIP]',
      '[ADDRESS LINE 1]', '[PHONE]', '[EMAIL]', '[HOURS]'
    ].filter(k => !e[k]);
    if (emptyRequired.length > 0) {
      console.log(`\n⚠️   Empty — fill in manually:`);
      emptyRequired.forEach(k => console.log(`    ${k}`));
    }

    console.log('\n🔧  Requires manual input after GHL setup:');
    ['[STUDENT_COUNT]', '[GOOGLE_MAPS_EMBED_URL]', '[TRIAL_WEBHOOK_URL]',
     '[STARTER_KIT_WEBHOOK_URL]', '[QUIZ_WEBHOOK_URL]',
     '[FINAL_CTA_WEBHOOK_URL]', '[BOOKING_CALENDAR_URL]']
      .forEach(k => console.log(`    ${k}`));

    console.log('');

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    if (err.message && err.message.includes('Cannot find module')) {
      console.error('\n❌  puppeteer not installed. Run:\n\n    npm install puppeteer\n');
    } else {
      console.error('\n❌  Error:', err.message);
    }
    process.exit(1);
  }
}

run();
