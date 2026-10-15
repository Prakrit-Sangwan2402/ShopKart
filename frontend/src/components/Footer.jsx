import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconShieldCheck, IconTruck, IconRotateCcw } from './Icons';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Top Feature Badges */}
        <div className="footer-perks-row">
          <div className="footer-perk">
            <div className="perk-icon-wrap">
              <IconTruck size={20} />
            </div>
            <div>
              <h4>Free Delivery</h4>
              <p>On eligible orders above ₹999</p>
            </div>
          </div>

          <div className="footer-perk">
            <div className="perk-icon-wrap">
              <IconShieldCheck size={20} />
            </div>
            <div>
              <h4>Secure Shopping</h4>
              <p>100% encrypted checkout</p>
            </div>
          </div>

          <div className="footer-perk">
            <div className="perk-icon-wrap">
              <IconRotateCcw size={20} />
            </div>
            <div>
              <h4>Easy 30-Day Returns</h4>
              <p>Simple return & refund policy</p>
            </div>
          </div>
        </div>

        {/* Main 4-Column Grid */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <Link to="/home" className="footer-logo">
              SHOP<span>KART</span>
            </Link>
            <p className="footer-tagline">
              Your trusted destination for elevated everyday essentials, curated electronics, and modern lifestyle products.
            </p>
            <div className="footer-trust-pill">
              <span>Verified Brand &bull; Est. 2026</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/wishlist">Saved Wishlist</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="footer-col">
            <h4 className="footer-heading">Customer Care</h4>
            <ul className="footer-links">
              <li><Link to="/orders">Track Order</Link></li>
              <li><Link to="/profile">Account Settings</Link></li>
              <li><a href="#support" onClick={(e) => e.preventDefault()}>Shipping Policy</a></li>
              <li><a href="#returns" onClick={(e) => e.preventDefault()}>Returns & Exchanges</a></li>
              <li><a href="#help" onClick={(e) => e.preventDefault()}>Help & FAQs</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-heading">Subscribe to Newsletter</h4>
            <p className="newsletter-desc">
              Get the latest updates on new arrivals, exclusive seasonal releases, and special deals.
            </p>
            {subscribed ? (
              <div className="newsletter-success">
                ✓ Thank you for subscribing to ShopKart!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="btn-newsletter">
                  Subscribe
                </button>
              </form>
            )}
            <span className="newsletter-guarantee">We respect your privacy. No spam.</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; 2026 ShopKart Inc. All rights reserved. Designed with modern aesthetics.
          </p>
          <div className="footer-legal">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <span>&bull;</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <span>&bull;</span>
            <a href="#security" onClick={(e) => e.preventDefault()}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
