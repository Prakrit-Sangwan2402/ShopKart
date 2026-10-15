import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { fetchOrderById } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

const OrderDetails = ({ customer }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNewOrder = searchParams.get('success') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!customer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchOrderById(id);
        if (isMounted) {
          setOrder(data.order);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching order details:', err.message);
          setError(err.message || 'Failed to load order details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [id, customer]);

  if (!customer) {
    return (
      <div className="order-details-container">
        <div className="order-auth-prompt-card">
          <div className="prompt-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>Please log in to view your order receipt and tracking status.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="full-loader">
        <span className="spinner spinner-blue"></span>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-container">
        <div className="order-not-found-card">
          <div className="empty-icon">⚠️</div>
          <h2>Order Not Found</h2>
          <p>{error || 'The requested order could not be located or you do not have permission to view it.'}</p>
          <div className="prompt-actions">
            <Link to="/orders" className="btn-primary">
              View My Orders
            </Link>
            <Link to="/products" className="btn-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    _id,
    createdAt,
    orderItems = [],
    shippingAddress = {},
    paymentMethod,
    paymentResult = {},
    totalPrice = 0,
    itemsPrice = 0,
    shippingPrice = 0,
    taxPrice = 0,
    isPaid,
    paidAt,
    orderStatus,
  } = order;

  return (
    <div className="order-details-container">
      {/* New Order Celebratory Banner */}
      {isNewOrder && (
        <div className="order-success-banner">
          <div className="success-icon">🎉</div>
          <div>
            <h3>Order Placed Successfully!</h3>
            <p>
              Your order has been recorded in the database. Thank you for shopping with ShopKart!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="order-header-row">
        <div>
          <span className="order-tag">Verified Order Confirmation</span>
          <h1 className="order-title">Order #{_id}</h1>
          <p className="order-timestamp">
            Placed on {new Date(createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="order-status-badges">
          <span
            className={`status-pill ${
              isPaid
                ? 'pill-paid'
                : orderStatus === 'Payment Failed'
                ? 'pill-failed'
                : 'pill-pending'
            }`}
          >
            {isPaid ? '✅ Paid' : orderStatus === 'Payment Failed' ? '❌ Payment Failed' : '⏳ Payment Pending'}
          </span>
          <span className="status-pill pill-status">
            Status: {orderStatus}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="order-grid">
        {/* Left Column: Details Cards */}
        <div className="order-main-column">
          {/* Items Card */}
          <div className="order-card">
            <h2 className="order-card-title">📦 Ordered Items ({orderItems.length})</h2>
            <div className="order-items-table">
              {orderItems.map((item) => (
                <div key={item._id} className="order-item-row">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="order-item-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                    }}
                  />
                  <div className="order-item-info">
                    <h4 className="order-item-name">
                      <Link to={`/products/${item.product?._id || item.product}`}>
                        {item.name}
                      </Link>
                    </h4>
                    <span className="order-item-meta">
                      {formatINR(item.price)} &times; {item.quantity}
                    </span>
                  </div>
                  <div className="order-item-subtotal">
                    {formatINR(item.itemTotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Information */}
          <div className="order-info-cards-row">
            {/* Shipping Address */}
            <div className="order-card">
              <h3 className="order-card-title">📍 Shipping Details</h3>
              <p className="address-name"><strong>{shippingAddress.fullName}</strong></p>
              <p className="address-line">{shippingAddress.address}</p>
              <p className="address-line">
                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}
              </p>
              <p className="address-line">{shippingAddress.country}</p>
              <p className="address-phone">📞 {shippingAddress.phone}</p>
            </div>

            {/* Payment Details */}
            <div className="order-card">
              <h3 className="order-card-title">💳 Payment Details</h3>
              <p className="payment-method-name"><strong>Method:</strong> {paymentMethod}</p>
              <p className="payment-status-row">
                <strong>Status:</strong>{' '}
                <span className={isPaid ? 'text-success' : 'text-warning'}>
                  {paymentResult?.status || (isPaid ? 'Success' : 'Pending')}
                </span>
              </p>
              {paymentResult?.gatewayOrderId && (
                <p className="payment-ref">
                  <strong>Gateway Ref:</strong> <code>{paymentResult.gatewayOrderId}</code>
                </p>
              )}
              {paymentResult?.paymentId && (
                <p className="payment-ref">
                  <strong>Payment ID:</strong> <code>{paymentResult.paymentId}</code>
                </p>
              )}
              {paidAt && (
                <p className="payment-paid-date">
                  <strong>Paid At:</strong> {new Date(paidAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Price Summary */}
        <div className="order-summary-column">
          <div className="order-summary-card">
            <h2 className="summary-title">Payment Summary</h2>

            <div className="summary-row">
              <span>Items Total:</span>
              <span className="summary-val">{formatINR(itemsPrice)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping Fee:</span>
              <span className="summary-val free-shipping">
                {Number(shippingPrice) === 0 ? 'FREE' : formatINR(shippingPrice)}
              </span>
            </div>

            <div className="summary-row">
              <span>Estimated Tax:</span>
              <span className="summary-val">{formatINR(taxPrice)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total-row">
              <span>Total Paid:</span>
              <span className="total-amount">{formatINR(totalPrice)}</span>
            </div>

            <div className="order-action-links">
              <Link to="/orders" className="btn-my-orders-link">
                View All My Orders
              </Link>
              <Link to="/products" className="btn-continue-shop-link">
                Continue Shopping &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
