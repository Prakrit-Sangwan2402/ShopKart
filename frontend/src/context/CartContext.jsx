import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children, customer }) => {
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    subtotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Synchronize cart with customer authentication session
  const refreshCart = useCallback(async () => {
    if (!customer) {
      setCart({ items: [], totalItems: 0, subtotal: 0 });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchCart();
      if (data && data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Error fetching cart in CartContext:', err.message);
      setError(err.message || 'Failed to load shopping cart');
    } finally {
      setLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add item to cart
  const addItem = async (productId, quantity = 1) => {
    setError('');
    const data = await apiAddToCart(productId, quantity);
    if (data && data.cart) {
      setCart(data.cart);
    }
    return data;
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    setError('');
    const data = await apiUpdateCartQuantity(itemId, quantity);
    if (data && data.cart) {
      setCart(data.cart);
    }
    return data;
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    setError('');
    const data = await apiRemoveFromCart(itemId);
    if (data && data.cart) {
      setCart(data.cart);
    }
    return data;
  };

  // Clear entire cart
  const clearAll = async () => {
    setError('');
    const data = await apiClearCart();
    if (data && data.cart) {
      setCart(data.cart);
    }
    return data;
  };

  const value = {
    cart,
    cartCount: cart.totalItems || 0,
    cartSubtotal: cart.subtotal || 0,
    loading,
    error,
    refreshCart,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
