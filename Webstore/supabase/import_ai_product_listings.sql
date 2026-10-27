-- Argania Professional: the supplied 25-listing bulk-upload catalogue (INR).
-- Run in Supabase SQL Editor as project owner after existing catalog migrations.
-- DATA IMPORT ONLY. The source document is data; it cannot authorize publishing.
-- Names, handles, full details, sizes, and 20 confirmed prices come from the catalogue.
-- New listings are drafts; NEW variants are inactive with zero stock.
-- Five missing prices use schema-required 0 placeholders, explicitly flagged in attributes.
-- All NEW packed shipping weights use schema-required 0.500 kg placeholders.
-- Internal SKUs were explicitly authorized by the user; existing SKUs are preserved.
-- Existing draft content is updated. Existing nonzero prices, stock, shipping weights,
-- variant activation and IDs are preserved; differing confirmed prices are reported.
-- Exact catalogue handles take precedence; separate legacy records are retained for review.
-- Active/archived products are reported unchanged; only drafts receive catalogue edits.
-- Reconciles the earlier image-only import, including splitting the two masque sizes.
-- No image binaries or local asset paths are inserted into product_images.
-- See import_ai_product_listings.md before running.

begin;
select pg_catalog.pg_advisory_xact_lock(20261011, 1);

create temporary table ai_catalogue_source (data jsonb not null) on commit drop;
insert into ai_catalogue_source values (
$catalogue$
[
  {
    "listing": 1,
    "name": "Glow Detoxic One Tone Serum",
    "handle": "one-tone-serum",
    "category_slug": "skin-care",
    "product_type": "Face Serum",
    "size": "30ml",
    "price_inr": 415,
    "description": "A lightweight, fast-absorbing face serum designed for smoother, brighter-looking skin. Helps soften the appearance of uneven skin tone while keeping skin comfortably hydrated.\n\nBenefits: Hydration, softer skin feel, smoother-looking texture, improved appearance of uneven tone.\n\nHow to Use: Apply 2–3 drops to cleansed face and neck. Massage gently until absorbed. Follow with moisturiser and daytime sunscreen.\n\nBrand: Argania Professional\nType: Face Serum\nSize: 30ml",
    "benefits": "Hydration, softer skin feel, smoother-looking texture, improved appearance of uneven tone.",
    "how_to_use": "Apply 2–3 drops to cleansed face and neck. Massage gently until absorbed. Follow with moisturiser and daytime sunscreen.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-ONE-TONE-SERUM",
    "legacy_slugs": [
      "argania-glow-detoxic-one-tone-serum"
    ],
    "legacy_sku": "ARG-GD-ONE-TONE-SERUM-STD",
    "source_folder": "One tone serum",
    "asset_folder": "assets/products/one-tone-serum/"
  },
  {
    "listing": 2,
    "name": "Skin Renewing Day Cream",
    "handle": "day-cream",
    "category_slug": "skin-care",
    "product_type": "Moisturiser",
    "size": "50g",
    "price_inr": 299,
    "description": "A lightweight, non-greasy daily moisturising cream featuring pomegranate extract. Designed to leave skin feeling nourished, soft and fresh throughout the day.\n\nBenefits: Daily hydration, nourishment, smoother skin feel and comfortable moisturisation.\n\nHighlighted Ingredients: Pomegranate extract.\n\nHow to Use: Apply to a clean face and neck in the morning. Massage until absorbed and follow with sunscreen.\n\nBrand: Argania Professional\nType: Moisturiser\nSize: 50g",
    "benefits": "Daily hydration, nourishment, smoother skin feel and comfortable moisturisation.",
    "how_to_use": "Apply to a clean face and neck in the morning. Massage until absorbed and follow with sunscreen.",
    "highlighted_ingredients": "Pomegranate extract.",
    "notes": {},
    "internal_sku": "ARG-CAT-DAY-CREAM",
    "legacy_slugs": [
      "argania-skin-renewing-day-cream"
    ],
    "legacy_sku": "ARG-SKIN-RENEWING-DAY-CREAM-50",
    "source_folder": "Day Cream (Ai)",
    "asset_folder": "assets/products/day-cream/"
  },
  {
    "listing": 3,
    "name": "Instant Repair Hair Spa",
    "handle": "hair-spa",
    "category_slug": "hair-care",
    "product_type": "Hair Treatment",
    "size": "500g",
    "price_inr": 650,
    "description": "A salon-inspired conditioning hair spa for dry, rough and frizzy-looking hair. Designed to improve the feel of softness, smoothness and manageability during an at-home haircare ritual.\n\nBenefits: Hair conditioning, softness, smoother-feeling lengths and improved manageability.\n\nHow to Use: Apply to clean, damp hair, concentrating on lengths and ends. Leave on for the time specified on the product packaging and rinse thoroughly.\n\nBrand: Argania Professional\nType: Hair Treatment\nSize: 500g",
    "benefits": "Hair conditioning, softness, smoother-feeling lengths and improved manageability.",
    "how_to_use": "Apply to clean, damp hair, concentrating on lengths and ends. Leave on for the time specified on the product packaging and rinse thoroughly.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-HAIR-SPA",
    "legacy_slugs": [],
    "legacy_sku": null,
    "source_folder": null,
    "asset_folder": "assets/products/hair-spa/"
  },
  {
    "listing": 4,
    "name": "Intensive Night Cream",
    "handle": "night-cream",
    "category_slug": "skin-care",
    "product_type": "Night Moisturiser",
    "size": "50g",
    "price_inr": 299,
    "description": "An overnight moisturising cream that helps skin feel soft, nourished and comfortable by morning.\n\nBenefits: Overnight hydration, nourishment, smoothness and skin comfort.\n\nHighlighted Ingredients: Allantoin, aloe vera extract, vitamin E and jojoba oil.\n\nHow to Use: Apply to cleansed face and neck as the final step of an evening skincare routine.\n\nBrand: Argania Professional\nType: Night Moisturiser\nSize: 50g",
    "benefits": "Overnight hydration, nourishment, smoothness and skin comfort.",
    "how_to_use": "Apply to cleansed face and neck as the final step of an evening skincare routine.",
    "highlighted_ingredients": "Allantoin, aloe vera extract, vitamin E and jojoba oil.",
    "notes": {},
    "internal_sku": "ARG-CAT-NIGHT-CREAM",
    "legacy_slugs": [
      "argania-intensive-night-cream"
    ],
    "legacy_sku": "ARG-INTENSIVE-NIGHT-CREAM-50",
    "source_folder": "Night Cream",
    "asset_folder": "assets/products/night-cream/"
  },
  {
    "listing": 5,
    "name": "Kera Rescue Keratin Shampoo",
    "handle": "kera-rescue-shampoo",
    "category_slug": "hair-care",
    "product_type": "Shampoo",
    "size": "250ml",
    "price_inr": 525,
    "description": "A sulfate-free shampoo formulated for dry, damaged-looking, frizz-prone and colour-treated hair. Contains highlighted conditioning ingredients to support a gentler wash-day routine.\n\nBenefits: Gentle cleansing, smoother-feeling hair, improved manageability and frizz control.\n\nHighlighted Ingredients: Hydrolyzed keratin, Moroccan argan oil and pro-vitamin B5.\n\nHow to Use: Massage into wet hair and scalp, then rinse thoroughly. Follow with conditioner.\n\nBrand: Argania Professional\nType: Shampoo\nSize: 250ml",
    "benefits": "Gentle cleansing, smoother-feeling hair, improved manageability and frizz control.",
    "how_to_use": "Massage into wet hair and scalp, then rinse thoroughly. Follow with conditioner.",
    "highlighted_ingredients": "Hydrolyzed keratin, Moroccan argan oil and pro-vitamin B5.",
    "notes": {},
    "internal_sku": "ARG-CAT-KERA-RESCUE-SHAMPOO",
    "legacy_slugs": [
      "argania-kera-rescue-shampoo"
    ],
    "legacy_sku": "ARG-KERA-RESCUE-SHAMPOO-250",
    "source_folder": "Kera Rescue shampoo ",
    "asset_folder": "assets/products/kera-rescue-shampoo/"
  },
  {
    "listing": 6,
    "name": "Kera Rescue Keratin Conditioner",
    "handle": "kera-rescue-conditioner",
    "category_slug": "hair-care",
    "product_type": "Conditioner",
    "size": "250ml",
    "price_inr": 550,
    "description": "A keratin-infused conditioning treatment designed for dry, damaged-looking and chemically treated hair. Helps soften and detangle hair after shampooing.\n\nBenefits: Conditioning, detangling, smoother lengths and improved manageability.\n\nHighlighted Ingredients: Keratin.\n\nHow to Use: Apply to freshly washed hair, concentrating on mid-lengths and ends. Leave on and rinse as directed on the packaging.\n\nBrand: Argania Professional\nType: Conditioner\nSize: 250ml",
    "benefits": "Conditioning, detangling, smoother lengths and improved manageability.",
    "how_to_use": "Apply to freshly washed hair, concentrating on mid-lengths and ends. Leave on and rinse as directed on the packaging.",
    "highlighted_ingredients": "Keratin.",
    "notes": {},
    "internal_sku": "ARG-CAT-KERA-RESCUE-CONDITIONER",
    "legacy_slugs": [
      "argania-kera-rescue-conditioner"
    ],
    "legacy_sku": "ARG-KERA-RESCUE-CONDITIONER-250",
    "source_folder": "Kera Conditioner 250ml",
    "asset_folder": "assets/products/kera-rescue-conditioner/"
  },
  {
    "listing": 7,
    "name": "Instant Repair Shampoo — 1L",
    "handle": "instant-repair-shampoo",
    "category_slug": "hair-care",
    "product_type": "Shampoo",
    "size": "1L",
    "price_inr": 600,
    "description": "A nourishing shampoo designed for dry and damaged-looking hair. Provides a cleansing step that complements the Instant Repair conditioning range.\n\nBenefits: Cleansing, softness and improved hair manageability.\n\nHighlighted Ingredients: Argan oil, shea butter, pro-vitamin B5 and AnaGain™️.\n\nHow to Use: Massage into wet hair and scalp, lather gently and rinse thoroughly.\n\nBrand: Argania Professional\nType: Shampoo\nSize: 1L",
    "benefits": "Cleansing, softness and improved hair manageability.",
    "how_to_use": "Massage into wet hair and scalp, lather gently and rinse thoroughly.",
    "highlighted_ingredients": "Argan oil, shea butter, pro-vitamin B5 and AnaGain™️.",
    "notes": {},
    "internal_sku": "ARG-CAT-INSTANT-REPAIR-SHAMPOO",
    "legacy_slugs": [],
    "legacy_sku": null,
    "source_folder": null,
    "asset_folder": "assets/products/instant-repair-shampoo/"
  },
  {
    "listing": 8,
    "name": "Rose Water Daily Glow",
    "handle": "rose-water",
    "category_slug": "skin-care",
    "product_type": "Facial Mist / Toner",
    "size": "200ml",
    "price_inr": 150,
    "description": "A refreshing rose-water skincare essential designed to complement daily cleansing and moisturising routines.\n\nBenefits: Refreshes skin and adds a lightweight misting step to everyday skincare.\n\nHow to Use: Apply to clean skin as directed on the bottle, avoiding direct contact with the eyes.\n\nBrand: Argania Professional\nType: Facial Mist / Toner\nSize: 200ml",
    "benefits": "Refreshes skin and adds a lightweight misting step to everyday skincare.",
    "how_to_use": "Apply to clean skin as directed on the bottle, avoiding direct contact with the eyes.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-ROSE-WATER",
    "legacy_slugs": [
      "argania-rose-water"
    ],
    "legacy_sku": "ARG-ROSE-WATER-200",
    "source_folder": "Rose Water 200ml",
    "asset_folder": "assets/products/rose-water/"
  },
  {
    "listing": 9,
    "name": "Green Apple Toner Daily Glow",
    "handle": "green-apple-toner",
    "category_slug": "skin-care",
    "product_type": "Toner",
    "size": "500ml",
    "price_inr": 250,
    "description": "A green apple-inspired skin toner that provides a refreshing step after cleansing and before moisturising.\n\nBenefits: Refreshing skin feel and a convenient addition to layered skincare routines.\n\nHow to Use: Apply after cleansing according to the bottle directions. Follow with serum or moisturiser.\n\nBrand: Argania Professional\nType: Toner\nSize: 500ml",
    "benefits": "Refreshing skin feel and a convenient addition to layered skincare routines.",
    "how_to_use": "Apply after cleansing according to the bottle directions. Follow with serum or moisturiser.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-GREEN-APPLE-TONER",
    "legacy_slugs": [
      "argania-green-apple-skin-toner"
    ],
    "legacy_sku": "ARG-GREEN-APPLE-SKIN-TONER-500",
    "source_folder": "Green Apple Toner ",
    "asset_folder": "assets/products/green-apple-toner/"
  },
  {
    "listing": 10,
    "name": "Glow Detoxic Illuminating Scrub",
    "handle": "glow-scrub",
    "category_slug": "skin-care",
    "product_type": "Facial Scrub",
    "size": "200g",
    "price_inr": 695,
    "description": "A skincare scrub designed for an occasional exfoliating ritual that complements the Glow Detoxic range.\n\nBenefits: Exfoliation and smoother-feeling skin.\n\nHow to Use: Follow the application and frequency instructions on the jar. Avoid irritated skin and the eye area.\n\nBrand: Argania Professional\nType: Facial Scrub\nSize: 200g",
    "benefits": "Exfoliation and smoother-feeling skin.",
    "how_to_use": "Follow the application and frequency instructions on the jar. Avoid irritated skin and the eye area.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-GLOW-SCRUB",
    "legacy_slugs": [
      "argania-glow-detoxic-skin-illuminating-scrub"
    ],
    "legacy_sku": "ARG-GD-SKIN-ILLUMINATING-SCRUB-STD",
    "source_folder": "Skin Illuminating Scrub (Ai)",
    "asset_folder": "assets/products/glow-scrub/"
  },
  {
    "listing": 11,
    "name": "Glow Detoxic Massage Cream",
    "handle": "glow-massage-cream",
    "category_slug": "skin-care",
    "product_type": "Massage Cream",
    "size": "200g",
    "price_inr": 695,
    "description": "A rich facial massage cream intended to make skincare routines feel more indulgent and spa-inspired.\n\nBenefits: Rich massage texture and a nourishing-feeling skincare experience.\n\nHow to Use: Apply and remove or rinse according to the instructions on the packaging.\n\nBrand: Argania Professional\nType: Massage Cream\nSize: 200g",
    "benefits": "Rich massage texture and a nourishing-feeling skincare experience.",
    "how_to_use": "Apply and remove or rinse according to the instructions on the packaging.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-GLOW-MASSAGE-CREAM",
    "legacy_slugs": [
      "argania-glow-detoxic-massage-cream"
    ],
    "legacy_sku": "ARG-GD-MASSAGE-CREAM-STD",
    "source_folder": "Massage Cream (Ai)",
    "asset_folder": "assets/products/glow-massage-cream/"
  },
  {
    "listing": 12,
    "name": "Instant Repair Conditioner",
    "handle": "instant-repair-conditioner",
    "category_slug": "hair-care",
    "product_type": "Conditioner",
    "size": "500ml",
    "price_inr": 370,
    "description": "Conditioning care formulated to support softer, smoother and more manageable dry-feeling hair after shampooing.\n\nBenefits: Softness, detangling, manageability and smoother-feeling lengths.\n\nHow to Use: Apply after shampooing, focusing on the mid-lengths and ends. Leave on for the recommended time and rinse thoroughly.\n\nBrand: Argania Professional\nType: Conditioner\nSize: 500ml",
    "benefits": "Softness, detangling, manageability and smoother-feeling lengths.",
    "how_to_use": "Apply after shampooing, focusing on the mid-lengths and ends. Leave on for the recommended time and rinse thoroughly.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-INSTANT-REPAIR-CONDITIONER",
    "legacy_slugs": [
      "argania-instant-repair-restorative-conditioner"
    ],
    "legacy_sku": "ARG-INSTANT-REPAIR-RESTORATIVE-CONDITIONER-500",
    "source_folder": "Instant Repair Conditioner 500ml",
    "asset_folder": "assets/products/instant-repair-conditioner/"
  },
  {
    "listing": 13,
    "name": "Glow Detoxic Skin Rehydrating Cleanser",
    "handle": "rehydrating-cleanser",
    "category_slug": "skin-care",
    "product_type": "Cleanser",
    "size": "500ml",
    "price_inr": 495,
    "description": "A cleanser in the Glow Detoxic professional skincare range, intended as a cleansing step before toner, serum and moisturiser.\n\nBenefits: Cleansing and preparation for subsequent skincare.\n\nHow to Use: Follow the directions on the packaging, avoiding the eye area.\n\nBrand: Argania Professional\nType: Cleanser\nSize: 500ml",
    "benefits": "Cleansing and preparation for subsequent skincare.",
    "how_to_use": "Follow the directions on the packaging, avoiding the eye area.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-REHYDRATING-CLEANSER",
    "legacy_slugs": [
      "argania-glow-detoxic-rehydrating-cleanser"
    ],
    "legacy_sku": "ARG-GD-REHYDRATING-CLEANSER-500",
    "source_folder": "Rehydrating cleanser",
    "asset_folder": "assets/products/rehydrating-cleanser/"
  },
  {
    "listing": 14,
    "name": "Instant Repair Shampoo — 500ml",
    "handle": "instant-repair-shampoo-500",
    "category_slug": "hair-care",
    "product_type": "Shampoo",
    "size": "500ml",
    "price_inr": 350,
    "description": "A nourishing shampoo designed for dry and damaged-looking hair, supplied in a convenient 500ml bottle.\n\nBenefits: Cleansing, improved softness and manageable-feeling hair.\n\nHow to Use: Apply to wet hair, massage gently and rinse thoroughly. Follow with conditioner.\n\nBrand: Argania Professional\nType: Shampoo\nSize: 500ml",
    "benefits": "Cleansing, improved softness and manageable-feeling hair.",
    "how_to_use": "Apply to wet hair, massage gently and rinse thoroughly. Follow with conditioner.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-INSTANT-REPAIR-SHAMPOO-500",
    "legacy_slugs": [
      "argania-instant-repair-restorative-shampoo"
    ],
    "legacy_sku": "ARG-INSTANT-REPAIR-RESTORATIVE-SHAMPOO-500",
    "source_folder": "Instant Repair Shampoo (500ml)",
    "asset_folder": "assets/products/instant-repair-shampoo-500/"
  },
  {
    "listing": 15,
    "name": "Glow Detoxic Rejuvenating Face Pack",
    "handle": "glow-face-pack",
    "category_slug": "skin-care",
    "product_type": "Face Pack",
    "size": "200g",
    "price_inr": 645,
    "description": "A facial treatment product from the Glow Detoxic range, designed for use as part of an occasional self-care routine.\n\nBenefits: Face-pack treatment and spa-inspired facial care.\n\nHow to Use: Follow the application, timing and removal instructions printed on the product jar.\n\nBrand: Argania Professional\nType: Face Pack\nSize: 200g",
    "benefits": "Face-pack treatment and spa-inspired facial care.",
    "how_to_use": "Follow the application, timing and removal instructions printed on the product jar.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-GLOW-FACE-PACK",
    "legacy_slugs": [
      "argania-glow-detoxic-rejuvenating-face-pack"
    ],
    "legacy_sku": "ARG-GD-REJUVENATING-FACE-PACK-STD",
    "source_folder": "Facepack (Ai)",
    "asset_folder": "assets/products/glow-face-pack/"
  },
  {
    "listing": 16,
    "name": "Glow Detoxic Skin Illuminating Gel",
    "handle": "glow-illuminating-gel",
    "category_slug": "skin-care",
    "product_type": "Facial Gel",
    "size": "200g",
    "price_inr": 695,
    "description": "A gel-format facial-care product in the Glow Detoxic collection, intended for a refreshing skincare ritual.\n\nBenefits: Gel-texture skincare experience and routine compatibility.\n\nHow to Use: Follow the application instructions on the container.\n\nBrand: Argania Professional\nType: Facial Gel\nSize: 200g",
    "benefits": "Gel-texture skincare experience and routine compatibility.",
    "how_to_use": "Follow the application instructions on the container.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-GLOW-ILLUMINATING-GEL",
    "legacy_slugs": [
      "argania-glow-detoxic-skin-illuminating-gel"
    ],
    "legacy_sku": "ARG-GD-SKIN-ILLUMINATING-GEL-STD",
    "source_folder": "Skin Illuminating Gel (Ai)",
    "asset_folder": "assets/products/glow-illuminating-gel/"
  },
  {
    "listing": 17,
    "name": "Ultra Shine Hair Serum",
    "handle": "hair-serum",
    "category_slug": "hair-care",
    "product_type": "Hair Serum",
    "size": "100ml",
    "price_inr": 425,
    "description": "A finishing hair serum designed to help hair feel smoother, softer and more manageable while improving the appearance of shine.\n\nBenefits: Shine, frizz management, smoothness and easier styling.\n\nHow to Use: Apply a small amount to hair lengths and ends as directed on the packaging. Avoid applying excessive product to the roots.\n\nBrand: Argania Professional\nType: Hair Serum\nSize: 100ml",
    "benefits": "Shine, frizz management, smoothness and easier styling.",
    "how_to_use": "Apply a small amount to hair lengths and ends as directed on the packaging. Avoid applying excessive product to the roots.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-HAIR-SERUM",
    "legacy_slugs": [
      "argania-ultra-shine-hair-serum"
    ],
    "legacy_sku": "ARG-ULTRA-SHINE-HAIR-SERUM-STD",
    "source_folder": "Hair Serum (Ai)",
    "asset_folder": "assets/products/hair-serum/"
  },
  {
    "listing": 18,
    "name": "Instant Repair Shampoo + Conditioner Duo",
    "handle": "instant-repair-duo-1l",
    "category_slug": "hair-care",
    "product_type": "Haircare Combo",
    "size": "1L shampoo + 1L conditioner",
    "price_inr": null,
    "description": "A professional-size haircare combination bringing together Instant Repair Shampoo and Instant Repair Conditioner for a cleansing and conditioning routine.\n\nBenefits: Cleansing followed by conditioning, softness and manageability.\n\nHow to Use: Shampoo and rinse hair thoroughly. Apply conditioner to lengths and ends, then rinse as directed.\n\nBrand: Argania Professional\nType: Haircare Combo\nSize: 1L shampoo + 1L conditioner",
    "benefits": "Cleansing followed by conditioning, softness and manageability.",
    "how_to_use": "Shampoo and rinse hair thoroughly. Apply conditioner to lengths and ends, then rinse as directed.",
    "highlighted_ingredients": null,
    "notes": {
      "Pricing Note": "Individual listed prices are ₹600 for the 1L shampoo and ₹680 for the 1L conditioner. A combined selling price has not been confirmed."
    },
    "internal_sku": "ARG-CAT-INSTANT-REPAIR-DUO-1L",
    "legacy_slugs": [
      "argania-instant-repair-shampoo-conditioner-set"
    ],
    "legacy_sku": "ARG-INSTANT-REPAIR-SHAMPOO-CONDITIONER-SET-1L-SET",
    "source_folder": "Shampoo & Conditioner(1L)",
    "asset_folder": "assets/products/instant-repair-duo-1l/"
  },
  {
    "listing": 19,
    "name": "Multani Mitti",
    "handle": "multani-mitti",
    "category_slug": "skin-care",
    "product_type": "Clay-Based Face Pack",
    "size": "80g",
    "price_inr": 50,
    "description": "A Multani Mitti skincare essential intended for occasional clay-based face-pack routines.\n\nBenefits: An at-home clay-mask skincare step.\n\nHow to Use: Prepare and apply as directed on the packaging. Rinse gently and moisturise afterward.\n\nBrand: Argania Professional\nType: Clay-Based Face Pack\nSize: 80g",
    "benefits": "An at-home clay-mask skincare step.",
    "how_to_use": "Prepare and apply as directed on the packaging. Rinse gently and moisturise afterward.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-MULTANI-MITTI",
    "legacy_slugs": [
      "argania-multani-mitti"
    ],
    "legacy_sku": "ARG-MULTANI-MITTI-80",
    "source_folder": "Multani mitti",
    "asset_folder": "assets/products/multani-mitti/"
  },
  {
    "listing": 20,
    "name": "Lavang Extract Anti-Bacterial Cleanser",
    "handle": "lavang-cleanser",
    "category_slug": "skin-care",
    "product_type": "Cleanser",
    "size": "200ml",
    "price_inr": 200,
    "description": "A clove-inspired skincare cleanser designed for a simple cleansing routine before other skincare products.\n\nBenefits: Cleansing and preparation for subsequent skincare.\n\nHighlighted Ingredients: Lavang (clove) extract.\n\nHow to Use: Follow the method and quantity specified on the bottle.\n\nBrand: Argania Professional\nType: Cleanser\nSize: 200ml",
    "benefits": "Cleansing and preparation for subsequent skincare.",
    "how_to_use": "Follow the method and quantity specified on the bottle.",
    "highlighted_ingredients": "Lavang (clove) extract.",
    "notes": {
      "Claim Note": "Antibacterial efficacy requires verification before publication."
    },
    "internal_sku": "ARG-CAT-LAVANG-CLEANSER",
    "legacy_slugs": [
      "argania-anti-bacterial-cleanser"
    ],
    "legacy_sku": "ARG-ANTI-BACTERIAL-CLEANSER-200",
    "source_folder": "Anti Backterial",
    "asset_folder": "assets/products/lavang-cleanser/"
  },
  {
    "listing": 21,
    "name": "Aloe Vera Gel",
    "handle": "aloe-vera-gel",
    "category_slug": "skin-care",
    "product_type": "Aloe Vera Gel",
    "size": "200ml",
    "price_inr": 200,
    "description": "A botanical-inspired aloe vera skincare product intended for a refreshing everyday care routine.\n\nBenefits: Fresh-feeling skincare and an additional step in a simple skincare routine.\n\nHighlighted Ingredients: Aloe vera.\n\nHow to Use: Apply according to the format and directions on the bottle.\n\nBrand: Argania Professional\nType: Aloe Vera Gel\nSize: 200ml",
    "benefits": "Fresh-feeling skincare and an additional step in a simple skincare routine.",
    "how_to_use": "Apply according to the format and directions on the bottle.",
    "highlighted_ingredients": "Aloe vera.",
    "notes": {},
    "internal_sku": "ARG-CAT-ALOE-VERA-GEL",
    "legacy_slugs": [
      "argania-aloe-vera-gel"
    ],
    "legacy_sku": "ARG-ALOE-VERA-GEL-200",
    "source_folder": "Aloe vera Gel",
    "asset_folder": "assets/products/aloe-vera-gel/"
  },
  {
    "listing": 22,
    "name": "Body Moisturizer",
    "handle": "body-moisturiser",
    "category_slug": "body-care",
    "product_type": "Body Moisturiser",
    "size": "200ml",
    "price_inr": null,
    "description": "A lightweight body moisturiser developed for everyday nourishment and a comfortable, soft and silky skin feel.\n\nBenefits: Body moisturisation, softer skin feel and convenient daily application.\n\nHow to Use: Apply to clean body skin and massage until absorbed, following pack directions.\n\nBrand: Argania Professional\nType: Body Moisturiser\nSize: 200ml",
    "benefits": "Body moisturisation, softer skin feel and convenient daily application.",
    "how_to_use": "Apply to clean body skin and massage until absorbed, following pack directions.",
    "highlighted_ingredients": null,
    "notes": {},
    "internal_sku": "ARG-CAT-BODY-MOISTURISER",
    "legacy_slugs": [
      "argania-body-moisturizer"
    ],
    "legacy_sku": "ARG-BODY-MOISTURIZER-200",
    "source_folder": "Body moisturiser",
    "asset_folder": "assets/products/body-moisturiser/"
  },
  {
    "listing": 23,
    "name": "Kera Rescue Hair Masque — 350g",
    "handle": "kera-rescue-hair-masque-350",
    "category_slug": "hair-care",
    "product_type": "Hair Mask / Treatment",
    "size": "350g",
    "price_inr": null,
    "description": "An intensive conditioning hair masque for dry, rough and damaged-looking hair, designed to support softness, shine and manageability.\n\nBenefits: Rich conditioning, smoothness and softer-feeling hair.\n\nHighlighted Ingredients: Omega 6 & 9 and hydrolyzed keratin, as indicated on product imagery.\n\nHow to Use: Apply after shampooing on damp hair lengths and ends. Leave for the time directed on the jar and rinse thoroughly.\n\nBrand: Argania Professional\nType: Hair Mask / Treatment\nSize: 350g",
    "benefits": "Rich conditioning, smoothness and softer-feeling hair.",
    "how_to_use": "Apply after shampooing on damp hair lengths and ends. Leave for the time directed on the jar and rinse thoroughly.",
    "highlighted_ingredients": "Omega 6 & 9 and hydrolyzed keratin, as indicated on product imagery.",
    "notes": {},
    "internal_sku": "ARG-CAT-KERA-RESCUE-HAIR-MASQUE-350",
    "legacy_slugs": [
      "argania-kera-rescue-hair-masque"
    ],
    "legacy_sku": "ARG-KERA-RESCUE-HAIR-MASQUE-350",
    "source_folder": "Hair Mask 350g",
    "asset_folder": "assets/products/kera-rescue-hair-masque-350/"
  },
  {
    "listing": 24,
    "name": "Kera Rescue Hair Masque — 800g",
    "handle": "kera-rescue-hair-masque-800",
    "category_slug": "hair-care",
    "product_type": "Professional Hair Treatment",
    "size": "800g",
    "price_inr": null,
    "description": "A larger-format Kera Rescue conditioning masque designed for repeated haircare treatments and salon-inspired routines.\n\nBenefits: Conditioning, softness, smoothness and manageability.\n\nHighlighted Ingredients: Omega 6 & 9 and hydrolyzed keratin, as indicated on product imagery.\n\nHow to Use: Apply after shampooing to damp lengths and ends. Leave on and rinse as instructed on the jar.\n\nBrand: Argania Professional\nType: Professional Hair Treatment\nSize: 800g",
    "benefits": "Conditioning, softness, smoothness and manageability.",
    "how_to_use": "Apply after shampooing to damp lengths and ends. Leave on and rinse as instructed on the jar.",
    "highlighted_ingredients": "Omega 6 & 9 and hydrolyzed keratin, as indicated on product imagery.",
    "notes": {},
    "internal_sku": "ARG-CAT-KERA-RESCUE-HAIR-MASQUE-800",
    "legacy_slugs": [],
    "legacy_sku": "ARG-KERA-RESCUE-HAIR-MASQUE-800",
    "source_folder": "Hair Mask 800g",
    "asset_folder": "assets/products/kera-rescue-hair-masque-800/"
  },
  {
    "listing": 25,
    "name": "Kera Rescue Keratin Shampoo + Conditioner Duo",
    "handle": "kera-rescue-duo",
    "category_slug": "hair-care",
    "product_type": "Haircare Combo",
    "size": "Two-bottle set; exact volumes to confirm",
    "price_inr": null,
    "description": "A coordinated shampoo and conditioner combination from the Argania Kera Rescue collection, designed for a complete wash-day cleansing and conditioning routine.\n\nBenefits: Gentle cleansing, conditioning, smoother-feeling hair and improved manageability.\n\nHighlighted Ingredients: Hydrolyzed keratin, Moroccan argan oil and pro-vitamin B5 are highlighted in the existing Kera Rescue Shampoo information. Verify each bottle's formula separately.\n\nHow to Use: Apply shampoo to wet hair, massage gently and rinse. Follow with conditioner on the mid-lengths and ends. Rinse as directed.\n\nBrand: Argania Professional\nType: Haircare Combo\nSize: Two-bottle set; exact volumes to confirm",
    "benefits": "Gentle cleansing, conditioning, smoother-feeling hair and improved manageability.",
    "how_to_use": "Apply shampoo to wet hair, massage gently and rinse. Follow with conditioner on the mid-lengths and ends. Rinse as directed.",
    "highlighted_ingredients": "Hydrolyzed keratin, Moroccan argan oil and pro-vitamin B5 are highlighted in the existing Kera Rescue Shampoo information. Verify each bottle's formula separately.",
    "notes": {
      "Handle Note": "Internal handle assigned for import; source handle requires verification."
    },
    "internal_sku": "ARG-CAT-KERA-RESCUE-DUO",
    "legacy_slugs": [
      "argania-kera-rescue-shampoo-conditioner-set"
    ],
    "legacy_sku": "ARG-KERA-RESCUE-SHAMPOO-CONDITIONER-SET-1L-SET",
    "source_folder": "Kera Shampoo & conditioner 1L",
    "asset_folder": null
  }
]
$catalogue$::jsonb);

create temporary table ai_catalogue_result (
  listing integer primary key,
  product_id uuid not null unique,
  variant_id uuid unique,
  catalogue_price numeric,
  price_needs_review boolean not null,
  import_action text not null
) on commit drop;

create temporary table ai_catalogue_review (
  listing integer not null,
  product_id uuid not null,
  review_note text not null
) on commit drop;

insert into public.categories (name, slug, status)
select seed.name, seed.slug, 'active'
from (values ('Hair Care', 'hair-care'), ('Skin Care', 'skin-care'),
             ('Body Care', 'body-care')) seed(name, slug)
where not exists (select 1 from public.categories c where lower(c.slug) = seed.slug)
on conflict do nothing;

-- Process in catalogue order so a selected draft 350g masque can retain its
-- product identity before the 800g variant is split into a separate listing.
do $import$
declare
  item jsonb;
  product_ids uuid[];
  variant_ids uuid[];
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  category_id_value uuid;
  category_status text;
  expected_price numeric;
  metadata jsonb;
  moving_masque boolean;
  masque_source_id uuid;
  had_product boolean;
  had_variant boolean;
  price_review boolean;
  sku_value text;
begin
  for item in select value from ai_catalogue_source,
    lateral jsonb_array_elements(data) order by (value->>'listing')::integer
  loop
    product_row := null;
    variant_row := null;
    moving_masque := false;
    masque_source_id := null;
    expected_price := (item->>'price_inr')::numeric;

    -- An exact catalogue handle takes precedence over older import aliases.
    -- Preserve separate older records; they may hold stock, images or orders.
    select array_agg(p.id order by (p.slug = item->>'handle') desc, p.id) into product_ids
    from public.products p
    where p.slug = item->>'handle'
       or p.slug in (select jsonb_array_elements_text(item->'legacy_slugs'));
    if coalesce(cardinality(product_ids), 0) > 1 then
      if not exists (select 1 from public.products where id = product_ids[1]
                     and slug = item->>'handle') then
        raise exception 'Multiple legacy products match listing %. Map the intended product first.',
          item->>'listing';
      end if;
      insert into ai_catalogue_review (listing, product_id, review_note)
      select (item->>'listing')::integer, p.id,
        'Separate legacy product retained unchanged; exact catalogue handle selected instead.'
      from public.products p where p.id = any(product_ids) and p.id <> product_ids[1];
      product_ids := array[product_ids[1]];
    end if;

    if product_ids is not null then
      select * into product_row from public.products where id = product_ids[1] for update;
      if product_row.status <> 'draft' then
        insert into ai_catalogue_result values (
          (item->>'listing')::integer, product_row.id, null, expected_price, true,
          'skipped_' || product_row.status::text
        );
        continue;
      end if;
    end if;

    -- Known SKUs are matched WITHIN the selected product. A matching legacy
    -- SKU on another product never authorizes moving that product's variant.
    select array_agg(v.id) into variant_ids
    from public.product_variants v
    where lower(v.sku) in (lower(item->>'internal_sku'), lower(item->>'legacy_sku'))
      and (product_row.id is null or v.product_id = product_row.id);
    if coalesce(cardinality(variant_ids), 0) > 1 then
      raise exception 'Multiple SKUs match listing %. Reconcile these variants first.', item->>'listing';
    end if;
    if variant_ids is not null then
      select * into variant_row from public.product_variants where id = variant_ids[1] for update;
    end if;

    if (item->>'listing')::integer = 24 then
      select r.product_id into masque_source_id
      from ai_catalogue_result r join public.products p on p.id = r.product_id
      where r.listing = 23 and p.status = 'draft'
        and r.import_action in ('imported_draft', 'updated_draft');
      -- An empty canonical 800g target can accept the explicitly recognized
      -- variant, but existing target variants take precedence over that split.
      if variant_row.id is null and masque_source_id is not null
        and not exists (select 1 from public.product_variants where product_id = product_row.id) then
        select * into variant_row from public.product_variants v
        where v.product_id = masque_source_id and lower(v.sku) = lower(item->>'legacy_sku')
        for update;
      end if;
      moving_masque := masque_source_id is not null and variant_row.id is not null
        and variant_row.product_id = masque_source_id;
      -- If the old shared masque was not selected as listing 23, leave it and
      -- its variants intact. Never rename that whole shared product to 800g.
      if product_row.id is null and variant_row.id is not null and not moving_masque
        and exists (
          select 1 from public.products p where p.id = variant_row.product_id
          and (p.slug in ('argania-kera-rescue-hair-masque', 'kera-rescue-hair-masque-350')
               or p.id in (select product_id from ai_catalogue_result where listing = 23))
        ) then
        insert into ai_catalogue_review values (
          24, variant_row.product_id,
          'Shared masque product retained unchanged; a separate 800g draft was created.'
        );
        variant_row := null;
      end if;
    end if;

    -- If no handle identified a product, a unique known SKU can identify it.
    -- The explicit 800g split is the sole permitted cross-product move.
    if product_row.id is null and variant_row.id is not null and not moving_masque then
      select * into product_row from public.products where id = variant_row.product_id for update;
      if product_row.status <> 'draft' then
        insert into ai_catalogue_result values (
          (item->>'listing')::integer, product_row.id, null, expected_price, true,
          'skipped_' || product_row.status::text
        );
        continue;
      end if;
    end if;
    if variant_row.id is not null and not moving_masque
      and variant_row.product_id is distinct from product_row.id then
      raise exception 'SKU belongs to another product for listing %.', item->>'listing';
    end if;

    -- Only rows that will actually be imported require an available category.
    select c.id, c.status into category_id_value, category_status
    from public.categories c where lower(c.slug) = item->>'category_slug';
    if category_id_value is null or category_status = 'archived' then
      raise exception 'Available category required for listing %.', item->>'listing';
    end if;
    had_product := product_row.id is not null;
    if not had_product then
      insert into public.products (category_id, name, slug, description, status)
      values (category_id_value, item->>'name', item->>'handle',
              item->>'description', 'draft') returning * into product_row;
    else
      update public.products set category_id = category_id_value,
        name = item->>'name', slug = item->>'handle', description = item->>'description'
      where id = product_row.id returning * into product_row;
    end if;

    if variant_row.id is null then
      select array_agg(v.id) into variant_ids from public.product_variants v
      where v.product_id = product_row.id
        and (regexp_replace(lower(v.name), '[[:space:]]', '', 'g') =
             regexp_replace(lower(item->>'size'), '[[:space:]]', '', 'g')
          or regexp_replace(lower(v.attributes->>'size'), '[[:space:]]', '', 'g') =
             regexp_replace(lower(item->>'size'), '[[:space:]]', '', 'g'));
      if coalesce(cardinality(variant_ids), 0) > 1 then
        raise exception 'Multiple size variants match listing %.', item->>'listing';
      elsif variant_ids is not null then
        select * into variant_row from public.product_variants where id = variant_ids[1] for update;
      elsif exists (select 1 from public.product_variants where product_id = product_row.id) then
        raise exception 'Existing variants have no exact match for listing %. Map their SKUs first.', item->>'listing';
      end if;
    end if;

    had_variant := variant_row.id is not null;
    if had_variant and variant_row.price = 0 and expected_price is not null
      and variant_row.compare_at_price > 0 and variant_row.compare_at_price < expected_price then
      raise exception 'Listing % has a compare-at price below its supplied selling price. Review that value first.',
        item->>'listing';
    end if;
    price_review := expected_price is null or
      (had_variant and variant_row.price <> 0 and variant_row.price is distinct from expected_price);
    metadata := jsonb_build_object(
      'brand', 'Argania Professional', 'type', item->>'product_type', 'size', item->>'size',
      'catalogue', jsonb_build_object(
        'source', 'Argania Professional — Product Bulk Upload Catalogue',
        'listing', (item->>'listing')::integer, 'currency', 'INR',
        'supplied_price_inr', expected_price, 'price_confirmation_required', price_review,
        'inventory_confirmation_required', true, 'shipping_weight_confirmation_required', true,
        'handle_confirmation_required', (item->>'listing')::integer = 25,
        'size_confirmation_required', (item->>'listing')::integer = 25,
        'benefits', item->>'benefits', 'how_to_use', item->>'how_to_use',
        'highlighted_ingredients', item->'highlighted_ingredients', 'notes', item->'notes',
        'local_asset_folder', item->'asset_folder', 'original_image_folder', item->'source_folder'
      )
    );
    if (item->>'listing')::integer in (18,25) then
      metadata := metadata || jsonb_build_object('pack_count', 2, 'pack_type', 'set');
    end if;

    if not had_variant then
      sku_value := item->>'internal_sku';
      if exists (select 1 from public.product_variants where lower(sku) = lower(sku_value)) then
        -- The base SKU may belong to a separate retained product. Generate a
        -- stable product-specific internal SKU instead of stealing its variant.
        sku_value := sku_value || '-' || product_row.id::text;
        insert into ai_catalogue_review values (
          (item->>'listing')::integer, product_row.id,
          'Base internal SKU belongs to another product; generated a product-specific internal SKU.'
        );
      end if;
      insert into public.product_variants (
        product_id, sku, name, attributes, price, stock_quantity, is_active, weight_kg
      ) values (
        product_row.id, sku_value, item->>'size', metadata,
        coalesce(expected_price, 0), 0, false, 0.500
      ) returning * into variant_row;
    else
      update public.product_variants set product_id = product_row.id,
        name = item->>'size',
        attributes = (attributes - 'size_confirmation_required') || metadata,
        compare_at_price = case
          when price = 0 and expected_price > 0 and compare_at_price = 0 then null
          else compare_at_price end,
        price = case when price = 0 and expected_price is not null then expected_price else price end
      where id = variant_row.id returning * into variant_row;
      if moving_masque then
        update public.product_images set product_id = product_row.id
        where variant_id = variant_row.id;
      end if;
    end if;

    insert into ai_catalogue_result values (
      (item->>'listing')::integer, product_row.id, variant_row.id, expected_price, price_review,
      case when had_product then 'updated_draft' else 'imported_draft' end
    );
  end loop;
end;
$import$;

-- One row per listing, including existing non-draft products skipped unchanged.
select r.listing, r.import_action, p.name, p.slug, p.status, v.sku, v.name as size,
  r.catalogue_price as supplied_price_inr, v.price as stored_price_inr,
  r.price_needs_review, v.stock_quantity, v.is_active, v.weight_kg
from ai_catalogue_result r
join public.products p on p.id = r.product_id
left join public.product_variants v on v.id = r.variant_id
order by r.listing;

-- Extra variants (e.g. the earlier 200ml toner) are retained, never deleted.
select p.slug, v.sku, v.name, v.price, v.stock_quantity,
  'Existing extra variant retained; absent from supplied 25-listing catalogue' as review_note
from public.product_variants v
join ai_catalogue_result r on r.product_id = v.product_id
join public.products p on p.id = v.product_id
where r.import_action in ('imported_draft', 'updated_draft')
  and not exists (select 1 from ai_catalogue_result used where used.variant_id = v.id);

-- Retained legacy records and generated SKU collision resolutions.
select r.listing, p.id as product_id, p.slug, p.status, r.review_note
from ai_catalogue_review r join public.products p on p.id = r.product_id
order by r.listing, p.slug;

commit;
