import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

const MyOrders = ({ customer }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!customer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchMyOrders();
        if (isMounted) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load orders:', err.message);
          setError(err.message || 'Unable to load orders');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [customer]);

  if (!customer) {
    return (
      <div className="orders-page-container">
        <div className="order-auth-prompt-card">
          <div className="prompt-icon">🔒</div>
          <h2>Sign in to view your Orders</h2>
          <p>Please log in with your customer account to view your past purchases and order status.</p>
          <div className="prompt-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      {/* Page Header */}
      <div className="orders-header">
        <div>
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">Track and review all purchases placed under your account</p>
        </div>
        <div className="orders-badge">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </div>
      </div>

      {error && (
        <div className="alert alert-error orders-alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="full-loader">
          <span className="spinner spinner-blue"></span>
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="orders-empty-state">
          <div className="empty-icon">📦</div>
          <h2>No orders placed yet</h2>
          <p>You haven't completed any purchases on ShopKart. Explore our product catalog to get started!</p>
          <Link to="/products" className="btn-hero-primary">
            Explore Product Catalog &rarr;
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="orders-list">
          {orders.map((order) => {
            const isPaid = order.isPaid;
            const isExpanded = Boolean(expandedOrders[order._id]);
            const itemsCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <div key={order._id} className="order-history-card">
                {/* Order Top Bar */}
                <div className="history-card-header">
                  <div className="history-meta-group">
                    <div>
                      <span className="meta-label">ORDER PLACED</span>
                      <span className="meta-val">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="meta-label">TOTAL AMOUNT</span>
                      <span className="meta-val total">{formatINR(order.totalPrice)}</span>
                    </div>

                    <div>
                      <span className="meta-label">SHIP TO</span>
                      <span className="meta-val">{order.shippingAddress?.fullName}</span>
                    </div>
                  </div>

                  <div className="history-order-id-group">
                    <span className="meta-label">ORDER # {order._id}</span>
                    <div className="history-status-pills">
                      <span
                        className={`status-pill ${
                          isPaid
                            ? 'pill-paid'
                            : order.orderStatus === 'Payment Failed'
                            ? 'pill-failed'
                            : 'pill-pending'
                        }`}
                      >
                        {isPaid ? '✅ Paid' : order.orderStatus === 'Payment Failed' ? '❌ Payment Failed' : '⏳ Pending'}
                      </span>
                      <span className="status-pill pill-status">
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="history-card-body">
                  <div className="history-items-row">
                    <div className="history-thumbnails-wrapper">
                      {order.orderItems?.slice(0, 4).map((item) => (
                        <img
                          key={item._id}
                          src={item.image}
                          alt={item.name}
                          className="history-item-thumb"
                          title={`${item.name} (${item.quantity}x)`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                          }}
                        />
                      ))}
                      {order.orderItems?.length > 4 && (
                        <div className="history-more-badge">
                          +{order.orderItems.length - 4} more
                        </div>
                      )}
                    </div>

                    <div className="history-items-summary">
                      <p className="items-summary-text">
                        <strong>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</strong> purchased via {order.paymentMethod}
                      </p>
                      <p className="delivery-destination">
                        📍 Deliver to: {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.postalCode})
                      </p>
                    </div>
                  </div>

                  <div className="history-actions">
                    <button
                      type="button"
                      className="btn-toggle-details"
                      onClick={() => toggleOrderDetails(order._id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                    </button>
                    <Link to={`/orders/${order._id}`} className="btn-view-order-details">
                      Full Receipt &rarr;
                    </Link>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="order-expanded-details">
                    <div className="expanded-section-header">
                      <h3 className="expanded-heading">Order Breakdown &amp; Details</h3>
                      <span className="expanded-order-ref">Order ID: {order._id}</span>
                    </div>

                    {/* Ordered Items Table */}
                    <div className="expanded-block">
                      <h4 className="expanded-block-title">Ordered Items ({order.orderItems?.length || 0})</h4>
                      <div className="expanded-items-list">
                        {order.orderItems?.map((item) => (
                          <div key={item._id} className="expanded-item-row">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="expanded-item-img"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                              }}
                            />
                            <div className="expanded-item-info">
                              <Link
                                to={`/products/${item.product?._id || item.product}`}
                                className="expanded-item-name"
                              >
                                {item.name}
                              </Link>
                              <div className="expanded-item-meta">
                                <span>Unit: {formatINR(item.price)}</span>
                                <span className="expanded-dot">&bull;</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="expanded-item-subtotal">
                              {formatINR(item.itemTotal || (Number(item.price) * Number(item.quantity)))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Two-Column Info Grid: Shipping & Payment */}
                    <div className="expanded-info-grid">
                      <div className="expanded-info-card">
                        <h4 className="expanded-block-title">📍 Shipping Information</h4>
                        <div className="expanded-info-content">
                          <p className="expanded-recipient">
                            <strong>{order.shippingAddress?.fullName}</strong>
                          </p>
                          <p className="expanded-line">{order.shippingAddress?.address}</p>
                          <p className="expanded-line">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                          </p>
                          <p className="expanded-line">{order.shippingAddress?.country}</p>
                          {order.shippingAddress?.phone && (
                            <p className="expanded-contact">
                              <span className="contact-label">Phone:</span> {order.shippingAddress?.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="expanded-info-card">
                        <h4 className="expanded-block-title">💳 Payment Details</h4>
                        <div className="expanded-info-content">
                          <div className="expanded-detail-row">
                            <span className="detail-label">Method:</span>
                            <span className="detail-value">{order.paymentMethod}</span>
                          </div>
                          <div className="expanded-detail-row">
                            <span className="detail-label">Status:</span>
                            <span
                              className={`status-badge-inline ${
                                isPaid
                                  ? 'badge-success'
                                  : order.orderStatus === 'Payment Failed'
                                  ? 'badge-error'
                                  : 'badge-pending'
                              }`}
                            >
                              {isPaid
                                ? 'Payment Completed'
                                : order.orderStatus === 'Payment Failed'
                                ? 'Payment Failed'
                                : 'Pending Payment'}
                            </span>
                          </div>
                          {order.paymentResult?.gatewayOrderId && (
                            <div className="expanded-detail-row">
                              <span className="detail-label">Gateway Order:</span>
                              <code className="detail-code">{order.paymentResult.gatewayOrderId}</code>
                            </div>
                          )}
                          {order.paymentResult?.paymentId && (
                            <div className="expanded-detail-row">
                              <span className="detail-label">Payment ID:</span>
                              <code className="detail-code">{order.paymentResult.paymentId}</code>
                            </div>
                          )}
                          {order.paidAt && (
                            <div className="expanded-detail-row">
                              <span className="detail-label">Paid At:</span>
                              <span className="detail-value">
                                {new Date(order.paidAt).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown Summary */}
                    <div className="expanded-summary-wrapper">
                      <div className="expanded-summary-box">
                        <h4 className="expanded-block-title">Price Summary</h4>
                        <div className="expanded-summary-row">
                          <span>Items Subtotal:</span>
                          <span className="summary-val">
                            {formatINR(
                              order.itemsPrice ||
                                order.orderItems?.reduce(
                                  (sum, item) =>
                                    sum + (item.itemTotal || Number(item.price) * Number(item.quantity)),
                                  0
                                ) ||
                                order.totalPrice
                            )}
                          </span>
                        </div>
                        <div className="expanded-summary-row">
                          <span>Shipping Fee:</span>
                          <span className="summary-val free-shipping">
                            {Number(order.shippingPrice) === 0 ? 'FREE' : formatINR(order.shippingPrice)}
                          </span>
                        </div>
                        <div className="expanded-summary-row">
                          <span>Estimated Tax:</span>
                          <span className="summary-val">{formatINR(order.taxPrice || 0)}</span>
                        </div>
                        <div className="expanded-summary-divider"></div>
                        <div className="expanded-summary-row total-row">
                          <span>Grand Total:</span>
                          <span className="expanded-total-amount">{formatINR(order.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
