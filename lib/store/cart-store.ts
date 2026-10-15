"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItemClient } from "@/types/database";

interface CartState {
  items: CartItemClient[];
  couponCode: string;
  addItem: (item: CartItemClient) => { ok: boolean; messageBn: string };
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clearCart: () => void;
  setCouponCode: (code: string) => void;
  getTotalItems: () => number;
  getSubtotalBdt: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: "",

      addItem: (incoming) => {
        if (incoming.maxStock <= 0) {
          return { ok: false, messageBn: "দুঃখিত, এই পণ্যটি বর্তমানে স্টকে নেই।" };
        }

        const existingItems = get().items;
        const matchIndex = existingItems.findIndex(
          (i) =>
            i.productId === incoming.productId &&
            (i.variantId ?? null) === (incoming.variantId ?? null)
        );

        if (matchIndex > -1) {
          const current = existingItems[matchIndex];
          const nextQty = current.quantity + incoming.quantity;

          if (nextQty > incoming.maxStock) {
            return {
              ok: false,
              messageBn: `স্টকে সর্বোচ্চ ${incoming.maxStock}টি পণ্য রয়েছে।`,
            };
          }

          const updated = [...existingItems];
          updated[matchIndex] = {
            ...current,
            quantity: nextQty,
            unitPriceBdt: incoming.unitPriceBdt,
            maxStock: incoming.maxStock,
          };
          set({ items: updated });
          return { ok: true, messageBn: "কার্টে পণ্যের সংখ্যা আপডেট করা হয়েছে।" };
        }

        const safeQty = Math.min(incoming.quantity, incoming.maxStock);
        set({ items: [...existingItems, { ...incoming, quantity: safeQty }] });
        return { ok: true, messageBn: "পণ্যটি আপনার কার্টে যোগ করা হয়েছে।" };
      },

      updateQuantity: (productId, variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (
                item.productId === productId &&
                (item.variantId ?? null) === (variantId ?? null)
              ) {
                const clamped = Math.max(1, Math.min(quantity, item.maxStock));
                return { ...item, quantity: clamped };
              }
              return item;
            })
            .filter((item) => item.quantity > 0),
        }));
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                (item.variantId ?? null) === (variantId ?? null)
              )
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: "" }),

      setCouponCode: (code) => set({ couponCode: code.trim().toUpperCase() }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotalBdt: () =>
        get().items.reduce(
          (sum, item) => sum + Math.round(item.unitPriceBdt) * item.quantity,
          0
        ),
    }),
    {
      name: "sashroyidam-cart-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
