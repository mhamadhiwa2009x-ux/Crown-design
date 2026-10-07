import { useState, useEffect } from 'react';
import { parseIqdAmount } from '@shared/iqd';

export interface CartItem {
  productId: number;
  productName: string;
  productBrand: string;
  price: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  quantity: number;
}

const CART_STORAGE_KEY = 'brand_store_cart';

export function mergeCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<number, CartItem>();

  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const existing = merged.get(item.productId);

    if (existing) {
      const thumbnailUrl = item.thumbnailUrl ?? existing.thumbnailUrl;
      merged.set(item.productId, {
        ...existing,
        ...item,
        imageUrl: item.imageUrl ?? existing.imageUrl ?? null,
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        quantity: existing.quantity + quantity,
      });
    } else {
      merged.set(item.productId, { ...item, quantity });
    }
  }

  return Array.from(merged.values());
}

export function getCartItemCount(items: Pick<CartItem, 'quantity'>[]): number {
  return items.reduce((count, item) => count + Math.max(0, Number(item.quantity) || 0), 0);
}

export function clearPersistedCart(
  storage: Pick<Storage, 'removeItem'> = localStorage,
) {
  storage.removeItem(CART_STORAGE_KEY);
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart) as CartItem[];
        setCart(mergeCartItems(parsedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => mergeCartItems([...prevCart, item]));
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        )
      );
    }
  };

  const clearCart = () => {
    // Remove persistence synchronously because checkout navigates immediately
    // after a successful order and the component may unmount before the
    // cart-saving effect runs.
    clearPersistedCart();
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      return total + parseIqdAmount(item.price) * item.quantity;
    }, 0);
  };

  const getTotalItems = () => getCartItemCount(cart);

  return {
    cart,
    isLoaded,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };
}
