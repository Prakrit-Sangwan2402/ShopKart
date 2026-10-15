import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { IconCart, IconTrash, IconShieldCheck, IconTruck, IconRotateCcw, IconArrowRight } from '../components/Icons';
import { formatINR } from '../utils/formatCurrency';

const Cart = ({ customer }) => {
  const navigate = useNavigate();
  const { cart, loading, error: contextError, updateQuantity, removeItem, clearAll } = useCart();

  const [actionError, setActionError] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Handle increasing quantity by 1
  const handleIncrease = async (item) => {
    const nextQty = item.quantity + 1;
    if (nextQty > item.product.stock) {
      setActionError(`Cannot exceed available stock (${item.product.stock}) for "${item.product.name}".`);
      setTimeout(() => setActionError(''), 3000);
      return;
    }

    setUpdatingId(item._id);
    setActionError('');
    try {
      await updateQuantity(item._id, nextQty);
    } catch (err) {
      setActionError(err.message || 'Failed to update quantity');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle decreasing quantity by 1
  const handleDecrease = async (item) => {
    if (item.quantity <= 1) {
      return;
    }

    const nextQty = item.quantity - 1;
    setUpdatingId(item._id);
    setActionError('');
    try {
      await updateQuantity(item._id, nextQty);
    } catch (err) {
      setActionError(err.message || 'Failed to update quantity');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle removing single item
  const handleRemove = async (item) => {
    setUpdatingId(item._id);
    setActionError('');
    try {
      await removeItem(item._id);
      setActionFeedback(`Removed "${item.product.name}" from your cart.`);
      setTimeout(() => setActionFeedback(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to remove item');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle clearing entire cart
  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to remove all items from your cart?')) {
      return;
    }

    setClearing(true);
    setActionError('');
    try {
      await clearAll();
      setActionFeedback('All items cleared from cart.');
      setTimeout(() => setActionFeedback(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to clear cart');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setClearing(false);
    }
  };

  // Handle Checkout click -> Navigate to Checkout page
  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  // Guest view if customer is not logged in
  if (!customer) {
    return (
      <div className="cart-page-container">
        <div className="cart-auth-prompt-card">
          <div className="prompt-icon-circle">
            <IconCart size={32} />
          </div>
          <h2>Sign in to view your Cart</h2>
          <p>
            Your shopping cart is securely saved in your customer account. Please log in or create a new account to manage your items.
          </p>
          <div className="prompt-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Log In to Account
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/register')}
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading && (!cart || !cart.items)) {
    return (
      <div className="full-loader">
        <span className="spinner spinner-olive"></span>
        <p>Loading your shopping cart...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0).toFixed(2);
  const totalItems = cart?.totalItems || 0;

  return (
    <div className="cart-page-container">
      {/* Page Header */}
      <div className="cart-header">
        <div>
          <h1 className="cart-title">Shopping Cart</h1>
          <p className="cart-subtitle">
            Review your selected products and quantities before checkout
          </p>
        </div>
        <div className="cart-badge">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Notifications */}
      {actionFeedback && (
        <div className="alert alert-success cart-alert">
          {actionFeedback}
        </div>
      )}

      {(actionError || contextError) && (
        <div className="alert alert-error cart-alert">
          {actionError || contextError}
        </div>
      )}

      {/* Empty Cart State */}
      {items.length === 0 ? (
        <div className="cart-empty-state">
          <div className="empty-icon-circle">
            <IconCart size={36} />
          </div>
          <h2>Your shopping cart is currently empty</h2>
          <p>
            You haven't added any products to your cart yet. Explore our product catalog to discover items and deals!
          </p>
          <Link to="/products" className="btn-hero-primary">
            <span>Browse Product Catalog</span>
            <IconArrowRight size={16} />
          </Link>
        </div>
      ) : (
        /* Cart Content Layout */
        <div className="cart-layout-grid">
          {/* Left: Cart Items List */}
          <div className="cart-items-column">
            <div className="cart-table-header">
              <span>Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
            </div>

            <div className="cart-items-list">
              {items.map((item) => {
                const product = item.product;
                if (!product) return null;

                const isAtMaxStock = item.quantity >= product.stock;
                const isAtMinQty = item.quantity <= 1;
                const isItemUpdating = updatingId === item._id;

                return (
                  <div key={item._id} className="cart-item-card">
                    {/* Item Image */}
                    <div className="cart-item-img-wrapper">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="cart-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                        }}
                      />
                    </div>

                    {/* Item Information */}
                    <div className="cart-item-details">
                      <span className="product-category-tag">{product.category}</span>
                      <h3 className="cart-item-name">
                        <Link to={`/products/${product._id}`}>{product.name}</Link>
                      </h3>
                      <div className="cart-item-unit-price">
                        {formatINR(product.price)} each
                      </div>
                      <div className="cart-item-stock-hint">
                        Stock available: <strong>{product.stock}</strong>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="cart-item-quantity-wrapper">
                      <div className="quantity-control-group">
                        <button
                          type="button"
                          className="btn-qty"
                          onClick={() => handleDecrease(item)}
                          disabled={isAtMinQty || isItemUpdating}
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="qty-value">
                          {isItemUpdating ? '...' : item.quantity}
                        </span>
                        <button
                          type="button"
                          className="btn-qty"
                          onClick={() => handleIncrease(item)}
                          disabled={isAtMaxStock || isItemUpdating}
                          title={
                            isAtMaxStock
                              ? `Maximum available stock reached (${product.stock})`
                              : 'Increase quantity'
                          }
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {isAtMaxStock && (
                        <span className="max-stock-tag">Max in stock</span>
                      )}
                    </div>

                    {/* Line Total & Remove Action */}
                    <div className="cart-item-actions-column">
                      <div className="cart-line-total">
                        {formatINR(item.itemTotal)}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-cart-item"
                        onClick={() => handleRemove(item)}
                        disabled={isItemUpdating}
                        title="Remove product from cart"
                        aria-label="Remove product"
                      >
                        <IconTrash size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Row */}
            <div className="cart-items-bottom-row">
              <Link to="/products" className="btn-continue-shopping">
                &larr; Continue Shopping
              </Link>
              <button
                type="button"
                className="btn-clear-cart"
                onClick={handleClearCart}
                disabled={clearing}
              >
                <IconTrash size={14} />
                <span>{clearing ? 'Clearing...' : 'Clear Cart'}</span>
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-row">
                <span>Items Subtotal ({totalItems}):</span>
                <span className="summary-val">{formatINR(subtotal)}</span>
              </div>

              <div className="summary-row">
                <span>Estimated Shipping:</span>
                <span className="summary-val free-shipping">FREE</span>
              </div>

              <div className="summary-row">
                <span>Estimated Tax:</span>
                <span className="summary-val">{formatINR(0)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total-row">
                <span>Estimated Total:</span>
                <span className="total-amount">{formatINR(subtotal)}</span>
              </div>

              <button
                type="button"
                className="btn-checkout-primary"
                onClick={handleCheckoutClick}
              >
                <span>Proceed to Checkout</span>
                <IconArrowRight size={17} />
              </button>

              <div className="summary-features">
                <div className="feature-item">
                  <IconShieldCheck size={16} />
                  <span>Secure SSL Encrypted Checkout</span>
                </div>
                <div className="feature-item">
                  <IconTruck size={16} />
                  <span>Free Standard Delivery</span>
                </div>
                <div className="feature-item">
                  <IconRotateCcw size={16} />
                  <span>30-Day Easy Return Policy</span>
                </div>
              </div>

              <p className="summary-note">
                * Prices and stock verified directly from database catalog.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
