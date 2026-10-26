/**
 * Common Bengali to English word translations for high-readability URLs
 */
const COMMON_WORD_MAP: Record<string, string> = {
  'ডিসেম্বরের': 'december',
  'শহরে': 'city',
  'সবুজ': 'sobuj',
  'আহম্মদ': 'ahammad',
  'মুরসালিন': 'mursalin',
  'নতুন': 'new',
  'স্মার্ট': 'smart',
  'ওয়াচ': 'watch',
  'শার্ট': 'shirt',
  'পাঞ্জাবি': 'panjabi',
  'পোশাক': 'clothing',
  'রান্নাঘর': 'kitchen',
  'বই': 'book',
  'জুতো': 'shoes',
  'জুতা': 'shoes',
  'মধু': 'honey',
  'মসলা': 'spices',
  'গ্যাজেট': 'gadget',
  'ব্যাগ': 'bag',
  'সুতি': 'cotton',
  'কালো': 'black',
  'সাদা': 'white',
  'নীল': 'blue'
};

/**
 * Phonetic character map for transliterating remaining Bengali characters to English alphabet
 */
const BN_TO_EN_CHAR_MAP: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': ''
};

/**
 * Converts any text into clean, lowercase English words with spaces replaced by single hyphens (-).
 */
export function cleanSlug(text: string): string {
  if (!text) return '';

  let slug = text.trim();

  // 1. Replace known full words
  for (const [bnWord, enWord] of Object.entries(COMMON_WORD_MAP)) {
    if (slug.includes(bnWord)) {
      slug = slug.replace(new RegExp(bnWord, 'g'), ` ${enWord} `);
    }
  }

  // 2. Transliterate any remaining Bengali characters to English letters
  let transliterated = '';
  for (const char of slug) {
    if (BN_TO_EN_CHAR_MAP[char] !== undefined) {
      transliterated += BN_TO_EN_CHAR_MAP[char];
    } else {
      transliterated += char;
    }
  }

  slug = transliterated.toLowerCase();

  // 3. Replace spaces, underscores, slashes, and separators with dashes
  slug = slug.replace(/[\s_./\\|+=—–:;?!,"'#@$%^&*()[\]{}<>]+/g, '-');

  // 4. Remove any remaining non-alphanumeric and non-hyphen characters
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // 5. Collapse consecutive hyphens into single hyphen
  slug = slug.replace(/-+/g, '-');

  // 6. Strip leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Generates an English dash-separated product slug, resolving collisions with sequential counters (-2, -3).
 *
 * Example:
 * - "Premium Cotton Panjabi" -> "premium-cotton-panjabi"
 * - If collision exists -> "premium-cotton-panjabi-2"
 */
export function generateProductSlug(
  titleEn?: string | null,
  titleBn?: string | null,
  existingSlugs?: string[],
  currentProductId?: string,
  existingProducts?: Array<{ id: string; slug: string }>
): string {
  const forbiddenSet = new Set<string>();

  if (existingProducts && existingProducts.length > 0) {
    for (const p of existingProducts) {
      if (p.id !== currentProductId && p.slug) {
        forbiddenSet.add(p.slug.toLowerCase().trim());
      }
    }
  } else if (existingSlugs && existingSlugs.length > 0) {
    for (const s of existingSlugs) {
      if (s) {
        forbiddenSet.add(s.toLowerCase().trim());
      }
    }
  }

  // Primary source: English title
  let base = cleanSlug(titleEn || '');

  // Secondary fallback: Bengali title (transliterated to English letters)
  if (!base || base.length < 2) {
    base = cleanSlug(titleBn || '');
  }

  // Final fallback
  if (!base || base.length < 2) {
    base = 'product';
  }

  // If unique, use directly
  if (!forbiddenSet.has(base)) {
    return base;
  }

  // If duplicate, append counter: -2, -3, -4...
  let counter = 2;
  while (forbiddenSet.has(`${base}-${counter}`)) {
    counter++;
  }

  return `${base}-${counter}`;
}
