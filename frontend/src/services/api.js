// Central API service for ShopKart Catalog & Authentication

export const fetchProducts = async ({ search = '', category = '', sort = '' } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim() !== '') {
    params.append('search', search.trim());
  }
  if (
    category &&
    category.trim() !== '' &&
    category !== 'All Categories' &&
    category !== 'All'
  ) {
    params.append('category', category.trim());
  }
  if (sort && sort.trim() !== '') {
    params.append('sort', sort.trim());
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/products${queryString}`);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch products');
  }
  return data;
};

export const fetchProductById = async (id) => {
  const response = await fetch(`/api/products/${id}`);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch product details');
  }
  return data;
};

export const createProduct = async (productData) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create product');
  }
  return data;
};

export const fetchMe = async () => {
  const response = await fetch('/api/customers/me', {
    method: 'GET',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Session not authorized');
  }
  return data;
};

export const logoutCustomer = async () => {
  const response = await fetch('/api/customers/logout', {
    method: 'POST',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Logout failed');
  }
  return data;
};

// Wishlist API Services (Lab 04)
export const fetchWishlist = async () => {
  const response = await fetch('/api/wishlist', {
    method: 'GET',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch wishlist');
  }
  return data;
};

export const addToWishlist = async (productId) => {
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ productId }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to add product to wishlist');
  }
  return data;
};

export const removeFromWishlist = async (id) => {
  const response = await fetch(`/api/wishlist/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove product from wishlist');
  }
  return data;
};

// ==========================================
// SHOPPING CART API SERVICES (Lab 05)
// ==========================================

export const fetchCart = async () => {
  const response = await fetch('/api/cart', {
    method: 'GET',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch cart');
  }
  return data;
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to add product to cart');
  }
  return data;
};

export const updateCartQuantity = async (itemId, quantity) => {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update cart item quantity');
  }
  return data;
};

export const removeFromCart = async (itemId) => {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove item from cart');
  }
  return data;
};

export const clearCart = async () => {
  const response = await fetch('/api/cart', {
    method: 'DELETE',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to clear cart');
  }
  return data;
};

// ==========================================
// ORDER & PAYMENT API SERVICES (Lab 06)
// ==========================================

export const createOrder = async ({ shippingAddress, paymentMethod }) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ shippingAddress, paymentMethod }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create order');
  }
  return data;
};

export const verifyOrderPayment = async (orderId, paymentData) => {
  const response = await fetch(`/api/orders/${orderId}/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Payment verification failed');
  }
  return data;
};

export const fetchMyOrders = async () => {
  const response = await fetch('/api/orders/my-orders', {
    method: 'GET',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch customer orders');
  }
  return data;
};

export const fetchOrderById = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'GET',
    credentials: 'include',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch order details');
  }
  return data;
};


