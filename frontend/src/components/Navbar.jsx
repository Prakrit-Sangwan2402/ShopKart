import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { IconCart, IconHeart, IconUser, IconSearch, IconPackage } from './Icons';

const Navbar = ({ customer, onLogout, isLoggingOut }) => {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [navSearch, setNavSearch] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-announcement-bar">
        <div className="announcement-content">
          <span>FREE DELIVERY ON ORDERS ABOVE ₹999 &bull; 100% SECURE CHECKOUT &bull; 30-DAY EASY RETURNS</span>
        </div>
      </div>

      <header className="navbar">
        <div className="nav-left">
          <Link to="/home" className="nav-brand">
            SHOP<span>KART</span>
          </Link>

          <nav className="nav-links">
            <NavLink
              to="/home"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Shop
            </NavLink>
            <NavLink
              to="/products?category=Electronics"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Electronics
            </NavLink>
            <NavLink
              to="/products?category=Fashion"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Fashion
            </NavLink>
            <NavLink
              to="/products?category=Home"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Home & Living
            </NavLink>
          </nav>
        </div>

        {/* Center Minimal Search Bar */}
        <form onSubmit={handleSearchSubmit} className="nav-search-form">
          <IconSearch size={16} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search products, brands and essentials..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="nav-search-input"
          />
        </form>

        {/* Right Action Icons & Auth Controls */}
        <div className="nav-right">
          {/* Wishlist Link */}
          <NavLink
            to="/wishlist"
            className={({ isActive }) => `nav-icon-btn ${isActive ? 'active' : ''}`}
            title="Wishlist"
          >
            <IconHeart size={19} />
            <span className="nav-icon-label">Wishlist</span>
          </NavLink>

          {/* Cart Link with Badge */}
          <NavLink
            to="/cart"
            className={({ isActive }) => `nav-icon-btn nav-cart-btn ${isActive ? 'active' : ''}`}
            title="Shopping Cart"
          >
            <div className="cart-icon-container">
              <IconCart size={20} />
              {cartCount > 0 && (
                <span className="nav-cart-badge">{cartCount}</span>
              )}
            </div>
            <span className="nav-icon-label">Cart</span>
          </NavLink>

          {/* User Account / Profile */}
          {customer ? (
            <div className="nav-user-dropdown">
              <NavLink
                to="/orders"
                className={({ isActive }) => `nav-icon-btn ${isActive ? 'active' : ''}`}
                title="My Orders"
              >
                <IconPackage size={19} />
                <span className="nav-icon-label">Orders</span>
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-user-btn ${isActive ? 'active' : ''}`}
                title="Account Profile"
              >
                <IconUser size={18} />
                <span className="nav-user-name">
                  {customer.fullName?.split(' ')[0] || 'Account'}
                </span>
              </NavLink>

              <button
                type="button"
                className="btn-nav-logout"
                onClick={onLogout}
                disabled={isLoggingOut}
                title="Log out of account"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="nav-auth-links">
              <NavLink
                to="/login"
                className={({ isActive }) => `btn-nav-login ${isActive ? 'active' : ''}`}
              >
                <IconUser size={17} />
                <span>Login</span>
              </NavLink>
              <NavLink
                to="/register"
                className="btn-nav-register"
              >
                Register
              </NavLink>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;
