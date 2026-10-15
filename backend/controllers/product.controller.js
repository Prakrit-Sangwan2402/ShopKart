const mongoose = require('mongoose');
const Product = require('../models/product.model');

// 1. Create a product (POST /products)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Validate presence of required fields
    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      !category ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, image, stock) are required',
      });
    }

    // Validate price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid number greater than 0',
      });
    }

    // Validate stock
    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer',
      });
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: numericPrice,
      category: String(category).trim(),
      image: String(image).trim(),
      stock: numericStock,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 2. Get all products with search, category, and sort filters (GET /products)
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = {};

    // Search by product name (case-insensitive)
    if (search && search.trim() !== '') {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by category (case-insensitive, ignoring "All" / "All Categories")
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'all categories') {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // Sorting options: bonus support for price_asc and price_desc
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    }

    const products = await Product.find(filter).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 3. Get single product by ID (GET /products/:id)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
