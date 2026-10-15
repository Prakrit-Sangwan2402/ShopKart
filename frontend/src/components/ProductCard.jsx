import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addToWishlist } from '../services/api';
import { useCart } from '../context/CartContext';
import { IconCart, IconHeart, IconStar } from './Icons';
import { formatINR } from '../utils/formatCurrency';

const ProductCard = ({ product, customer, onWishlistChange, isWishlisted = false }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const isOutOfStock = product.stock <= 0;

  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [inWishlist, setInWishlist] = useState(isWishlisted);

  const showFeedback = (msg, type = 'success') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customer) {
      navigate('/login');
      return;
    }

    setLoadingWishlist(true);
    try {
      await addToWishlist(product._id);
      setInWishlist(true);
      showFeedback('Added to Wishlist!', 'success');
      if (onWishlistChange) {
        onWishlistChange(product._id, true);
      }
    } catch (err) {
      showFeedback(err.message || 'Already in wishlist', 'error');
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customer) {
      navigate('/login');
      return;
    }

    setLoadingCart(true);
    try {
      await addItem(product._id, 1);
      showFeedback('Added to Cart!', 'success');
    } catch (err) {
      showFeedback(err.message || 'Failed to add to cart', 'error');
    } finally {
      setLoadingCart(false);
    }
  };

  // Generate a consistent pseudo rating between 4.4 and 4.9 based on product name/id length
  const ratingValue = (4.4 + ((product.name.length % 5) * 0.1)).toFixed(1);
  const reviewCount = 45 + (product.name.length * 7);

  return (
    <div className="product-card">
      <div className="product-card-img-wrapper">
        <Link to={`/products/${product._id}`} className="card-image-link">
          <img
            src={product.image}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
            }}
          />
        </Link>

        {/* Category Badge */}
        <span className="product-category-tag">{product.category}</span>

        {/* Wishlist Quick-Action Button */}
        <button
          type="button"
          className={`card-wishlist-btn ${inWishlist ? 'active' : ''}`}
          onClick={handleWishlistClick}
          disabled={loadingWishlist}
          title={customer ? (inWishlist ? 'In your wishlist' : 'Add to Wishlist') : 'Login to save item'}
          aria-label="Add to wishlist"
        >
          <IconHeart size={16} filled={inWishlist} />
        </button>
      </div>

      <div className="product-card-body">
        {/* Rating Row */}
        <div className="product-card-rating">
          <IconStar size={13} filled={true} />
          <span className="rating-score">{ratingValue}</span>
          <span className="rating-count">({reviewCount})</span>
        </div>

        {/* Product Title */}
        <h3 className="product-card-title">
          <Link to={`/products/${product._id}`} title={product.name}>
            {product.name}
          </Link>
        </h3>

        {/* Price & Stock Row */}
        <div className="product-card-meta">
          <div className="price-group">
            <span className="product-price">{formatINR(product.price)}</span>
            <span className="product-original-price">{formatINR(Number(product.price) * 1.25)}</span>
          </div>

          <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {isOutOfStock ? 'Out of Stock' : `${product.stock} left`}
          </span>
        </div>

        {/* Temporary Feedback Notification */}
        {feedback && (
          <div className={`card-feedback-toast ${feedbackType === 'error' ? 'card-feedback-toast-error' : ''}`}>
            {feedback}
          </div>
        )}

        {/* Add to Cart Button */}
        <div className="card-actions-row">
          <button
            type="button"
            className="btn-card-add-cart"
            disabled={isOutOfStock || loadingCart}
            onClick={handleAddToCart}
          >
            <IconCart size={16} />
            <span>
              {loadingCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
