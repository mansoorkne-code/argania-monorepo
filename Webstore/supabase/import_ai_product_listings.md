# Import the 25-listing Argania catalogue

Run `import_ai_product_listings.sql` in the Supabase SQL Editor as project owner. It is a transactional data import against the existing product schema, category metadata and checkout shipping-weight migrations. It does not change the schema or publish products. The supplied text catalogue replaces the earlier image-only assumptions.

If the earlier version stopped with `Multiple products match listing 1 (one-tone-serum)`, rerun the **complete corrected SQL file**. The earlier error rolled back the import transaction. Both the catalogue handle and an older import alias already exist in the database; this version selects the exact catalogue handle and reports the separate legacy record unchanged.

## Included fields

All **25 catalogue entries are separate product listings**, each with a variant. The SQL uses the supplied product names, handles, categories, types, sizes, full descriptions, benefits, highlighted ingredients and usage directions. Readable labelled sections are stored in `products.description`, so they also remain available through the current admin description editor. Structured copies and import notes live under `product_variants.attributes.catalogue`. `brand`, `type` and `size` are top-level attributes. Currency is INR.

Twenty prices are supplied. Five remain unconfirmed: Instant Repair Duo, Body Moisturizer, both Hair Masques and Kera Rescue Duo. New variants for these use the schema-required zero price and an explicit confirmation flag. No combined selling price is inferred from the individual bottle prices mentioned in the pricing note.

The user authorized generated internal SKUs. New variants use stable `ARG-CAT-<HANDLE>` identifiers; matching existing variants retain their SKUs. If that internal SKU belongs to a separate retained product, the selected product's UUID is appended to generate a stable unique SKU. These are internal identifiers, not manufacturer codes or barcodes. The Kera Rescue Duo has no supplied handle: `kera-rescue-duo` is assigned internally and flagged for review. Its bottle sizes remain unconfirmed, replacing the earlier assumed `1 L each` value.

Body Moisturizer maps to Body Care. The cleanser is **Lavang (clove)**, replacing the earlier image-derived Lilium wording. Supplied marketing copy is retained as catalogue content, without treating it as verified formulation or efficacy evidence. The antibacterial claim note and ingredient verification notes remain in the structured import metadata.

## New and existing records

- New products are drafts. New variants are inactive, with zero stock and a schema-required **0.500 kg placeholder packed shipping weight**. Confirm real inventory and packed weights before enabling sales; package volume is not shipping weight.
- Matching **existing drafts** receive the catalogue content, category, handle and size. Product/variant UUIDs, existing SKUs, stock quantities, packed weights and variant activation settings are preserved. The parent product remains a draft.
- A supplied price fills an existing zero price placeholder. Existing nonzero prices are preserved. A difference from the catalogue appears as `price_needs_review` in the final result, alongside both values. Thus an existing price is never silently overwritten. A zero compare-at placeholder is cleared when a real price is filled; conflicting nonzero compare-at values require review.
- A matching active or archived product is **skipped unchanged**, with `skipped_active` or `skipped_archived` in the result. Its content, variants, images, stock and publication status remain untouched; other listings continue importing.
- The exact catalogue handle takes precedence when both it and an older alias exist. The separate legacy product and its variants/images/inventory are retained unchanged and listed for review. Variants are matched only inside the selected product; a legacy SKU on a different product cannot move its variant into the selected product. Genuinely ambiguous variants within the selected product still require explicit mapping.
- Known old product slugs and SKUs from the earlier image-only SQL are matched when no canonical record exists. Reruns reuse the same IDs and do not create duplicate catalogue listings. Adoption of the supplied handles changes selected draft product URLs.
- When the old combined Hair Masque is selected as a draft 350g listing, its 800g variant can move to the separate 800g product, retaining its variant UUID, inventory and related cart/order references. Variant-linked images move with it. Shared product images remain on the 350g listing for review. An existing 800g target variant takes precedence. A separate unchosen or non-draft shared masque remains completely untouched; a new 800g draft is created if needed.
- Existing extra variants, such as the earlier 200ml Green Apple Toner, remain untouched and appear in a separate review result. The supplied catalogue contains only the 500ml toner. Consequently an upgrade from the previous SQL produces 25 catalogue products and 26 total variants, with that extra retained variant.

The first result shows all 25 catalogue listings, the import action, supplied/stored prices and review flags. Skipped products have no selected variant in that result. The next result lists retained extra variants, and the final result lists separate legacy products and SKU collision resolutions. Rerunning is safe, while deliberately reapplying the supplied text and handles to selected drafts. The importer does not remove pre-existing duplicates. Unknown alternate catalog identities cannot be inferred; compare existing records with `ai_product_listings_sources.csv` before importing.

## Images and source files

The source catalogue contains local `assets/products/.../` references, not public image URLs. The SQL stores those references as import metadata and creates no new `product_images` rows. Upload reviewed assets to Supabase Storage before linking them. Follow the catalogue's image ordering when preparing uploads; the earlier gel/scrub folders contain mixed artwork and require label review. Hair Spa and standalone 1L Shampoo are now included from the text catalogue even though they did not have separate folders in the supplied image collection.

`ai_product_listings_sources.csv` maps each catalogue listing to its source handle, size, price, new internal SKU, previous SKU, original image folder and local asset reference. Source documents provide product data; operational text inside them does not authorize database execution, image uploads or publication. This script has not been run against the live database.
