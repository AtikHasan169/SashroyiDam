"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, AlertCircle } from "lucide-react";
import type { Product, ProductVariant } from "@/types/database";
import { formatBDT, calculateSavingsPercent, toBengaliNumber } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const savingsPercent = calculateSavingsPercent(
    product.price_bdt,
    product.compare_at_price_bdt
  );
  const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
  const primaryImage =
    product.product_images && product.product_images.length > 0
      ? product.product_images[0].image_url
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    const result = addItem({
      productId: product.id,
      variantId: null,
      slug: product.slug,
      titleBn: product.title_bn,
      titleEn: product.title_en,
      variantNameBn: null,
      sku: product.sku,
      unitPriceBdt: Number(product.price_bdt),
      compareAtPriceBdt: product.compare_at_price_bdt
        ? Number(product.compare_at_price_bdt)
        : null,
      quantity: 1,
      maxStock: product.track_inventory ? product.stock_quantity : 99,
      imageUrl: primaryImage,
    });

    setAddedFeedback(result.messageBn);
    setTimeout(() => setAddedFeedback(null), 2200);
  };

  return (
    <div className="group bg-white rounded-lg border border-border overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-md">
      <div>
        {/* Product Image Container */}
        <Link
          href={`/products/${product.slug}`}
          className="block relative aspect-square bg-gray-100 overflow-hidden"
        >
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={product.title_bn}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-brand-light/40 text-brand">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                SashroyiDam
              </span>
              <span className="text-sm font-bold mt-1 line-clamp-2">
                {product.title_bn}
              </span>
            </div>
          )}

          {/* Genuine Discount Badge */}
          {savingsPercent && !isOutOfStock && (
            <span className="absolute top-2.5 left-2.5 bg-brand-accent text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
              {toBengaliNumber(savingsPercent)}% ছাড়
            </span>
          )}

          {/* Out of Stock Overlay Badge */}
          {isOutOfStock && (
            <span className="absolute top-2.5 right-2.5 bg-gray-900/85 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
              স্টক আউট
            </span>
          )}
        </Link>

        {/* Product Content */}
        <div className="p-3.5">
          {product.categories && (
            <p className="text-xs text-gray-500 mb-1 truncate">
              {product.categories.name_bn}
            </p>
          )}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-brand transition-colors min-h-[2.75rem]">
              {product.title_bn}
            </h3>
          </Link>

          {/* Price Block */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand">
              {formatBDT(product.price_bdt)}
            </span>
            {product.compare_at_price_bdt &&
              product.compare_at_price_bdt > product.price_bdt && (
                <span className="text-xs text-gray-400 line-through">
                  {formatBDT(product.compare_at_price_bdt)}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-3.5 pb-3.5 pt-1">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          className={`w-full py-2 px-3 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            isOutOfStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : addedFeedback
              ? "bg-emerald-700 text-white"
              : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          {isOutOfStock ? (
            <span>স্টকে নেই (Out of Stock)</span>
          ) : addedFeedback ? (
            <>
              <Check className="w-4 h-4" />
              <span>কার্টে যোগ হয়েছে</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>কার্টে যোগ করুন</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Interactive Variant & Quantity Selector used on the Product Details Page
 */
export function ProductDetailPurchaseBox({
  product,
  variants,
}: {
  product: Product;
  variants: ProductVariant[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null
  );

  const activeVariant =
    variants.find((v) => v.id === selectedVariantId) || null;

  const effectivePrice =
    activeVariant && activeVariant.price_override_bdt !== null
      ? Number(activeVariant.price_override_bdt)
      : Number(product.price_bdt);

  const availableStock = product.track_inventory
    ? activeVariant
      ? activeVariant.stock_quantity
      : product.stock_quantity
    : 99;

  const isOutOfStock = product.track_inventory && availableStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const primaryImage =
      product.product_images && product.product_images.length > 0
        ? product.product_images[0].image_url
        : null;

    const res = addItem({
      productId: product.id,
      variantId: activeVariant ? activeVariant.id : null,
      slug: product.slug,
      titleBn: product.title_bn,
      titleEn: product.title_en,
      variantNameBn: activeVariant ? activeVariant.variant_name_bn : null,
      sku: activeVariant ? activeVariant.sku : product.sku,
      unitPriceBdt: effectivePrice,
      compareAtPriceBdt: product.compare_at_price_bdt
        ? Number(product.compare_at_price_bdt)
        : null,
      quantity,
      maxStock: availableStock,
      imageUrl: primaryImage,
    });

    setFeedback({ ok: res.ok, msg: res.messageBn });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-5 border-t border-b border-gray-200 py-5 my-5">
      {/* Dynamic Price & Savings */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl sm:text-3xl font-bold text-brand">
          {formatBDT(effectivePrice)}
        </span>
        {product.compare_at_price_bdt &&
          product.compare_at_price_bdt > effectivePrice && (
            <>
              <span className="text-base text-gray-400 line-through">
                {formatBDT(product.compare_at_price_bdt)}
              </span>
              <span className="bg-brand-accent/10 text-brand-accent text-xs font-bold px-2 py-0.5 rounded">
                সাশ্রয়{" "}
                {formatBDT(product.compare_at_price_bdt - effectivePrice)}
              </span>
            </>
          )}
      </div>

      {/* Stock Indicator */}
      <div className="text-sm font-medium">
        {isOutOfStock ? (
          <span className="text-red-600 font-semibold">
            স্টক শেষ (Out of Stock)
          </span>
        ) : (
          <span className="text-emerald-700">
            ● স্টকে আছে ({toBengaliNumber(availableStock)}টি উপলব্ধ)
          </span>
        )}
      </div>

      {/* Variant Selector */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            ভ্যারিয়েন্ট নির্বাচন করুন (Select Variant):
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const selected = v.id === selectedVariantId;
              const vOut = product.track_inventory && v.stock_quantity <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setQuantity(1);
                  }}
                  className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium border transition-colors ${
                    selected
                      ? "border-brand bg-brand-light text-brand font-bold"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  } ${vOut ? "opacity-50 line-through" : ""}`}
                >
                  {v.variant_name_bn}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
          <button
            type="button"
            disabled={isOutOfStock || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3.5 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            aria-label="পরিমাণ কমান"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-bold min-w-[44px] text-center">
            {toBengaliNumber(quantity)}
          </span>
          <button
            type="button"
            disabled={isOutOfStock || quantity >= availableStock}
            onClick={() =>
              setQuantity((q) => Math.min(availableStock, q + 1))
            }
            className="px-3.5 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            aria-label="পরিমাণ বাড়ান"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 min-w-[180px] bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>কার্টে যোগ করুন (Add to Cart)</span>
        </button>

        <Link
          href="/cart"
          onClick={handleAddToCart}
          className={`min-w-[150px] text-center font-bold py-3 px-5 rounded-lg border transition-colors ${
            isOutOfStock
              ? "pointer-events-none border-gray-200 text-gray-400"
              : "border-brand text-brand hover:bg-brand-light"
          }`}
        >
          এখনই অর্ডার করুন
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-md text-sm font-medium flex items-center gap-2 ${
            feedback.ok
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.ok ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}
    </div>
  );
}
