# CLAUDE.md — PawLens Project Context

## Project Overview
PawLens is a cat food transparency and comparison platform. The core value proposition is cutting through misleading pet food marketing and packaging to help cat owners find the best food for their specific cat's needs. Currently covers PetSmart dry cat food, expanding to wet food, then dog food, then additional retailers.

## Tech Stack
- **Frontend:** React (JSX) with Vite dev server
- **Backend:** Express + better-sqlite3
- **AI:** OpenRouter (anthropic/claude-3.5-haiku)
- **Hosting:** Railway (auto-deploys from GitHub on push)
- **Local dev:** `npm run dev` → localhost:5173 (Vite) + localhost:3001 (Express)

## Important Rules
- Claude is responsible for verifying ALL data accuracy — Kenna should not have to check data
- Amazon is excluded for now (pricing too variable, too many products)

## Non-Negotiable Work Standards
These rules exist because Claude violated them and it cost hours of wasted work, corrupted data, and lost trust. They are not suggestions.

### Never assume — always verify
- NEVER say code, data, scripts, or processes are "safe", "correct", or "fine" without reading every line and verifying against established rules
- Before recommending keeping or skipping a file, READ IT and explain what it does
- Before running any script that modifies data, trace through exactly what it will change and show a dry-run diff
- If you haven't verified something, say "I haven't verified this yet" — don't guess
- **Why this exists:** Claude told Kenna a normalization script was "safe to keep" without reading it. It contained multiple rules that violated established principles, causing data corruption and hours of cleanup.

### Never take shortcuts on scraping
- NEVER use bulk APIs (like Algolia) to scrape product data — always use browser automation that visits each product page, clicks every tab, and expands hidden content
- The Algolia API can be used ONLY to collect the product URL list — actual data must come from visiting the pages
- If considering any shortcut approach, check with Kenna FIRST
- **Why this exists:** Claude used the Algolia API as a shortcut for wet food scraping. It produced wrong flavors, missing descriptions, truncated ingredients. The "faster" approach cost far more time than doing it right.

### Scraping process (3 steps, no exceptions)
1. **Collect product URLs** — save to a URLs JSON file
2. **Visit each URL with browser automation** — parse all page data (HTML, LD+JSON, RSC payloads, every tab)
3. **Clean up with a reusable fix-data-quality script** — designed to work across food types (dry, wet, dog)

### Flavor accuracy
- Flavor names come ONLY from explicit labels — never guess or infer from ingredient lists
- Valid sources in priority order: (1) product listing title, (2) calorie content formula labels, (3) ingredient list formula labels
- **Why this exists:** Claude extracted flavors from ingredient contents instead of product titles, producing inaccurate data.

### Data verification method
- Compare every data field against the product title first, then the description/image
- Always cross-reference against the product name and description before asserting accuracy
- Include before/after diffs for any data changes so Kenna can review
- Don't just assert "it works" — show the evidence

### Documentation belongs in the project, not in Claude's memory
- Technical reference, research findings, page structure knowledge, and reusable info → project files (e.g. `server/scripts/SCRAPING.md`)
- Claude memory is ONLY for: how to work with Kenna, feedback on approach, preferences, behavioral rules
- Every decision should account for reuse and discoverability across sessions, collaborators, and future features

### Do NOT override Kenna's decisions
- If Kenna has explicitly decided on an approach, follow it — do not substitute your own judgment
- If you disagree, explain why and ask — don't silently do something different

## Key Design Principles
1. **AI must think outside the box** — proactively suggest creative feeding strategies (mixing foods, rotation feeding, microchip-activated feeders for multi-cat households, timed feeders, puzzle feeders)
2. **Multiple options upfront** — don't wait for user to ask, present several approaches
3. **Never shift recommendations without explanation** — if something changes, say why
4. **Personalized, not generic** — every response should feel written for THIS person's cat(s)
5. **Handle multi-cat households** — this is a common real-world complexity most tools ignore
6. **No-nonsense trust-first brand** — cut through BS, educate don't preach

## Branding
- Background: teal (#a0e2eb) — set in BOTH index.html AND colors.js
- Cards: warm white (#FFFEF8)
- Primary/titles: forest green (#2D5E4A)
- Accent: tangerine (#E8834A)
- Font: Nunito
- Ingredient ratings: Great (purple) → Good (green) → Neutral (blue) → Caution (yellow) → Avoid (red)
- Life stage badges: Kitten (purple) / Adult (green) / All Stages (blue) / Senior 7+ (orange) / Senior 11+ (red)

## Kenna (Owner)
- First-time business/website builder — explain everything simply
- Has experience with community management (SheFi, 10,000+ member community)
- Has education background (makes complex info accessible)
- Has coded a Discord bot and deployed via GitHub before
- Located in Tigard, Oregon
- Conversational tone, no corporate speak
- Don't use popup question widgets — conversational questions only
- Values creative, outside-the-box thinking over standard approaches
- Gets frustrated by AI that gives generic answers or shifts recommendations without explanation
- Monitor renders warm — use saturated colors, not muted ones
- Don't push to GitHub unless told "push it"
- Commit minor changes locally without asking
- Wants to start simple, test viability, and build from there — not over-engineer

## Kenna's Cats (Test Case)
- **Cat A:** Large breed, 12 years old, healthy weight, needs muscle maintenance
- **Cat B:** Mixed breed, 11 years old, ~2 lbs overweight, mobility issues
- **Shared environment:** Semi-indoor/outdoor, temperature-controlled shed
- **Activity level:** Very low movement for both
- **Preferences:** Both prefer "big crunch" kibble and firm pates
- **Previous food:** Crave (mining behavior, 18% fat) and Hill's Science Diet Vitality (heavy grains, constant begging)
- **Kenna already mixes dry foods** — PawLens should proactively suggest strategies like this

## Pages
- **Home** — Hero card (Tell Us About Your Cat) + 3 feature cards
- **Get Recommendations** — AI-powered personalized cat food recommendations
- **Browse Foods** — All products with filters, default sort by score high→low
- **Ingredient Decoder** — 49 ingredients with ratings, explanations, and product lists grouped by brand
- **What Labels Hide** — 18 labeling tricks across 4 categories (Label Tricks, Ingredient Deception, Hidden Health Concerns, Misleading Standards)
- **Admin** — Product and ingredient management (password protected)

## Features for Later
- Upload vet docs for better recommendations
- Personalized ingredient flags per cat profile (same ingredient = different rating based on cat's needs)
- Price comparison and shipping/autoship options
- Customer reviews
- Monetization: affiliate links, sponsored content, premium features

## Origin Story (Marketing Asset)
Kenna used Gemini AI to research her cats' food and discovered she'd been making wrong choices for years due to misleading labels. The Gemini experience was frustrating — inconsistent recommendations, generic answers. PawLens solves BOTH problems: misleading labels AND bad AI experiences.

## Marketing Quotes & Assets
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
