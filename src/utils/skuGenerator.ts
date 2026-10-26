import type { Category, Product } from '../types/index.ts';

/**
 * Maps common category keywords or slugs to clean, standardized 3-letter uppercase prefixes
 */
const KNOWN_CATEGORY_PREFIXES: Record<string, string> = {
  // Books & Stationery
  book: 'BOK',
  books: 'BOK',
  stationery: 'STA',
  খাতা: 'STA',
  বই: 'BOK',

  // Fashion & Apparel
  shirt: 'SHT',
  shirts: 'SHT',
  polo: 'POL',
  tshirt: 'TEE',
  fashion: 'FAS',
  clothing: 'CLO',
  panjabi: 'PAN',
  পোশাক: 'FAS',
  শার্ট: 'SHT',
  পাঞ্জাবি: 'PAN',

  // Kitchen & Home
  kitchen: 'KIT',
  cookware: 'COK',
  home: 'HOM',
  living: 'LIV',
  appliance: 'APP',
  রান্নাঘর: 'KIT',
  গৃহস্থালি: 'HOM',

  // Groceries & Food
  grocery: 'GRO',
  food: 'FOD',
  organic: 'ORG',
  honey: 'HON',
  spice: 'SPI',
  spices: 'SPI',
  খাদ্য: 'FOD',
  মধু: 'HON',

  // Shoes & Footwear
  shoe: 'SHO',
  shoes: 'SHO',
  footwear: 'FOT',
  sneaker: 'SNK',
  জুতো: 'SHO',
  জুতা: 'SHO',

  // Electronics & Gadgets
  electronic: 'ELE',
  electronics: 'ELE',
  gadget: 'GAD',
  gadgets: 'GAD',
  mobile: 'MOB',
  ইলেকট্রনিক্স: 'ELE',

  // Beauty & Personal Care
  beauty: 'BEA',
  cosmetics: 'COS',
  skincare: 'SKI',
  health: 'HEA',
  সৌন্দর্য: 'BEA',
  রূপচর্চা: 'BEA',

  // Bags & Accessories
  bag: 'BAG',
  bags: 'BAG',
  backpack: 'BCK',
  watch: 'WAT',
  watches: 'WAT',
  ঘড়ি: 'WAT',
  ব্যাগ: 'BAG',

  // Baby & Toys
  baby: 'BAB',
  kids: 'KID',
  toy: 'TOY',
  toys: 'TOY',
  বাচ্চা: 'BAB'
};

/**
 * Extracts a 3-letter uppercase prefix for a category.
 */
export function getCategoryPrefix(category?: Category | { slug?: string; nameEn?: string; nameBn?: string } | string | null): string {
  if (!category) return 'PRD';

  let slug = '';
  let nameEn = '';
  let nameBn = '';

  if (typeof category === 'string') {
    slug = category.toLowerCase().trim();
  } else {
    slug = (category.slug || '').toLowerCase().trim();
    nameEn = (category.nameEn || '').toLowerCase().trim();
    nameBn = (category.nameBn || '').trim();
  }

  // Check known mapping against slug and English name
  const searchTokens = [
    ...slug.split(/[-_\s]+/),
    ...nameEn.split(/[-_\s]+/)
  ].filter(Boolean);

  for (const token of searchTokens) {
    if (KNOWN_CATEGORY_PREFIXES[token]) {
      return KNOWN_CATEGORY_PREFIXES[token];
    }
  }

  // Check Bangla name keywords
  for (const [key, prefix] of Object.entries(KNOWN_CATEGORY_PREFIXES)) {
    if (nameBn.includes(key)) {
      return prefix;
    }
  }

  // Extract first 3 ASCII letters from English name or slug
  const combined = (nameEn + ' ' + slug).replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (combined.length >= 3) {
    return combined.slice(0, 3);
  } else if (combined.length > 0) {
    return combined.padEnd(3, 'X');
  }

  return 'CAT';
}

/**
 * Generates a random 4-digit number (1000 - 9999).
 */
export function generateRandom4Digits(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generates a unique category-based SKU in format [CAT_3_LETTERS]-[4_DIGITS] (e.g. KIT-4821).
 * Checks against existing products/SKUs to prevent duplication.
 */
export function generateCategorySku(
  category?: Category | { slug?: string; nameEn?: string; nameBn?: string } | string | null,
  existingProductsOrSkus?: (Product | string)[]
): string {
  const prefix = getCategoryPrefix(category);

  const existingSet = new Set<string>();
  if (existingProductsOrSkus && existingProductsOrSkus.length > 0) {
    for (const item of existingProductsOrSkus) {
      if (typeof item === 'string') {
        if (item.trim()) existingSet.add(item.trim().toUpperCase());
      } else if (item && item.sku) {
        existingSet.add(item.sku.trim().toUpperCase());
      }
    }
  }

  // Attempt up to 25 times to generate a non-conflicting 4-digit code
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = `${prefix}-${generateRandom4Digits()}`;
    if (!existingSet.has(code)) {
      return code;
    }
  }

  // Fallback with timestamp digits if collision occurs
  const timestampDigits = Date.now().toString().slice(-4);
  return `${prefix}-${timestampDigits}`;
}

/**
 * Generates a clean variant SKU based on the parent SKU and variant option name.
 * e.g., KIT-4821 and 'XL (৪৪)' -> KIT-4821-XL
 */
export function generateVariantSku(baseSku: string, variantOptionName: string, index = 1): string {
  const cleanBase = (baseSku || 'SKU').trim();
  // Extract alphanumeric letters/numbers from option label
  const rawClean = variantOptionName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = rawClean.length > 0 ? rawClean.slice(0, 5) : `V${index}`;
  return `${cleanBase}-${suffix}`;
}
