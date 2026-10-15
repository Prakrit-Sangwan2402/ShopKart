import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById, addToWishlist } from '../services/api';
import { useCart } from '../context/CartContext';
import { IconCart, IconHeart, IconTruck, IconShieldCheck, IconRotateCcw, IconStar } from '../components/Icons';
import { formatINR } from '../utils/formatCurrency';

const ProductDetails = ({ customer }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartFeedback, setCartFeedback] = useState('');
  const [cartFeedbackType, setCartFeedbackType] = useState('success');
  const [cartLoading, setCartLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [wishlistFeedback, setWishlistFeedback] = useState('');
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      setLoading(true);
      setError('');
      setQuantity(1);
      try {
        const data = await fetchProductById(id);
        if (isMounted) {
          if (data.product) {
            setProduct(data.product);
          } else {
            setError('Product data is missing');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load product details:', err.message);
          setError(err.message || 'Product not found.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!customer) {
      navigate('/login');
      return;
    }

    setCartLoading(true);
    setCartFeedback('');
    try {
      await addItem(product._id, quantity);
      setCartFeedback(`Added ${quantity} × "${product.name}" to your cart!`);
      setCartFeedbackType('success');
    } catch (err) {
      setCartFeedback(err.message || 'Failed to add to cart');
      setCartFeedbackType('error');
    } finally {
      setCartLoading(false);
      setTimeout(() => setCartFeedback(''), 4000);
    }
  };

  const handleAddToWishlist = async () => {
    if (!customer) {
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    setWishlistFeedback('');
    try {
      await addToWishlist(product._id);
      setWishlistFeedback(`Added "${product.name}" to your wishlist!`);
    } catch (err) {
      setWishlistFeedback(err.message || 'Product is already in your wishlist');
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setWishlistFeedback(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="full-loader">
        <span className="spinner spinner-olive"></span>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="details-error-wrapper">
        <div className="empty-catalog-state">
          <div className="empty-icon">🔍</div>
          <h3>Product Not Found</h3>
          <p>{error || 'The requested product could not be located or has an invalid ID.'}</p>
          <Link to="/products" className="btn-hero-primary">
            &larr; Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const maxQty = product.stock;

  return (
    <div className="details-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-bar">
        <Link to="/home" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products" className="breadcrumb-link">Products</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      {cartFeedback && (
        <div className={`alert ${cartFeedbackType === 'error' ? 'alert-error' : 'alert-success'} cart-feedback-alert`}>
          {cartFeedback}
          {cartFeedbackType === 'success' && (
            <Link to="/cart" className="alert-action-link">
              View Cart →
            </Link>
          )}
        </div>
      )}

      {wishlistFeedback && (
        <div className="alert alert-success cart-feedback-alert">
          {wishlistFeedback}
          <Link to="/wishlist" className="alert-action-link">
            View Wishlist →
          </Link>
        </div>
      )}

      <div className="details-card">
        {/* Product Image Column */}
        <div className="details-image-column">
          <div className="details-image-wrapper">
            <img
              src={product.image}
              alt={product.name}
              className="details-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80';
              }}
            />
          </div>
        </div>

        {/* Product Information Column */}
        <div className="details-info-column">
          <div className="details-header">
            <span className="product-category-tag">{product.category}</span>
            <h1 className="details-title">{product.name}</h1>

            <div className="details-rating-row">
              <div className="stars-group">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={15} filled={true} />
                ))}
              </div>
              <span className="rating-text">4.8 (128 customer reviews)</span>
            </div>
          </div>

          <div className="details-price-row">
            <div className="price-stack">
              <span className="details-price">{formatINR(product.price)}</span>
              <span className="details-original-price">{formatINR(Number(product.price) * 1.25)}</span>
            </div>
            <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
              {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} units available)`}
            </span>
          </div>

          <div className="details-section">
            <h3 className="section-label">Product Overview</h3>
            <p className="details-description">{product.description}</p>
          </div>

          <div className="details-specs-table">
            <div className="spec-row">
              <span className="spec-label">Category</span>
              <span className="spec-value">{product.category}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Availability</span>
              <span className="spec-value">{isOutOfStock ? 'Unavailable' : `${product.stock} in stock`}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Product SKU</span>
              <span className="spec-value id-code">{product._id}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="details-qty-row">
              <span className="qty-label">Quantity:</span>
              <div className="quantity-control-group">
                <button
                  type="button"
                  className="btn-qty"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="btn-qty"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {quantity >= maxQty && (
                <span className="max-stock-tag">Max stock reached</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="details-actions">
            <button
              type="button"
              className="btn-add-to-cart"
              disabled={isOutOfStock || cartLoading}
              onClick={handleAddToCart}
            >
              <IconCart size={18} />
              <span>{cartLoading ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>

            <button
              type="button"
              className="btn-wishlist-action"
              disabled={wishlistLoading}
              onClick={handleAddToWishlist}
            >
              <IconHeart size={18} />
              <span>{wishlistLoading ? 'Saving...' : 'Add to Wishlist'}</span>
            </button>

            <button
              type="button"
              className="btn-back-products"
              onClick={() => navigate('/products')}
            >
              &larr; Back to Shop
            </button>
          </div>

          {/* Trust Guarantees Strip */}
          <div className="details-guarantees-row">
            <div className="guarantee-item">
              <IconTruck size={17} />
              <span>Fast Dispatch</span>
            </div>
            <div className="guarantee-item">
              <IconShieldCheck size={17} />
              <span>100% Authentic</span>
            </div>
            <div className="guarantee-item">
              <IconRotateCcw size={17} />
              <span>30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
