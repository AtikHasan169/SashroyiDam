import React, { Suspense } from "react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product, Category } from "@/types/database";
import { toBengaliNumber } from "@/lib/utils";

interface CatalogPageProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    inStock?: string;
    page?: string;
  };
}

export default async function ProductsCatalogPage({
  searchParams,
}: CatalogPageProps) {
  const supabase = createSupabaseServerClient();

  const q = (searchParams.q || "").trim();
  const categorySlug = (searchParams.category || "").trim();
  const sort = searchParams.sort || "newest";
  const onlyInStock = searchParams.inStock === "true";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch all active categories for sidebar filter
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const matchedCategory = (categories as Category[] | null)?.find(
    (c) => c.slug === categorySlug
  );

  // Build product query
  let queryBuilder = supabase
    .from("products")
    .select("*, categories(*), product_images(*)", { count: "exact" })
    .eq("is_published", true)
    .eq("is_archived", false);

  if (matchedCategory) {
    queryBuilder = queryBuilder.eq("category_id", matchedCategory.id);
  }

  if (q) {
    queryBuilder = queryBuilder.or(
      `title_bn.ilike.%${q}%,title_en.ilike.%${q}%,sku.ilike.%${q}%`
    );
  }

  if (onlyInStock) {
    queryBuilder = queryBuilder.gt("stock_quantity", 0);
  }

  if (sort === "price_asc") {
    queryBuilder = queryBuilder.order("price_bdt", { ascending: true });
  } else if (sort === "price_desc") {
    queryBuilder = queryBuilder.order("price_bdt", { ascending: false });
  } else {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  const { data: products, count } = await queryBuilder.range(from, to);
  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <>
      <Suspense fallback={<div className="h-20 bg-white border-b" />}>
        <Header />
      </Suspense>

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="mb-6 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {matchedCategory
                ? `${matchedCategory.name_bn} (${matchedCategory.name_en})`
                : q
                ? `"${q}" এর জন্য সার্চ ফলাফল`
                : "সকল পণ্য (All Products)"}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              মোট {toBengaliNumber(totalCount)}টি পণ্য পাওয়া গেছে
            </p>
          </div>

          {/* Sort Links */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">সাজান:</span>
            {[
              { key: "newest", label: "নতুন পণ্য" },
              { key: "price_asc", label: "দাম: কম থেকে বেশি" },
              { key: "price_desc", label: "দাম: বেশি থেকে কম" },
            ].map((option) => (
              <Link
                key={option.key}
                href={{
                  pathname: "/products",
                  query: { ...searchParams, sort: option.key, page: "1" },
                }}
                className={`px-3 py-1.5 rounded-md border transition-colors ${
                  sort === option.key
                    ? "bg-brand text-white border-brand font-semibold"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white p-4 rounded-lg border border-border">
              <h2 className="font-bold text-gray-900 mb-3 text-base">
                ক্যাটাগরি সমূহ
              </h2>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link
                    href="/products"
                    className={`block px-2.5 py-1.5 rounded ${
                      !categorySlug
                        ? "bg-brand-light text-brand font-bold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    সকল ক্যাটাগরি
                  </Link>
                </li>
                {(categories as Category[] | null)?.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`block px-2.5 py-1.5 rounded ${
                        categorySlug === cat.slug
                          ? "bg-brand-light text-brand font-bold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {cat.name_bn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-border">
              <h2 className="font-bold text-gray-900 mb-2 text-base">
                স্টক ফিল্টার
              </h2>
              <Link
                href={{
                  pathname: "/products",
                  query: {
                    ...searchParams,
                    inStock: onlyInStock ? undefined : "true",
                    page: "1",
                  },
                }}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand"
              >
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  readOnly
                  className="rounded text-brand focus:ring-brand"
                />
                <span>শুধুমাত্র স্টকে থাকা পণ্য দেখান</span>
              </Link>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-9">
            {products && products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  {(products as Product[]).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <Link
                          key={p}
                          href={{
                            pathname: "/products",
                            query: { ...searchParams, page: String(p) },
                          }}
                          className={`px-3.5 py-1.5 rounded-md text-sm font-semibold border ${
                            p === page
                              ? "bg-brand text-white border-brand"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {toBengaliNumber(p)}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg border border-border p-12 text-center space-y-3">
                <p className="text-lg font-bold text-gray-800">
                  দুঃখিত, আপনার অনুসন্ধান অনুযায়ী কোনো পণ্য পাওয়া যায়নি।
                </p>
                <p className="text-sm text-gray-500">
                  অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা সকল পণ্যের তালিকা দেখুন।
                </p>
                <Link
                  href="/products"
                  className="inline-block mt-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark"
                >
                  সকল পণ্য দেখুন
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
