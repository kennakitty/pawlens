# Future Plans

## Dry Food Updates Needed
- **Item Number:** Dry food products don't have `itemNumber` collected. This is PetSmart's unique product identifier visible on every product page. Needs to be captured when dry food is re-scraped.
- **Scraper and normalizer review:** The dry food data was originally scraped via HTML parsing (LD+JSON + RSC payloads) and processed through `fix-cat-dry-data.js` and the normalizer. Before any dry food re-scrape, review these tools against the same standards established for wet food scraping — verify they capture all tab data, don't modify explicitly labeled data, and don't make assumptions.

## Wet Food Re-scrape
- Create `scrape-petsmart.js` using Playwright to visit each page, click all tabs, click all flavor variants
- See `PETSMART-PAGE-STRUCTURE.md` for page structure reference
- Test on 10 products first, then full scrape (~3-5 hours)
- Score with `node server/score-cat-wet.js` after seeding
- Output: `server/data/products-petsmart-cat-wet.json`

## Products API Route (`server/routes/products.js`)
- Currently accepts `type=Dry` or `type=Wet` to pick the correct table
- When adding dog food or other retailers, update to accept additional parameters:
  - `species` — cat, dog (e.g. `?species=cat&type=Wet`)
  - `retailer` — petsmart, petco, chewy (e.g. `?retailer=petsmart`)
- The table naming convention (`products_petsmart_cat_wet`) already supports this — the route can build the table name from the parameters
- Keep as one route file serving all product tables rather than splitting into separate routes

## 27 Missing Products (830 vs 803)
- PetSmart search shows 830 wet food products but category pages only list 803 unique URLs
- Difference may be: size/flavor variants counted separately, vet diets in `/veterinary-diets/` subcategory
- Investigate after initial scrape to identify exactly which products are missing and why
