const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Helper to compute line totals, total items, and overall cart subtotal using current product prices
const calculateCartTotals = (cart) => {
  if (!cart) {
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
    };
  }

  let subtotal = 0;
  let totalItems = 0;

  const validItems = (cart.items || [])
    .filter((item) => item.product !== null && item.product !== undefined)
    .map((item) => {
      const price = Number(item.product.price) || 0;
      const lineTotal = Number((price * item.quantity).toFixed(2));
      subtotal += lineTotal;
      totalItems += item.quantity;

      return {
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        itemTotal: lineTotal,
      };
    });

  return {
    _id: cart._id,
    customer: cart.customer,
    items: validItems,
    totalItems,
    subtotal: Number(subtotal.toFixed(2)),
    updatedAt: cart.updatedAt,
  };
};

// 1. Add product to cart (POST /cart or POST /api/cart)
const addToCart = async (req, res) => {
  try {
    const customerId = req.user._id;
    const productId = req.body.productId || req.body.product || req.params.productId;
    let quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 1;

    // Validate productId presence
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Validate quantity is a positive integer
    if (isNaN(quantity) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    // Check if product exists in catalog
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check stock availability
    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently out of stock',
      });
    }

    // Find or create customer's cart
    let cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
      cart = new Cart({
        customer: customerId,
        items: [],
      });
    }

    // Check if product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than available stock (${product.stock}). You already have ${existingItem.quantity} in your cart.`,
        });
      }
      existingItem.quantity = newQuantity;
    } else {
      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock (${product.stock})`,
        });
      }
      cart.items.push({
        product: productId,
        quantity,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      cart: calculateCartTotals(cart),
    });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 2. Fetch customer's cart (GET /cart or GET /api/cart)
const getCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customer: customerId }).populate('items.product');

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          subtotal: 0,
        },
      });
    }

    // Clean up any deleted catalog items
    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.product !== null);
    if (cart.items.length !== originalLength) {
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      cart: calculateCartTotals(cart),
    });
  } catch (error) {
    console.error('Error fetching cart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 3. Update cart item quantity (PUT /cart/:itemId or PUT /api/cart/:itemId)
const updateCartItemQuantity = async (req, res) => {
  try {
    const customerId = req.user._id;
    const itemId = req.params.itemId || req.body.productId || req.body.itemId;
    const { quantity } = req.body;

    // Validate itemId
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID or Product ID is required',
      });
    }

    // Validate quantity is a positive integer
    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    const cart = await Cart.findOne({ customer: customerId }).populate('items.product');
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find target item by cart item _id or referenced product _id
    const targetItem = cart.items.find(
      (item) =>
        item._id?.toString() === itemId.toString() ||
        item.product?._id?.toString() === itemId.toString() ||
        item.product?.toString() === itemId.toString()
    );

    if (!targetItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Verify stock limits
    const product = targetItem.product;
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product no longer exists in catalog',
      });
    }

    if (parsedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${product.stock})`,
      });
    }

    targetItem.quantity = parsedQuantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart: calculateCartTotals(cart),
    });
  } catch (error) {
    console.error('Error updating cart item:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 4. Remove item from cart (DELETE /cart/:itemId or DELETE /api/cart/:itemId)
const removeFromCart = async (req, res) => {
  try {
    const customerId = req.user._id;
    const itemId = req.params.itemId || req.params.productId;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID or Product ID is required',
      });
    }

    const cart = await Cart.findOne({ customer: customerId }).populate('items.product');
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find target index by cart item _id or referenced product _id
    const itemIndex = cart.items.findIndex(
      (item) =>
        item._id?.toString() === itemId.toString() ||
        item.product?._id?.toString() === itemId.toString() ||
        item.product?.toString() === itemId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: calculateCartTotals(cart),
    });
  } catch (error) {
    console.error('Error removing from cart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 5. Clear all items from cart (DELETE /cart or DELETE /api/cart)
const clearCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
        cart: {
          items: [],
          totalItems: 0,
          subtotal: 0,
        },
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: calculateCartTotals(cart),
    });
  } catch (error) {
    console.error('Error clearing cart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
};
