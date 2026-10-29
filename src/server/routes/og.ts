import { Router } from 'express';
import { ensureDatabaseReady } from '../db.ts';

const router = Router();

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

router.get('/product/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const db = await ensureDatabaseReady();

    const norm = (slugOrId || '').toLowerCase().trim();
    const product = db.products.find(
      (p) =>
        ((p.slug && p.slug.toLowerCase() === norm) || p.id === slugOrId) &&
        !p.isArchived
    );

    const store = db.storeSettings || {
      storeNameBn: 'সাশ্রয়ী দাম',
      storeNameEn: 'Sashroyi Daam',
      taglineBn: 'সাশ্রয়ী দামে সেরা কেনাকাটা'
    };

    const titleBn = escapeXml(product ? product.titleBn : store.storeNameBn);
    const titleEn = escapeXml(product ? product.titleEn || '' : store.storeNameEn);
    const categoryName = escapeXml(product?.categoryNameBn || 'প্রিমিয়াম কালেকশন');
    const priceText = product ? `৳${product.price.toLocaleString('bn-BD')}` : 'সাশ্রয়ী মূল্য';
    const origPriceText =
      product && product.originalPrice && product.originalPrice > product.price
        ? `৳${product.originalPrice.toLocaleString('bn-BD')}`
        : '';
    const discountText =
      product && product.originalPrice && product.originalPrice > product.price
        ? `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% ছাড়`
        : '';

    // Generate responsive 1200x630 vector SVG OpenGraph card
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06281F"/>
      <stop offset="50%" stop-color="#0F4C3A"/>
      <stop offset="100%" stop-color="#145A46"/>
    </linearGradient>

    <!-- Card Background -->
    <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.04"/>
    </linearGradient>

    <!-- Price Badge Gradient -->
    <linearGradient id="priceGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <radialGradient id="glow" cx="950" cy="180" r="450" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34D399" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#0F4C3A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Canvas Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <circle cx="950" cy="180" r="450" fill="url(#glow)"/>

  <!-- Decorative Border Accents -->
  <rect x="30" y="30" width="1140" height="570" rx="24" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="2"/>
  <rect x="36" y="36" width="1128" height="558" rx="20" stroke="#34D399" stroke-opacity="0.25" stroke-width="1"/>

  <!-- Top Store Branding Strip -->
  <g transform="translate(80, 75)">
    <!-- Brand Icon -->
    <rect width="44" height="44" rx="12" fill="#34D399" fill-opacity="0.2" stroke="#34D399" stroke-width="1.5"/>
    <path d="M14 28V16L22 12L30 16V28L22 32L14 28Z" fill="#34D399"/>
    <circle cx="22" cy="22" r="3" fill="#06281F"/>

    <!-- Brand Text -->
    <text x="60" y="22" font-family="'Hind Siliguri', 'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" letter-spacing="0.5">
      সাশ্রয়ী দাম <tspan fill="#A7F3D0" font-size="18" font-weight="500">| Sashroyi Daam</tspan>
    </text>
    <text x="60" y="42" font-family="'Hind Siliguri', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="400" fill="#E2E8F0" fill-opacity="0.8">
      সারা বাংলাদেশে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা
    </text>

    <!-- Top Verified Pill -->
    <rect x="860" y="2" width="180" height="36" rx="18" fill="#FFFFFF" fill-opacity="0.1" stroke="#34D399" stroke-width="1"/>
    <circle cx="880" cy="20" r="6" fill="#10B981"/>
    <text x="898" y="25" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF">
      ১০০% আসল পণ্য
    </text>
  </g>

  <!-- Left Column: Product Information -->
  <g transform="translate(80, 185)">
    <!-- Category Pill -->
    <rect x="0" y="0" width="${Math.max(120, categoryName.length * 15 + 30)}" height="32" rx="16" fill="#064E3B" stroke="#34D399" stroke-width="1.2"/>
    <text x="16" y="21" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="14" font-weight="600" fill="#A7F3D0">
      ${categoryName}
    </text>

    <!-- Main Bengali Title (multi-line supported) -->
    <text x="0" y="80" font-family="'Hind Siliguri', 'Segoe UI', system-ui, sans-serif" font-size="38" font-weight="700" fill="#FFFFFF" style="letter-spacing: -0.5px;">
      ${titleBn.length > 34 ? titleBn.slice(0, 32) + '...' : titleBn}
    </text>

    <!-- Sub English Title -->
    ${
      titleEn
        ? `<text x="0" y="125" font-family="'Segoe UI', system-ui, sans-serif" font-size="20" font-weight="400" fill="#D1D5DB">
      ${titleEn.length > 48 ? titleEn.slice(0, 46) + '...' : titleEn}
    </text>`
        : ''
    }

    <!-- Price Section Pill -->
    <g transform="translate(0, 160)">
      <!-- Main Price Tag -->
      <rect x="0" y="0" width="220" height="64" rx="18" fill="url(#priceGrad)" filter="drop-shadow(0 4px 12px rgba(245, 158, 11, 0.35))"/>
      <text x="24" y="44" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="34" font-weight="800" fill="#FFFFFF">
        ${priceText}
      </text>

      ${
        origPriceText
          ? `<!-- Original Price with Strikethrough -->
      <text x="245" y="42" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="24" font-weight="500" fill="#9CA3AF" text-decoration="line-through">
        ${origPriceText}
      </text>
      <!-- Discount Badge -->
      <rect x="360" y="14" width="90" height="32" rx="10" fill="#EF4444"/>
      <text x="375" y="36" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">
        ${discountText}
      </text>`
          : ''
      }
    </g>

    <!-- Trust Badges Footer inside card -->
    <g transform="translate(0, 260)">
      <rect x="0" y="0" width="200" height="38" rx="12" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15"/>
      <text x="18" y="24" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="13" font-weight="600" fill="#E2E8F0">
        🚚 ক্যাশ অন ডেলিভারি
      </text>

      <rect x="215" y="0" width="190" height="38" rx="12" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15"/>
      <text x="233" y="24" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="13" font-weight="600" fill="#E2E8F0">
        🔄 ৭ দিনের রিটার্ন গ্যারান্টি
      </text>
    </g>
  </g>

  <!-- Right Column Visual Card -->
  <g transform="translate(760, 155)">
    <rect width="360" height="360" rx="24" fill="url(#cardGrad)" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="2"/>
    <circle cx="180" cy="180" r="130" fill="#34D399" fill-opacity="0.1" stroke="#34D399" stroke-opacity="0.3" stroke-width="1.5"/>

    <!-- Shopping Bag Icon Illustration -->
    <path d="M120 150H240L255 270H105L120 150Z" fill="#34D399" fill-opacity="0.25" stroke="#34D399" stroke-width="3"/>
    <path d="M150 150V120C150 103.431 163.431 90 180 90C196.569 90 210 103.431 210 120V150" stroke="#A7F3D0" stroke-width="3" stroke-linecap="round"/>
    <circle cx="180" cy="205" r="18" fill="#F59E0B"/>
    <path d="M173 205L178 210L188 198" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Order CTA Badge -->
    <rect x="50" y="300" width="260" height="42" rx="12" fill="#10B981" filter="drop-shadow(0 4px 8px rgba(16, 185, 129, 0.4))"/>
    <text x="180" y="327" font-family="'Hind Siliguri', system-ui, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF" text-anchor="middle">
      অর্ডার করতে ভিজিট করুন ➔
    </text>
  </g>

  <!-- Bottom Website Footer -->
  <text x="600" y="585" font-family="'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="500" fill="#A7F3D0" text-anchor="middle" letter-spacing="1">
    SASHROYIDAAM.COM · সাশ্রয়ী দামে বিশ্বস্ত কেনাকাটা
  </text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(svg);
  } catch (err: any) {
    console.error('OG Image Generation Error:', err);
    res.status(500).send('<svg width="1200" height="630"><text x="100" y="300" font-size="30">সাশ্রয়ী দাম</text></svg>');
  }
});

export default router;
