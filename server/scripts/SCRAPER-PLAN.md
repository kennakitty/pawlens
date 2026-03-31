# Plan: Rewrite Wet Food Scraper with Playwright

## Context
The wet food scraper needs a full rewrite. The current `scrape-petsmart.js` uses raw HTTP fetch which cannot execute JavaScript — PetSmart's product pages require JS to render tab content (Ingredients, Directions). The scraper must use Playwright to visit each page, click through all tabs, click all flavor variants, and capture everything PetSmart displays.

## What's Already Done
- `products_petsmart_cat_wet` table created with all columns (39 fields)
- `products_petsmart_cat_dry` table working independently (332 products)
- API routes (`products.js`, `recommend.js`, `ingredients.js`) query the correct table based on type
- Standalone scorers: `score-cat-dry.js`, `score-cat-wet.js`
- `seed.js` inserts wet food into `products_petsmart_cat_wet`, dry food untouched
- `PETSMART-PAGE-STRUCTURE.md` documents how PetSmart pages work
- `FUTURE-PLANS.md` documents future items (dry food item numbers, API route expansion)
- Playwright 1.58.2 installed with Chromium cached
- All files renamed consistently (products-petsmart-cat-*.json, fix-cat-dry-data.js, etc.)
- Old wet food tools deleted (fix-cat-wet-data.js, verify-cat-flavors.js, scrape-petsmart.js, SCRAPING.md)
- Old wet food data deleted from disk (products-petsmart-cat-wet*.json) — will be recreated by new scraper
- Frontend changes from this session reverted to git originals

## What's Left to Do

### 1. Create `server/scripts/scrape-petsmart.js`
Build a Playwright-based scraper from scratch. One script that handles everything:

**Step 1 — Collect URLs:** Crawl PetSmart category pages (`/cat/food-and-treats/wet-food/?page=1`, etc.) via HTTP to get all product URLs. Note which products show "X Flavors" or "X Sizes" on the category page.

**Step 2 — Visit each URL with Playwright:**

For each product page:
- **Load page** in headless Chromium, wait for content
- **Read page-level attributes:** name (h1), brand, flavor label, size, Item Number, image, flavor variant buttons, size variant buttons, any other visible attributes
- **Discover all tabs** dynamically — don't hardcode tab names
- **Click through every tab:** for each, click "See More" if present, capture ALL labeled sections (`<b>Label:</b> content` pairs), capture any unknown fields into `extraAttributes`
- **If multiple flavors:** collect all `data-testid` attributes for flavor buttons, click each one, verify the selected label matches, then treat as a fresh data collection (re-read all page attributes, re-click all tabs, save as separate product with its own Item Number as SKU)
- **If multiple sizes:** store in `sizeVariants` field, don't create separate entries
- **Key principle:** if PetSmart shows it, capture it. Discover fields dynamically.

**Step 3 — Validate:** coverage report for all fields, flag missing data with product URLs for manual review.

### 2. Rewrite `server/scripts/SCRAPING.md`
Current version references the old HTTP scraper and deleted files. Needs full rewrite to document the Playwright process.

### 3. Run the scrape
- Test on 10 products first, compare against PetSmart in browser
- Full scrape (~3-5 hours with rate limiting, progress saving for resume)
- Score with `node server/score-cat-wet.js`
- Seed with `node server/seed.js`

## Files to Modify

| File | Action |
|------|--------|
| `server/scripts/scrape-petsmart.js` | **CREATE** — Playwright-based, does not currently exist |
| `server/scripts/SCRAPING.md` | **CREATE** — document Playwright process, does not currently exist |

## Do NOT Touch
- `server/db.js` — done ✓
- `server/seed.js` — done ✓
- `server/score-cat-dry.js` / `server/score-cat-wet.js` — done ✓
- `server/routes/*` — done ✓
- `server/data/products-petsmart-cat-dry.json` — dry food data, never modify
- `server/scripts/fix-cat-dry-data.js` — reference, don't run
- `server/scripts/PETSMART-PAGE-STRUCTURE.md` — reference, done ✓
- `server/scripts/FUTURE-PLANS.md` — reference, done ✓

## Output
Scraper writes to `server/data/products-petsmart-cat-wet.json`. Seed.js reads it and inserts into `products_petsmart_cat_wet`. No fix scripts, no normalizers — if data is wrong, fix the scraper.

## Rate Limiting & Resilience
- 2-3 second delay between page loads
- 1-2 second delay between tab clicks
- 3-4 second wait after clicking a flavor variant
- Batch pause every 50 products (20 seconds)
- Save progress after every product (resume on crash)
- Retry failed pages 3x with exponential backoff

## Playwright (verified)
- Version 1.58.2, Chromium cached at `~/.cache/ms-playwright/chromium-1208`
- Tested: can load PetSmart pages, click tabs, click flavors, extract per-variant data
- Flavor buttons use stable `data-testid` attributes, order doesn't change on click

## CLI
```
node server/scripts/scrape-petsmart.js --category "cat/food-and-treats/wet-food" --output server/data/products-petsmart-cat-wet.json
node server/scripts/scrape-petsmart.js --limit 10
node server/scripts/scrape-petsmart.js --resume
```

## Verification
1. Test on 10 products — verify all tabs captured, all flavors clicked, all fields present
2. Compare against PetSmart in Chrome — manually verify every field matches
3. Coverage report — target 95%+ on all fields
4. No post-hoc fix scripts — if data is wrong, fix the scraper

## 27 Missing Products (830 vs 803)
PetSmart search shows 830, category pages show 803 unique URLs. Difference is size/flavor variants counted separately and vet diets in `/veterinary-diets/`. Investigate after initial scrape.
