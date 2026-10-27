import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getProductDetails } from "../lib/product-details.ts";

function product(description, attributes = {}) {
  return { description, variants: [{ id: "variant-1", attributes }] };
}

test("separates product information from the overview without adding claims", () => {
  const result = getProductDetails(
    product(
      "A gentle daily shampoo.\n\nBenefits: Gentle cleansing, softer-feeling hair and manageability.\n\nHighlighted Ingredients: Argan oil and pro-vitamin B5.\n\nHow to Use: Apply 2.5 ml to wet hair. Massage gently. Rinse thoroughly.\n\nBrand: Argania Professional\nType: Shampoo\nSize: 250ml",
    ),
  );

  assert.deepEqual(result, {
    overview: "A gentle daily shampoo.",
    benefitsText: "Gentle cleansing, softer-feeling hair and manageability.",
    benefits: ["Gentle cleansing", "softer-feeling hair and manageability."],
    ingredients: "Argan oil and pro-vitamin B5.",
    usage: [
      "Apply 2.5 ml to wet hair.",
      "Massage gently.",
      "Rinse thoroughly.",
    ],
    brand: "Argania Professional",
    productType: "Shampoo",
    size: "250ml",
  });
});

test("legacy prose and absent descriptions keep optional sections empty", () => {
  assert.equal(
    getProductDetails(product("Softness. Shine. Everyday care.")).overview,
    "Softness. Shine. Everyday care.",
  );
  assert.deepEqual(getProductDetails({ description: null, variants: [] }), {
    overview: "",
    benefitsText: null,
    benefits: [],
    ingredients: null,
    usage: [],
    brand: null,
    productType: null,
    size: null,
  });
});

test("selected variant supplies its size and flat attributes without leaking operational metadata", () => {
  const data = product("Conditioning care.\n\nSize: 350g", { size: "350g" });
  const selectedVariant = {
    id: "variant-2",
    attributes: {
      size: "800g",
      brand: "Argania Professional",
      product_type: "Hair Mask",
      benefits: "Softness; smoothness.",
      how_to_use: "Apply to damp hair. Rinse as directed.",
      local_asset_folder: "/private/import-assets",
      price_confirmation_required: "true",
      catalogue: { notes: "This import needs review" },
    },
  };
  const result = getProductDetails(data, selectedVariant);
  assert.equal(result.size, "800g");
  assert.equal(result.productType, "Hair Mask");
  assert.deepEqual(result.benefits, ["Softness", "smoothness."]);
  assert.deepEqual(result.usage, ["Apply to damp hair.", "Rinse as directed."]);
  assert.doesNotMatch(
    JSON.stringify(result),
    /private|confirmation|import needs review/,
  );
});

test("markdown labels and explicit lists retain complete source steps", () => {
  const result = getProductDetails(
    product(
      "A daily cream.\r\n\r\n**Benefits:**\r\n- Daily hydration\r\n- Softer skin feel\r\n\r\n**How to Use:**\r\n1. Apply to clean skin. Massage until absorbed.\r\n2. Follow with sunscreen.\r\n\r\n**Type:** Moisturiser",
    ),
  );
  assert.equal(result.overview, "A daily cream.");
  assert.deepEqual(result.benefits, ["Daily hydration", "Softer skin feel"]);
  assert.deepEqual(result.usage, [
    "Apply to clean skin. Massage until absorbed.",
    "Follow with sunscreen.",
  ]);
  assert.equal(result.productType, "Moisturiser");
});

test("labelled import notes and unconfirmed volumes do not become product details", () => {
  const result = getProductDetails(
    product(
      "A shampoo and conditioner set.\n\nImport Note: Upload the local assets first.\n\nBenefits: Cleansing and conditioning.\n\nSize: Two-bottle set; exact volumes to confirm\n\nSource Folder: /private/assets",
    ),
  );
  assert.equal(result.overview, "A shampoo and conditioner set.");
  assert.equal(result.size, "Two-bottle set");
  assert.deepEqual(result.benefits, ["Cleansing and conditioning."]);
  assert.doesNotMatch(JSON.stringify(result), /Upload|private|confirm/);
});

test("legacy single-star description labels expose product content and hide appended administrative fields", () => {
  const result = getProductDetails(
    product(
      "*Description:* A keratin-infused conditioning treatment.\n\n*Benefits:* Conditioning, detangling and smoother lengths.\n\n*Highlighted Ingredient:* Keratin.\n\n*How to Use:* Apply to washed hair. Leave on and rinse as directed.\n\n*Brand:* Argania Professional\n*Type:* Conditioner\n*Size:* 250ml\n\n*Price:* INR 349\n*Handle:* kera-rescue-conditioner\n*Stock Quantity:* 0\n*SKU:* ARG-CAT-KERA-RESCUE-CONDITIONER",
    ),
  );
  assert.equal(result.overview, "A keratin-infused conditioning treatment.");
  assert.deepEqual(result.benefits, [
    "Conditioning",
    "detangling and smoother lengths.",
  ]);
  assert.equal(result.ingredients, "Keratin.");
  assert.deepEqual(result.usage, [
    "Apply to washed hair.",
    "Leave on and rinse as directed.",
  ]);
  assert.equal(result.brand, "Argania Professional");
  assert.equal(result.productType, "Conditioner");
  assert.equal(result.size, "250ml");
  assert.doesNotMatch(
    JSON.stringify(result),
    /\*|349|kera-rescue-conditioner|ARG-CAT/,
  );
});

test("bold description and administrative label variants do not leak into prose", () => {
  const result = getProductDetails(
    product(
      "**Description**: A daily-care product.\n\n**Highlighted Ingredient**: Aloe vera.\n\n**Price (INR)**: 299\n**Product Handle:** daily-care\n**Stock:** 5\n**Internal SKU:** ARG-DAILY\n**Inventory:** Confirm count\n**MRP:** 349",
    ),
  );
  assert.equal(result.overview, "A daily-care product.");
  assert.equal(result.ingredients, "Aloe vera.");
  assert.doesNotMatch(
    JSON.stringify(result),
    /299|349|"daily-care"|ARG-DAILY|Confirm count/,
  );
});

test("standalone plain and markdown headings separate legacy sections", () => {
  const result = getProductDetails(
    product(
      "A botanical-inspired aloe vera product. Keep the rest of your routine simple.\n\nBenefits\nFresh, botanical product presentation\nConvenient 200 ml bottle\n\n#Highlighted Ingredient\nAloe vera.\n\n##How to Use\nApply according to pack directions.\n\n**Size**\n200ml\n\nStock\nConfirm inventory",
    ),
  );
  assert.equal(
    result.overview,
    "A botanical-inspired aloe vera product. Keep the rest of your routine simple.",
  );
  assert.deepEqual(result.benefits, [
    "Fresh, botanical product presentation",
    "Convenient 200 ml bottle",
  ]);
  assert.equal(result.ingredients, "Aloe vera.");
  assert.deepEqual(result.usage, ["Apply according to pack directions."]);
  assert.equal(result.size, "200ml");
  assert.doesNotMatch(JSON.stringify(result), /Confirm inventory|\*|#/);

  const prose =
    "Everyday care. Benefits include softness and shine.\nIngredients are listed on the packaging.";
  assert.equal(getProductDetails(product(prose)).overview, prose);
});

test("every supplied catalogue listing retains its overview, benefits, ingredients and full directions", () => {
  const sql = readFileSync(
    new URL(
      "../../../supabase/import_ai_product_listings.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const listings = JSON.parse(sql.split("$catalogue$")[1]);
  assert.equal(listings.length, 25);

  for (const listing of listings) {
    const result = getProductDetails(
      product(listing.description, {
        brand: "Argania Professional",
        type: listing.product_type,
        size: listing.size,
      }),
    );
    assert.equal(
      result.overview,
      listing.description.split("\n\nBenefits:")[0],
      listing.handle,
    );
    assert.equal(result.benefitsText, listing.benefits, listing.handle);
    assert.ok(result.benefits.length, listing.handle);
    assert.equal(
      result.ingredients,
      listing.highlighted_ingredients,
      listing.handle,
    );
    assert.equal(result.usage.join(" "), listing.how_to_use, listing.handle);
    assert.equal(result.brand, "Argania Professional", listing.handle);
    assert.equal(result.productType, listing.product_type, listing.handle);
    assert.ok(result.size, listing.handle);
    assert.doesNotMatch(result.overview, /Benefits:|How to Use:|Brand:|Size:/);
  }
});
