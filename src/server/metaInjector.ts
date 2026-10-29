import type { Product } from '../types/index.ts';

/**
 * Dynamically injects tailored product-specific OpenGraph, Twitter, and Schema.org meta tags into index.html
 */
export function injectProductMeta(
  html: string,
  product: Product | null | undefined,
  baseUrl: string
): string {
  if (!product) return html;

  const title = `${product.titleBn} | সাশ্রয়ী দাম - Sashroyi Daam`;
  const desc = `দাম: ৳${product.price.toLocaleString('bn-BD')} | ${product.categoryNameBn || 'সাশ্রয়ী দাম'} | ১০০% আসল পণ্য, সারাদেশে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি।`;
  const productUrl = `${baseUrl}?product=${product.slug || product.id}`;
  const ogImage = `${baseUrl}/api/og/product/${product.slug || product.id}`;

  let transformed = html;

  // 1. Update <title>
  transformed = transformed.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${title}</title>`
  );

  // 2. Update <meta name="description">
  transformed = transformed.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${desc}" />`
  );

  // 3. Update existing OpenGraph tags
  transformed = transformed.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`
  );

  transformed = transformed.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:description" content="${desc}" />`
  );

  transformed = transformed.replace(
    /<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:type" content="product" />`
  );

  // 4. Update Twitter Card tags
  transformed = transformed.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`
  );

  transformed = transformed.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${desc}" />`
  );

  // 5. Append OpenGraph canonical image and URL tags
  const ogExtraTags = `
    <!-- Product Dynamic OpenGraph & Twitter Previews -->
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:secure_url" content="${ogImage}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${product.titleBn}" />
    <meta property="product:price:amount" content="${product.price}" />
    <meta property="product:price:currency" content="BDT" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="${product.titleBn}" />
    <link rel="canonical" href="${productUrl}" />

    <!-- Schema.org Product Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": ${JSON.stringify(product.titleBn)},
      "alternateName": ${JSON.stringify(product.titleEn || '')},
      "image": [${JSON.stringify(ogImage)}],
      "description": ${JSON.stringify(product.descriptionBn || desc)},
      "sku": ${JSON.stringify(product.sku || '')},
      "brand": {
        "@type": "Brand",
        "name": ${JSON.stringify(product.brand || 'সাশ্রয়ী দাম')}
      },
      "offers": {
        "@type": "Offer",
        "url": ${JSON.stringify(productUrl)},
        "priceCurrency": "BDT",
        "price": "${product.price}",
        "availability": "${product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}",
        "itemCondition": "https://schema.org/NewCondition"
      }
    }
    </script>
`;

  transformed = transformed.replace('</head>', `${ogExtraTags}\n  </head>`);

  return transformed;
}
