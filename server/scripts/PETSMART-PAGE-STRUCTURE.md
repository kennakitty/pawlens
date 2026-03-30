# PetSmart Product Page Structure

Reference for scraping PetSmart product pages. Verified 2026-03-30.

## Tabs
- Pages have a tabbed interface: **Description**, **Ingredients**, **Directions** (and possibly others)
- Only the default tab content is in the raw HTML. Other tabs require JavaScript to render — must use Playwright or similar browser automation to click and read them.
- Each tab may have a **"See More" / "Show More"** button that needs clicking to expand hidden content.
- Not all products have the same tabs. Discover tabs dynamically, don't hardcode.

## Data Locations

### Always visible (no tab clicking needed)
- **Product name:** `<h1>` tag
- **Flavor:** Label under the title, class `variants-fieldset__legend-value`
- **Size:** Same area as flavor
- **Flavor variant buttons:** `[data-testid^="variant-base-flavor-"]` with text in `.variant-base__label-text`
- **Size variant buttons:** `[data-testid^="variant-base-size-"]`

### In RSC JSON (in page HTML, no JS needed but unreliable/incomplete)
- **Brand:** `"brand":"Fancy Feast"` (simple string) or `"brand":{"@type":"Brand","name":"..."}`
- **Image:** `"image":"https://s7d2.scene7.com/is/image/PetSmart/..."`
- **Life stage:** `"catLifestages":["Adult"]`
- **Food texture:** `"foodTextures":["Pate"]`
- **Health considerations:** `"customHealthConsideration":["General Health"]`

### Behind Ingredients tab (requires JS/Playwright click)
- Full ingredient list
- Guaranteed Analysis
- Caloric Content
- AAFCO statement (if present)

### Behind Directions tab (requires JS/Playwright click)
- Feeding Instructions / Directions

### Behind Description tab (default tab, usually visible)
- Description text
- Features & Benefits / Key Benefits
- Labeled attributes: Brand, Food Type, Life Stage, Breed Size, Weight, Item Number, Species, Health Consideration, Nutritional Option/Benefits, Flavor, etc.

## Flavor Variants
- Buttons have stable `data-testid` attributes (e.g. `variant-base-flavor-beef`)
- The button order does NOT change when clicking a different flavor (verified on Fancy Feast 12 flavors and Nulo 3 flavors)
- Clicking a flavor changes: selected flavor label, Item Number, image, and ALL tab content (ingredients, GA, calories, directions)
- The URL does NOT change when clicking a flavor — only page content updates via JavaScript
- Each flavor = separate product with its own Item Number

## Item Number vs URL SKU
- **Item Number:** Visible on page as text, changes per flavor variant. This is the per-variant unique identifier.
- **URL SKU:** The number at the end of the URL (e.g. `-12865.html`) is the master product ID. Multiple flavors share the same URL. Do NOT use this as the per-variant SKU.

## Category Pages
- Wet food: `https://www.petsmart.com/cat/food-and-treats/wet-food/?page=1`
- ~40 products per page, paginated (~21 pages for wet food)
- Shows "X Flavors" and "X Sizes" under each product card — use this to identify which products need variant scraping
- 803 unique URLs from category pages, PetSmart search shows 830 — difference is size/flavor variants counted separately and vet diets in `/veterinary-diets/` subcategory

## What Does NOT Work
- Raw HTTP fetch (curl/fetch without browser) — only gets the default tab content and RSC data. Does NOT get Ingredients, Directions, or flavor-variant-specific data.
- Algolia API — returns incomplete/inaccurate data. Never use for product data collection.
- Parsing RSC streaming chunks — the chunk regex captures reference data, not product content.
