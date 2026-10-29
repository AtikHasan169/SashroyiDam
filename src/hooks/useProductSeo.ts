import { useEffect } from 'react';
import type { Product } from '../types/index.ts';

/**
 * useProductSeo:
 * Dynamically synchronizes document title, meta tags, and OpenGraph/Twitter cards
 * during client-side SPA navigation so when users copy or share links from the browser,
 * the active product metadata is cleanly represented.
 */
export function useProductSeo(product: Product | null | undefined) {
  useEffect(() => {
    if (!product) return;

    const originalTitle = document.title;
    const cleanTitle = `${product.titleBn}${product.titleEn ? ` (${product.titleEn})` : ''} - সাশ্রয়ী দাম`;
    document.title = cleanTitle;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const productUrl = `${origin}?product=${product.slug || product.id}`;
    const dynamicOgImage = `${origin}/api/og/product/${product.slug || product.id}`;
    const description = (product.descriptionBn || product.descriptionEn || 'সাশ্রয়ী দামে ১০০% আসল পণ্য কিনুন হোম ডেলিভারিতে।')
      .replace(/<[^>]*>?/gm, '')
      .substring(0, 160);

    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', cleanTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', dynamicOgImage);
    setMeta('property', 'og:url', productUrl);
    setMeta('property', 'og:type', 'product');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', cleanTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', dynamicOgImage);

    return () => {
      document.title = originalTitle;
    };
  }, [product]);
}
