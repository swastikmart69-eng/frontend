/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variationId?: string;
  variationName?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  updateItemVariation: (productId: string, oldVariationId: string | undefined, newVariationId: string | undefined, newVariationName: string, newPrice: number, newImage: string, newName: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('swastikmart_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error('Failed to parse cart');
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('swastikmart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      const existing = prev.find(item =>
        item.productId === newItem.productId && item.variationId === newItem.variationId
      );
      if (existing) {
        return prev.map(item =>
          item.productId === newItem.productId && item.variationId === newItem.variationId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart(prev => prev.filter(item =>
      !(item.productId === productId && item.variationId === variationId)
    ));
  };

  const updateQuantity = (productId: string, quantity: number, variationId?: string) => {
    if (quantity <= 0) { removeFromCart(productId, variationId); return; }
    setCart(prev => prev.map(item =>
      item.productId === productId && item.variationId === variationId ? { ...item, quantity } : item
    ));
  };

  const updateItemVariation = (
    productId: string,
    oldVariationId: string | undefined,
    newVariationId: string | undefined,
    newVariationName: string,
    newPrice: number,
    newImage: string,
    newName: string
  ) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.productId === productId && item.variationId === oldVariationId);
      if (!existingItem) return prev;
      const targetItemIndex = prev.findIndex(item => item.productId === productId && item.variationId === newVariationId);
      if (targetItemIndex !== -1 && prev[targetItemIndex] !== existingItem) {
        return prev.map((item, index) => {
          if (index === targetItemIndex) return { ...item, quantity: item.quantity + existingItem.quantity };
          if (item === existingItem) return null as unknown as CartItem;
          return item;
        }).filter(Boolean);
      } else {
        return prev.map(item =>
          item.productId === productId && item.variationId === oldVariationId
            ? { ...item, variationId: newVariationId, variationName: newVariationName, price: newPrice, image: newImage, name: newName }
            : item
        );
      }
    });
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, updateItemVariation, clearCart,
      cartTotal, cartCount, isCartOpen, setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};
