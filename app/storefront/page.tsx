import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Tag, CheckCircle2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product, Category } from "@/types/database";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const [
    { data: banners },
    { data: categories },
    { data: featuredProducts },
    { data: newArrivals },
  ] = await Promise.all([
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("is_published", true)
      .eq("is_archived", false)
      .eq("is_featured", true)
      .limit(8),
    supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("is_published", true)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const hero = banners?.[0] || {
    title_bn: "আপনার সংসারের প্রতিদিনের প্রয়োজন, এখন আরও সাশ্রয়ী দামে",
    subtitle_bn:
      "যাচাইকৃত মান, সঠিক বিবরণ এবং দ্রুত ডেলিভারির নিশ্চয়তায় সাশ্রয়ী দাম | Sashroyi Daam আছে আপনার পাশে।",
    cta_text_bn: "সকল পণ্য দেখুন",
    cta_link: "/products",
    badge_text_bn: "সাশ্রয়ী দাম স্পেশাল",
  };

  return (
    <>
      <Suspense fallback={<div className="h-20 bg-white border-b" />}>
        <Header />
      </Suspense>

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-brand-dark via-brand to-emerald-800 text-white py-12 sm:py-16">
          <div className="container grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              {hero.badge_text_bn && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{hero.badge_text_bn}</span>
                </span>
              )}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {hero.title_bn}
              </h1>
              <p className="text-sm sm:text-lg text-emerald-50 max-w-2xl leading-relaxed">
                {hero.subtitle_bn}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href={hero.cta_link || "/products"}
                  className="bg-white text-brand font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2 text-sm sm:text-base shadow-sm"
                >
                  <span>{hero.cta_text_bn}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/track-order"
                  className="border border-white/40 text-white font-semibold px-5 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm sm:text-base"
                >
                  অর্ডার ট্র্যাক করুন
                </Link>
              </div>
            </div>

            {/* Trust Card on Hero Right */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 space-y-3.5">
              <div className="border-b border-white/20 pb-3">
                <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                  কেন সাশ্রয়ী দাম (SashroyiDam)?
                </p>
                <h2 className="text-lg font-bold mt-0.5">
                  আপনার পছন্দ, অশেষ সম্ভাবনা
                </h2>
              </div>
              <ul className="space-y-2.5 text-sm text-emerald-50">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-1" />
                  <span>অতিরঞ্জিত বিজ্ঞাপন নয়—পণ্যের আসল বিবরণ ও ন্যায্য দাম</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-1" />
                  <span>পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা (Cash on Delivery)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-1" />
                  <span>সরাসরি আমাদের ফেসবুক পেজে (@sashroyidaam) দ্রুত সাপোর্ট</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        {categories && categories.length > 0 && (
          <section className="container py-10 sm:py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  জনপ্রিয় ক্যাটাগরি (Categories)
                </h2>
                <p className="text-sm text-gray-600">
                  আপনার প্রয়োজনীয় বিভাগ থেকে সহজেই পণ্য বেছে নিন
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <span>সব দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(categories as Category[]).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group bg-white p-5 rounded-lg border border-border hover:border-brand hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block text-xs font-semibold text-brand bg-brand-light px-2.5 py-1 rounded mb-2">
                      {cat.name_en}
                    </span>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-brand">
                      {cat.name_bn}
                    </h3>
                    {cat.description_bn && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {cat.description_bn}
                      </p>
                    )}
                  </div>
                  <span className="mt-4 text-xs font-semibold text-brand flex items-center gap-1">
                    <span>পণ্য দেখুন</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured / Selected Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="container py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    আপনার জন্য বাছাই করা (Featured Products)
                  </h2>
                  <p className="text-sm text-gray-600">
                    সাশ্রয়ী দামে আমাদের সেরা ও জনপ্রিয় পণ্যসমূহ
                  </p>
                </div>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-brand hover:underline"
              >
                সকল পণ্য →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {(featuredProducts as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals && newArrivals.length > 0 && (
          <section className="container py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  নতুন কালেকশন (New Arrivals)
                </h2>
                <p className="text-sm text-gray-600">
                  সম্প্রতি স্টোরে যুক্ত হওয়া নতুন পণ্যসমূহ
                </p>
              </div>
              <Link
                href="/products?sort=newest"
                className="text-sm font-semibold text-brand hover:underline"
              >
                সব নতুন পণ্য →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {(newArrivals as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
