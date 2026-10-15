import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Truck, ShieldCheck, RefreshCw, Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import {
  ProductCard,
  ProductDetailPurchaseBox,
} from "@/components/storefront/ProductCard";
import type { Product, ProductVariant } from "@/types/database";
import { toBengaliNumber } from "@/lib/utils";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("title_bn, title_en, description_bn, seo_title, seo_description")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .single();

  if (!product) {
    return { title: "পণ্য পাওয়া যায়নি" };
  }

  return {
    title: product.seo_title || `${product.title_bn} | ${product.title_en}`,
    description:
      product.seo_description || product.description_bn.slice(0, 160),
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const supabase = createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(*), product_images(*), product_variants(*)")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .single();

  if (!product) {
    notFound();
  }

  const typedProduct = product as Product;
  const activeVariants = (typedProduct.product_variants || []).filter(
    (v: ProductVariant) => v.is_active
  );

  // Fetch genuine approved reviews & related products
  const [{ data: reviews }, { data: relatedProducts }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(full_name)")
      .eq("product_id", typedProduct.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("is_published", true)
      .eq("is_archived", false)
      .eq("category_id", typedProduct.category_id)
      .neq("id", typedProduct.id)
      .limit(4),
  ]);

  const primaryImage =
    typedProduct.product_images && typedProduct.product_images.length > 0
      ? typedProduct.product_images[0].image_url
      : null;

  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: typedProduct.title_bn,
    alternateName: typedProduct.title_en,
    description: typedProduct.description_bn,
    sku: typedProduct.sku,
    brand: {
      "@type": "Brand",
      name: typedProduct.brand || "SashroyiDam",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: typedProduct.price_bdt,
      availability:
        !typedProduct.track_inventory || typedProduct.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="h-20 bg-white border-b" />}>
        <Header />
      </Suspense>

      <main className="flex-1 container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-500 mb-6">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand">
                হোম
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:text-brand">
                সকল পণ্য
              </Link>
            </li>
            {typedProduct.categories && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/products?category=${typedProduct.categories.slug}`}
                    className="hover:text-brand"
                  >
                    {typedProduct.categories.name_bn}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-gray-800 font-medium truncate max-w-[220px]">
              {typedProduct.title_bn}
            </li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-xl border border-border p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-5 space-y-3">
            <div className="aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={typedProduct.title_bn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center text-brand">
                  <p className="text-sm font-bold uppercase">
                    সাশ্রয়ী দাম | Sashroyi Daam
                  </p>
                  <p className="text-lg font-bold mt-2">{typedProduct.title_bn}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details & Purchase Box */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                <span>SKU: {typedProduct.sku}</span>
                {typedProduct.brand && (
                  <>
                    <span>•</span>
                    <span>ব্র্যান্ড: {typedProduct.brand}</span>
                  </>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">
                {typedProduct.title_bn}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{typedProduct.title_en}</p>

              {/* Interactive Variant, Quantity & Add-to-Cart */}
              <ProductDetailPurchaseBox
                product={typedProduct}
                variants={activeVariants}
              />

              {/* Description */}
              <div className="space-y-2 mt-4">
                <h2 className="text-base font-bold text-gray-900">
                  পণ্যের বিস্তারিত বিবরণ:
                </h2>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                  {typedProduct.description_bn}
                </p>
              </div>
            </div>

            {/* Delivery & Return Information Box */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Truck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">ডেলিভারি চার্জ</p>
                  <p className="text-gray-600">
                    ঢাকায় ৳৬০, ঢাকার বাইরে ৳১২০
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">ক্যাশ অন ডেলিভারি</p>
                  <p className="text-gray-600">পণ্য হাতে পেয়ে পেমেন্ট সুবিধা</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <RefreshCw className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">সহজ রিটার্ন</p>
                  <p className="text-gray-600">ত্রুটিপূর্ণ পণ্যে ৭ দিনের রিটার্ন</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Genuine Customer Reviews Section */}
        <section className="mt-10 bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            গ্রাহকদের প্রকৃত মতামত ({toBengaliNumber(reviews?.length || 0)})
          </h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="border-b border-gray-100 pb-4 last:border-none"
                >
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-800">{rev.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    — {rev.profiles?.full_name || "যাচাইকৃত ক্রেতা"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              এই পণ্যটিতে এখনো কোনো রিভিউ জমা পড়েনি। পণ্যটি ক্রয় করার পর আপনি আপনার প্রকৃত অভিজ্ঞতা শেয়ার করতে পারবেন।
            </p>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              একই ক্যাটাগরির আরও পণ্য
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {(relatedProducts as Product[]).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
