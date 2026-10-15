const mongoose = require('mongoose');
const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');

// 1. Add product to customer's wishlist (POST /wishlist)
const addToWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;
    const productId = req.body.productId || req.body.product || req.params.productId;

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

    // Check if product exists in catalog
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check for duplicate wishlist entry
    const existingEntry = await Wishlist.findOne({
      customer: customerId,
      product: productId,
    });
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }

    // Create wishlist entry
    const wishlistItem = await Wishlist.create({
      customer: customerId,
      product: productId,
    });

    await wishlistItem.populate('product');

    return res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      wishlistItem,
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 2. Fetch customer's wishlist with populated product details (GET /wishlist)
const getWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;

    const wishlist = await Wishlist.find({ customer: customerId })
      .populate('product')
      .sort({ createdAt: -1 });

    // Filter out any orphaned items if a product was deleted
    const validItems = wishlist.filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      count: validItems.length,
      wishlist: validItems,
      products: validItems.map((item) => item.product),
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 3. Remove product from customer's wishlist (DELETE /wishlist/:id)
const removeFromWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;
    const id = req.params.id || req.params.productId || req.body.productId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Support deletion by either Wishlist document ID or referenced Product ID
    const deletedItem = await Wishlist.findOneAndDelete({
      customer: customerId,
      $or: [{ _id: id }, { product: id }],
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      removedId: id,
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
