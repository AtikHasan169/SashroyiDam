import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartItem, CartValidationResult, Coupon } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface CartContextType {
  items: CartItem[];
  cartValidation: CartValidationResult | null;
  totalItemCount: number;
  couponCode: string;
  division: string;
  isCartDrawerOpen: boolean;
  isValidating: boolean;
  addToCart: (productId: string, variantId?: string, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  setCustomerDivision: (div: string) => void;
  setIsCartDrawerOpen: (open: boolean) => void;
  refreshCartValidation: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'oshesh_cart_items_v1';
const COUPON_STORAGE_KEY = 'oshesh_cart_coupon_v1';
const DIVISION_STORAGE_KEY = 'oshesh_cart_division_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    return localStorage.getItem(COUPON_STORAGE_KEY) || '';
  });

  const [division, setDivision] = useState<string>(() => {
    return localStorage.getItem(DIVISION_STORAGE_KEY) || 'dhaka';
  });

  const [cartValidation, setCartValidation] = useState<CartValidationResult | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
  }, [couponCode]);

  useEffect(() => {
    localStorage.setItem(DIVISION_STORAGE_KEY, division);
  }, [division]);

  // Server-side validation
  const refreshCartValidation = useCallback(async () => {
    if (items.length === 0) {
      setCartValidation({
        items: [],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        total: 0,
        warnings: []
      });
      return;
    }

    setIsValidating(true);
    try {
      const res = await api.validateCart({
        items,
        couponCode: couponCode || undefined,
        division
      });
      setCartValidation(res);
    } catch (err) {
      console.error('Cart validation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, [items, couponCode, division]);

  useEffect(() => {
    refreshCartValidation();
  }, [refreshCartValidation]);

  const addToCart = (productId: string, variantId?: string, quantity: number = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      } else {
        return [...prev, { productId, variantId, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variantId === variantId) {
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCartValidation(null);
  };

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: 'কুপন কোড প্রদান করুন' };
    }

    try {
      const res = await api.applyCoupon({
        code: code.trim(),
        subtotal: cartValidation ? cartValidation.subtotal : 0
      });

      setCouponCode(code.trim().toUpperCase());
      await refreshCartValidation();
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'অবৈধ কুপন কোড' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
  };

  const setCustomerDivision = (div: string) => {
    setDivision(div);
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartValidation,
        totalItemCount,
        couponCode,
        division,
        isCartDrawerOpen,
        isValidating,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCouponCode,
        removeCoupon,
        setCustomerDivision,
        setIsCartDrawerOpen,
        refreshCartValidation
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
