# PawLens Roadmap

## Current Priority: Wet Cat Food Scraper

### What's Done
- `products_petsmart_cat_wet` table created with all 39 columns
- `products_petsmart_cat_dry` table working independently (332 products)
- API routes (`products.js`, `recommend.js`, `ingredients.js`) query correct table based on type
- Standalone scorers: `score-cat-dry.js`, `score-cat-wet.js`
- `seed.js` inserts wet food into `products_petsmart_cat_wet`, dry food untouched
- `PETSMART-PAGE-STRUCTURE.md` documents how PetSmart pages work
- Playwright 1.58.2 installed with Chromium cached
- All files renamed consistently (products-petsmart-cat-*.json, fix-cat-dry-data.js, etc.)
- Old wet food tools and data deleted — starting fresh

### What's Left

#### 1. Create `server/scripts/scrape-petsmart.js`
Build a Playwright-based scraper from scratch.

**Step 1 — Collect URLs:** Crawl PetSmart category pages (`/cat/food-and-treats/wet-food/?page=1`, etc.) via HTTP. Note which products show "X Flavors" or "X Sizes" on the category page.

**Step 2 — Visit each URL with Playwright:**
- **Load page** in headless Chromium, wait for content
- **Read page-level attributes:** name (h1), brand, flavor label, size, Item Number, image, flavor variant buttons, size variant buttons, any other visible attributes
- **Discover all tabs** dynamically — don't hardcode tab names
- **Click through every tab:** for each, click "See More" if present, capture ALL labeled sections, capture unknown fields into `extraAttributes`
- **If multiple flavors:** collect all `data-testid` attributes for flavor buttons, click each one, verify the selected label matches, then treat as a fresh data collection (re-read all page attributes, re-click all tabs, save as separate product with its own Item Number as SKU). After each click, verify the selected flavor label matches what was clicked — if not, re-read button list and retry.
- **If multiple sizes:** store in `sizeVariants` field, don't create separate entries
- **Key principle:** if PetSmart shows it, capture it. Discover fields dynamically.

**Step 3 — Validate:** coverage report for all fields, flag missing data with product URLs for manual review.

#### 2. Create `server/scripts/SCRAPING.md`
Document the Playwright scraping process for future reference and reuse (dog food, re-scrapes, other retailers).

#### 3. Run the Scrape
- Test on 10 products first, compare against PetSmart in browser
- Full scrape (~3-5 hours with rate limiting, progress saving for resume)
- Seed with `node server/seed.js`
- Score with `node server/score-cat-wet.js`

### Files to Create

| File | Purpose |
|------|---------|
| `server/scripts/scrape-petsmart.js` | Playwright-based scraper |
| `server/scripts/SCRAPING.md` | Process documentation |

### Do NOT Touch
- `server/db.js` — done
- `server/seed.js` — done
- `server/score-cat-dry.js` / `server/score-cat-wet.js` — done
- `server/routes/*` — done
- `server/data/products-petsmart-cat-dry.json` — dry food data, never modify
- `server/scripts/fix-cat-dry-data.js` — reference, don't run

### Output
Scraper writes `server/data/products-petsmart-cat-wet.json`. Seed.js reads it and inserts into `products_petsmart_cat_wet`. No fix scripts, no normalizers — if data is wrong, fix the scraper.

### Rate Limiting & Resilience
- 2-3 second delay between page loads
- 1-2 second delay between tab clicks
- 3-4 second wait after clicking a flavor variant
- Batch pause every 50 products (20 seconds)
- Save progress after every product (resume on crash)
- Retry failed pages 3x with exponential backoff

### Playwright (verified)
- Version 1.58.2, Chromium cached at `~/.cache/ms-playwright/chromium-1208`
- Tested: can load PetSmart pages, click tabs, click flavors, extract per-variant data
- Flavor buttons use stable `data-testid` attributes, order doesn't change on click

### CLI
```
node server/scripts/scrape-petsmart.js --category "cat/food-and-treats/wet-food" --output server/data/products-petsmart-cat-wet.json
node server/scripts/scrape-petsmart.js --limit 10
node server/scripts/scrape-petsmart.js --resume
```

### Verification
1. Test on 10 products — verify all tabs captured, all flavors clicked, all fields present
2. Compare against PetSmart in Chrome — manually verify every field matches
3. Coverage report — target 95%+ on all fields
4. No post-hoc fix scripts — if data is wrong, fix the scraper

### 27 Missing Products (830 vs 803)
PetSmart search shows 830, category pages show 803 unique URLs. Difference is size/flavor variants counted separately and vet diets in `/veterinary-diets/`. Investigate after initial scrape.

---

## Next: Dry Cat Food Updates
- **Item Number:** Not currently collected. Needs to be captured when dry food is re-scraped.
- **Scraper review:** The dry food data was scraped via HTML parsing (LD+JSON + RSC payloads) and processed through `fix-cat-dry-data.js`. Before any re-scrape, review these tools against the standards established for wet food — verify they capture all tab data, don't modify explicitly labeled data, and don't make assumptions.

---

## Future: Products API Expansion
- Currently accepts `type=Dry` or `type=Wet` to pick the correct table
- When adding dog food or other retailers, update to accept:
  - `species` — cat, dog (e.g. `?species=cat&type=Wet`)
  - `retailer` — petsmart, petco, chewy (e.g. `?retailer=petsmart`)
- Table naming convention (`products_petsmart_cat_wet`) already supports this — route can build table name from parameters
- Keep as one route file serving all product tables

---

## Future: Dog Food
- Reuse the same Playwright scraper with different category URLs
- Create separate tables: `products_petsmart_dog_dry`, `products_petsmart_dog_wet`
- Dog-specific scoring thresholds (different protein requirements)
- Dog-specific ingredients and red flags
- See `PETSMART-PAGE-STRUCTURE.md` for page structure (same site, same format)

---

## Future: Additional Retailers
- Petco, Chewy planned
- Each retailer gets its own table set and scraper
- Table naming: `products_[retailer]_[species]_[type]`
