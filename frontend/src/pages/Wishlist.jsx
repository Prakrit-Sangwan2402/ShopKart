import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWishlist, removeFromWishlist } from '../services/api';
import { IconHeart, IconTrash, IconArrowRight } from '../components/Icons';
import { formatINR } from '../utils/formatCurrency';

const Wishlist = ({ customer }) => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Fetch wishlist when customer is authenticated
  useEffect(() => {
    let isMounted = true;

    const loadWishlist = async () => {
      if (!customer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchWishlist();
        if (isMounted) {
          setWishlistItems(data.wishlist || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load wishlist:', err.message);
          setError(err.message || 'Unable to load your wishlist. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, [customer]);

  // Handle removing a product from wishlist
  const handleRemove = async (item) => {
    const idToDelete = item._id;
    setRemovingId(idToDelete);
    setFeedback('');

    try {
      await removeFromWishlist(idToDelete);
      setWishlistItems((prev) => prev.filter((w) => w._id !== idToDelete));
      const productName = item.product?.name || 'Item';
      setFeedback(`Removed "${productName}" from your wishlist.`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error('Failed to remove wishlist item:', err.message);
      setError(err.message || 'Failed to remove product from wishlist.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRemovingId(null);
    }
  };

  // If customer is not logged in, prompt to log in
  if (!customer) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-auth-prompt-card">
          <div className="prompt-icon-circle">
            <IconHeart size={32} />
          </div>
          <h2>Sign in to view your Wishlist</h2>
          <p>
            Save your favorite products, track price drops, and keep them ready for future shopping.
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

  return (
    <div className="wishlist-container">
      {/* Header Bar */}
      <div className="wishlist-header">
        <div>
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">
            Products you have saved for later purchase
          </p>
        </div>
        <div className="wishlist-badge">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div className="alert alert-success wishlist-alert">
          {feedback}
        </div>
      )}

      {error && (
        <div className="alert alert-error wishlist-alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="full-loader">
          <span className="spinner spinner-olive"></span>
          <p>Loading your saved items...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        /* Empty State */
        <div className="wishlist-empty-state">
          <div className="empty-icon-circle">
            <IconHeart size={36} />
          </div>
          <h2>Your wishlist is currently empty</h2>
          <p>
            You haven't saved any products to your wishlist yet. Explore our product catalog to discover items you love!
          </p>
          <Link to="/products" className="btn-hero-primary">
            <span>Browse Product Catalog</span>
            <IconArrowRight size={16} />
          </Link>
        </div>
      ) : (
        /* Wishlist Grid */
        <div className="wishlist-grid">
          {wishlistItems.map((item) => {
            const product = item.product;
            if (!product) {
              return null;
            }

            const isOutOfStock = product.stock <= 0;

            return (
              <div key={item._id} className="wishlist-card">
                <div className="wishlist-card-img-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="wishlist-card-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                    }}
                  />
                  <span className="product-category-tag">{product.category}</span>
                </div>

                <div className="wishlist-card-body">
                  <h3 className="wishlist-card-title" title={product.name}>
                    <Link to={`/products/${product._id}`}>{product.name}</Link>
                  </h3>

                  <div className="wishlist-card-meta">
                    <span className="wishlist-price">
                      {formatINR(product.price)}
                    </span>
                    <span
                      className={`stock-badge ${
                        isOutOfStock ? 'out-of-stock' : 'in-stock'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock})`}
                    </span>
                  </div>

                  <p className="wishlist-card-desc">
                    {product.description
                      ? product.description.length > 80
                        ? `${product.description.slice(0, 80)}...`
                        : product.description
                      : 'No description provided.'}
                  </p>

                  <div className="wishlist-card-actions">
                    <Link
                      to={`/products/${product._id}`}
                      className="btn-view-details"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="btn-remove-wishlist"
                      disabled={removingId === item._id}
                      onClick={() => handleRemove(item)}
                      title="Remove from wishlist"
                    >
                      <IconTrash size={14} />
                      <span>{removingId === item._id ? 'Removing...' : 'Remove'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
