import type { CatalogProduct, CatalogVariant } from "./catalog";

export interface ProductDetails {
  overview: string;
  benefitsText: string | null;
  benefits: string[];
  ingredients: string | null;
  usage: string[];
  brand: string | null;
  productType: string | null;
  size: string | null;
}

type DetailField =
  "overview" | "benefits" | "ingredients" | "usage" | "brand" | "type" | "size";

const descriptionHeadings =
  /^[\t ]*(?:#{1,6}[\t ]*)?(?:\*{1,2})?(Description|Benefits|Highlighted Ingredients?|Ingredients?|How to Use|Directions|Usage|Brand|Product Type|Type|Size|Import Notes?|Importer Notes?|Catalogue Notes?|Catalog Notes?|Operational Notes?|Notes|Local Asset Folder|Asset Folder|Source Folder|Import Status|Price Confirmation|Inventory Confirmation|Shipping Weight Confirmation|(?:Selling |Sale |Compare[- ]At )?Price(?:[\t ]*\(INR\)| in INR)?|MRP|(?:Product )?Handle|Slug|Stock(?: Quantity)?|Inventory|(?:Internal )?SKU)(?:\*{1,2})?[\t ]*(?::(?:\*{1,2})?[\t ]*|$)/gim;

function normalizeText(value: string | undefined | null): string {
  return (value ?? "").replace(/\r\n?/g, "\n").trim();
}

function inlineText(value: string | undefined | null): string | null {
  return normalizeText(value).replace(/\s+/g, " ") || null;
}

function detailField(heading: string): DetailField | null {
  switch (heading.toLowerCase()) {
    case "description":
      return "overview";
    case "benefits":
      return "benefits";
    case "highlighted ingredient":
    case "highlighted ingredients":
    case "ingredient":
    case "ingredients":
      return "ingredients";
    case "how to use":
    case "directions":
    case "usage":
      return "usage";
    case "brand":
      return "brand";
    case "product type":
    case "type":
      return "type";
    case "size":
      return "size";
    default:
      return null;
  }
}

function parseDescription(description: string | null) {
  const text = normalizeText(description);
  const headings = [...text.matchAll(descriptionHeadings)];
  const sections: Partial<Record<DetailField, string>> = {};

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]!;
    const field = detailField(heading[1]!);
    if (!field) continue;

    const content = text
      .slice(heading.index + heading[0].length, headings[index + 1]?.index)
      .trim();
    if (content)
      sections[field] = [sections[field], content].filter(Boolean).join("\n");
  }

  return {
    overview: [text.slice(0, headings[0]?.index).trim(), sections.overview]
      .filter(Boolean)
      .join("\n\n"),
    sections,
  };
}

function attributeValue(
  variant: CatalogVariant | undefined,
  ...keys: string[]
) {
  const attributes = Object.entries(variant?.attributes ?? {});
  for (const key of keys) {
    const value = attributes.find(
      ([name]) => name.toLowerCase().replace(/[\s-]+/g, "_") === key,
    )?.[1];
    if (typeof value === "string" && inlineText(value)) return value;
  }
  return null;
}

function listLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

function benefitsList(text: string | null): string[] {
  if (!text) return [];
  const lines = listLines(text);
  return (lines.length > 1 ? lines : text.split(/\s*[,;]\s*/))
    .map((benefit) => benefit.replace(/^and\s+/i, "").trim())
    .filter(Boolean);
}

function usageSteps(text: string | null): string[] {
  if (!text) return [];
  const lines = listLines(text);
  if (lines.length > 1) return lines;

  // Sentence segmentation keeps decimal quantities such as 2.5 ml together.
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  return [...segmenter.segment(lines[0] ?? text)]
    .map(({ segment }) => segment.trim())
    .filter(Boolean);
}

function displaySize(value: string | null): string | null {
  const size = inlineText(value)?.replace(
    /;\s*(?:exact\s+)?(?:volumes?|sizes?)\s+to\s+(?:be\s+)?confirm.*$/i,
    "",
  );
  if (
    !size ||
    /^(?:unknown|unspecified|(?:size\s+)?to\s+(?:be\s+)?confirm(?:ed)?)$/i.test(
      size,
    )
  ) {
    return null;
  }
  return size;
}

/** Read shopper-facing details from catalog content without exposing import metadata. */
export function getProductDetails(
  product: Pick<CatalogProduct, "description" | "variants">,
  variant: CatalogVariant | undefined = product.variants[0],
): ProductDetails {
  const { overview, sections } = parseDescription(product.description);
  const benefitsText = inlineText(
    sections.benefits ?? attributeValue(variant, "benefits"),
  );
  const benefitsSource =
    sections.benefits ?? attributeValue(variant, "benefits");
  const usageSource =
    sections.usage ??
    attributeValue(variant, "how_to_use", "usage", "directions");
  const variantSize = attributeValue(variant, "size");

  return {
    overview,
    benefitsText,
    benefits: benefitsList(benefitsSource),
    ingredients: inlineText(
      sections.ingredients ??
        attributeValue(variant, "highlighted_ingredients", "ingredients"),
    ),
    usage: usageSteps(usageSource),
    brand: inlineText(attributeValue(variant, "brand") ?? sections.brand),
    productType: inlineText(
      attributeValue(variant, "type", "product_type") ?? sections.type,
    ),
    size: displaySize(variantSize ?? sections.size ?? null),
  };
}
