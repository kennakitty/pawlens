# CLAUDE.md — PawLens Project Context

## Project Overview
PawLens is a cat food transparency and comparison platform being built for Kenna. The core value proposition is cutting through misleading pet food marketing and packaging to help cat owners find the best food for their specific cat's needs. Starting with PetSmart dry cat food, expanding to wet food, then Petco and Chewy.

## Kenna's Background
- First-time business/website builder
- Has experience with community management (SheFi, 10,000+ member community)
- Has education background (makes complex info accessible)
- Has coded a Discord bot and deployed via GitHub before
- Located in Tigard, Oregon
- Owns two senior cats (details below)

## Kenna's Cats (Test Case)
- **Cat A:** Large breed, 12 years old, healthy weight, needs muscle maintenance
- **Cat B:** Mixed breed, 11 years old, ~2 lbs overweight, mobility issues (struggles to jump, walks slowly)
- **Shared environment:** Semi-indoor/outdoor, temperature-controlled shed
- **Activity level:** Very low movement for both
- **Preferences:** Both prefer "big crunch" kibble and firm pates
- **Previous food:** Crave (caused mining behavior due to 18% fat and tapioca starch) and Hill's Science Diet Vitality (heavy grains, not enough fiber, constant begging)
- **Kenna already mixes dry foods** — has been doing this for years. This is creative but most pet owners wouldn't think of it. PawLens should proactively suggest strategies like this.

## Origin Story (Marketing Asset)
Kenna used Gemini AI to research her cats' food and discovered she'd been making wrong choices for years due to misleading labels and packaging. The Gemini experience itself was frustrating — recommendations shifted without explanation, outputs were inconsistent between sessions, and early answers were too generic. PawLens solves BOTH problems: misleading labels AND bad AI experiences.

## Key Design Principles
1. **AI must think outside the box** — proactively suggest creative feeding strategies (mixing foods, rotation feeding, microchip-activated feeders for multi-cat households, timed feeders, puzzle feeders)
2. **Multiple options upfront** — don't wait for user to ask, present several approaches so they can think creatively
3. **Never shift recommendations without explanation** — if something changes, say why
4. **Personalized, not generic** — every response should feel written for THIS person's cat(s)
5. **Handle multi-cat households** — this is a common real-world complexity most tools ignore
6. **Personalized ingredient flags** — same ingredient can be green/yellow/red depending on the specific cat's needs (e.g., high fat is bad for overweight cats but fine for underweight ones)
7. **No-nonsense trust-first brand** — cut through BS, educate don't preach

## Tech Stack
- **Frontend:** React (JSX)
- **Database:** SQLite (chosen so we don't have to migrate later when adding more products)
- **AI Model:** Use OpenRouter for flexible model switching — cheapest/best model at any time, not locked to one provider. Claude Haiku is current recommendation for cost/quality balance.
- **Hosting:** Replit (easy updates without redeploy cycles, built-in version control)
- **Data file:** Separate from app code so products can be updated independently

## Feature Priority (in order)
1. Customer textbox input about their cat → AI personalized recommendations and avoids
2. Ingredient and label decoding page (general knowledge)
3. Price comparison and shipping/autoship options from retailers
4. Filtering options to browse all food in database (not just AI recommendations)
5. Red flags and recalls page (general knowledge)

## Features for Later (flagged but not yet implemented)
- Upload vet docs for better recommendations
- Scientific data backing
- Customer reviews (with caveat that reviews can be misleading — based on preference not science)
- Monetization: affiliate links, sponsored content, premium features, digital products, display ads
- Personalized green/yellow/red flag system based on each cat's profile

## Current State of Build
- **Prototype exists** as a React JSX artifact (PawLens.jsx) with:
  - Home page with brand messaging
  - AI recommendation page with textbox input
  - Browse all foods page with filtering (brand, life stage, sort by score/protein/fat)
  - Product detail pages with transparency scores, nutritional breakdown, ingredients
  - Ingredient decoder with 16 common ingredients
  - Red flags page with 8 label tricks
  - 16 AI-generated product entries (NOT yet verified against real PetSmart data)
- **Product data is currently hardcoded** — needs to move to SQLite
- **Admin panel not yet built** — needed for adding/editing/deleting products
- **AI recommendations use Claude API** via Anthropic endpoint in artifacts

## Data Collection Status
- PetSmart dry cat food page has 332 products
- Successfully extracted structured data (names, brands, prices, SKUs) from PetSmart's LD+JSON for first 40 products
- Started pulling individual product pages via Chrome for detailed ingredients/guaranteed analysis
- Was in the process of pulling Purina Pro Plan Vital Systems page when chat migrated
- Open Pet Food Facts API exists (10,000+ products) but was blocked from web_fetch; could be accessed via browser

## Data Collection Strategy
- Use Chrome browser to navigate PetSmart product pages and extract:
  - Full ingredient lists
  - Guaranteed analysis (protein %, fat %, fiber %, moisture %)
  - Calories per cup
  - All available sizes and prices
  - AAFCO statements
  - Autoship discount percentages
  - Review count and average rating
  - Available shipping/pickup options
- Focus on top brands first: Purina (Pro Plan, ONE, Cat Chow), Hill's Science Diet, Nulo, Royal Canin, Blue Buffalo, Wellness, Instinct, IAMS, Simply Nourish, Crave
- Claude is responsible for verifying ALL data accuracy — Kenna should not have to check data
- Product URLs found on PetSmart listing page (39 URLs extracted from first page load)

## PetSmart Product Page Data Extraction Method
```javascript
// Extract LD+JSON structured data from product pages
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
scripts.forEach(s => {
  const parsed = JSON.parse(s.textContent);
  if (parsed['@type'] === 'Product') {
    // Contains: name, sku, brand, price, rating, review count, gtin13
  }
});
// Ingredients and guaranteed analysis are further down the page — need to scroll and extract from DOM
```

## Roles and Responsibilities
**Claude does:**
- Build entire PawLens app with SQLite database
- Build admin panel for managing products
- Pull and VERIFY product data from PetSmart
- Design AI prompting and recommendation logic
- Write scraping scripts for future data updates
- Provide step-by-step Replit deployment instructions

**Kenna does:**
- Create Replit account
- Follow copy/paste instructions to deploy
- Use it with her cats and provide feedback
- That's it

## Next Steps (Phase 1)
1. Build complete app with SQLite backend (replace hardcoded data)
2. Build admin panel for product management
3. Continue pulling verified product data from PetSmart via Chrome
4. Get Kenna set up on Replit with step-by-step instructions

## Next Steps (Phase 2)
- Verify and expand product database with real PetSmart data
- Implement personalized ingredient flagging (green/yellow/red per cat profile)
- Polish AI recommendation prompts based on Kenna's testing feedback

## Next Steps (Phase 3)
- Add wet food products
- Add Petco and Chewy retailers
- Implement price monitoring/update scripts
- Build monetization (affiliate links)

## Marketing Asset Bank
Save anything Kenna mentions that could be used for marketing:
- "I realized I'd been making the wrong choices for my cats because of misleading labels and fancy packaging"
- "Everyone wants what is best for their pets"
- "A no-nonsense approach to finding the best for each pet's needs"
- "So many choices and considerations... how many wrong choices I have been making"
- "Thinking that the ones I buy have actually been the best because of the packaging and misleading labeling or branding"
- Frustrating Gemini experience: inconsistent recommendations, generic answers, shifting suggestions without explanation
- The microchip-activated feeder idea as an example of creative thinking PawLens should do
- Already was mixing dry foods for years before most people would consider it
- Educator background = can make complex nutrition accessible
- Community management experience (SheFi 10k+ members) = knows how to build trust at scale

## Name Ideas (Not Finalized)
Current working name: **PawLens**
Other favorites from brainstorm: Flip The Bag, No Filler, Paw Intel, Pawprint Decoded

## Files Created
- `/mnt/user-data/outputs/CatFoodPlatform_ProjectRoadmap.docx` — comprehensive 19-section business roadmap document
- `/mnt/user-data/outputs/PawLens.jsx` — working React prototype (needs SQLite migration)

## Important Notes
- Kenna has never built a business or website before — explain everything simply
- She doesn't want formal/corporate tone — keep it conversational and practical
- She values creative, outside-the-box thinking over standard approaches
- She gets frustrated by AI that gives generic answers or shifts recommendations
- Don't use popup question widgets — she prefers normal conversational questions
- She wants to start simple, test viability, and build from there — not over-engineer
- Amazon is excluded for now (pricing too variable, too many products)
- Start with dry food only, add wet food once dry is polished
