import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/api';
import {
  IconTruck,
  IconShieldCheck,
  IconRotateCcw,
  IconHeadphones,
  IconStar,
  IconArrowRight,
} from '../components/Icons';

const Home = ({ customer }) => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadFeatured = async () => {
      try {
        const data = await fetchProducts();
        if (isMounted && data.products) {
          // Take top 8 or 4 products for the bestselling shelf
          setFeaturedProducts(data.products.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to load featured products:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  // Category definitions with curated imagery matching the reference layout
  const categories = [
    {
      name: 'Electronics',
      tagline: 'Audio, gadgets & tech',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
    },
    {
      name: 'Fashion',
      tagline: 'Apparel & timeless style',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80',
    },
    {
      name: 'Home',
      displayName: 'Home & Living',
      tagline: 'Comfort & modern decor',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80',
    },
    {
      name: 'Beauty',
      tagline: 'Skincare & fragrance',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80',
    },
    {
      name: 'Books',
      tagline: 'Bestsellers & fiction',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80',
    },
    {
      name: 'Accessories',
      tagline: 'Watches, bags & more',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
    },
  ];

  // Verified customer reviews
  const reviews = [
    {
      id: 1,
      quote:
        'Amazing products and fast delivery! ShopKart has become my go-to store for quality electronics and everyday lifestyle essentials.',
      author: 'John D.',
      role: 'Verified Customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    },
    {
      id: 2,
      quote:
        'Great quality at affordable prices. The customer support is very responsive and the checkout was seamless.',
      author: 'Sarah M.',
      role: 'Verified Buyer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    },
    {
      id: 3,
      quote:
        'Very happy with my purchase. The item arrived in pristine packaging and exceeded my expectations. Highly recommended!',
      author: 'Michael T.',
      role: 'Verified Customer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    },
  ];

  return (
    <div className="home-container">
      {/* 1. HERO BANNER */}
      <section className="hero-section">
        <div className="hero-layout">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-bullet"></span>
              NEW ARRIVALS 2026
            </div>

            <h1 className="hero-title">
              Discover The Best Products for You
            </h1>

            <p className="hero-description">
              Explore our wide range of high-quality products at affordable prices.
              Shop now and enjoy curated collections made for modern living.
            </p>

            <div className="hero-actions">
              <Link to="/products" className="btn-hero-primary">
                <span>Shop Now</span>
                <IconArrowRight size={17} />
              </Link>
              <a href="#categories" className="btn-hero-secondary">
                Explore Deals
              </a>
            </div>

            {/* Social Proof Avatars */}
            <div className="hero-social-proof">
              <div className="proof-avatars-group">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80" alt="Customer" className="proof-avatar" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80" alt="Customer" className="proof-avatar" />
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80" alt="Customer" className="proof-avatar" />
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80" alt="Customer" className="proof-avatar" />
              </div>
              <div className="proof-text-group">
                <div className="proof-stars">
                  {[...Array(5)].map((_, i) => (
                    <IconStar key={i} size={14} filled={true} />
                  ))}
                </div>
                <span className="proof-label">Trusted by 10,000+ Happy Customers</span>
              </div>
            </div>
          </div>

          {/* Right Podium Visual */}
          <div className="hero-showcase-panel">
            <div className="showcase-card">
              <div className="showcase-img-container">
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"
                  alt="Curated Lifestyle Products"
                  className="showcase-hero-image"
                />
              </div>

              {/* Floating Benefit Badges */}
              <div className="floating-badge badge-top-right">
                <span className="floating-badge-dot"></span>
                <span>Verified Quality</span>
              </div>

              <div className="floating-badge badge-bottom-left">
                <span>Free Shipping &bull; 100% Authentic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFITS STRIP */}
      <section className="benefits-strip-section">
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <IconTruck size={22} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">Free Shipping</h4>
              <p className="benefit-subtitle">On orders over ₹999</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <IconShieldCheck size={22} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">Secure Payment</h4>
              <p className="benefit-subtitle">100% secure checkout</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <IconRotateCcw size={22} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">Easy Returns</h4>
              <p className="benefit-subtitle">30 days return policy</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <IconHeadphones size={22} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">24/7 Support</h4>
              <p className="benefit-subtitle">Dedicated assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section id="categories" className="category-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Shop by Categories</h2>
            <p className="section-subtitle">
              Jump straight into your favourite department
            </p>
          </div>
          <Link to="/products" className="section-header-link">
            <span>View All Categories</span>
            <IconArrowRight size={15} />
          </Link>
        </div>

        <div className="categories-circle-grid">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="category-circle-item"
              onClick={() =>
                navigate(`/products?category=${encodeURIComponent(cat.name)}`)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/products?category=${encodeURIComponent(cat.name)}`);
                }
              }}
            >
              <div className="category-circle-img-wrap">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="category-circle-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';
                  }}
                />
              </div>
              <h4 className="category-circle-name">{cat.displayName || cat.name}</h4>
              <span className="category-circle-tag">{cat.tagline}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BEST SELLING PRODUCTS */}
      <section className="featured-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Best Selling Products</h2>
            <p className="section-subtitle">
              Customer favorites and highly-rated essentials
            </p>
          </div>
          <Link to="/products" className="section-header-link">
            <span>View All Products</span>
            <IconArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="full-loader">
            <span className="spinner spinner-olive" />
            <p>Loading curated products...</p>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                customer={customer}
              />
            ))}
          </div>
        ) : (
          <div className="empty-catalog-state">
            <div className="empty-icon">🛍️</div>
            <h3>Discover Our Catalog</h3>
            <p>
              Explore our full range of products, search items, and filter by your preferred categories.
            </p>
            <Link to="/products" className="btn-hero-primary">
              <span>Explore Products</span>
              <IconArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* 5. PROMOTIONAL SALE BANNER */}
      <section className="promo-banner-section">
        <div className="promo-card">
          <div className="promo-text-col">
            <span className="promo-tag">Special Offer</span>
            <h2 className="promo-title">Up to 50% Off</h2>
            <p className="promo-description">
              Limited time offers on selected seasonal apparel, tech gadgets, and home essentials.
              Hurry up and grab the best deals!
            </p>
            <Link to="/products" className="btn-promo-action">
              <span>Shop the Sale</span>
              <IconArrowRight size={16} />
            </Link>
          </div>

          <div className="promo-image-col">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&q=80"
              alt="Special Seasonal Sale"
              className="promo-image"
            />
          </div>
        </div>
      </section>

      {/* 6. WHAT OUR CUSTOMERS SAY (TESTIMONIALS) */}
      <section className="testimonials-section">
        <div className="testimonials-header">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">
            Authentic experiences from verified buyers
          </p>
        </div>

        <div className="testimonials-grid">
          {reviews.map((rev) => (
            <div key={rev.id} className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={15} filled={true} />
                ))}
              </div>
              <p className="testimonial-quote">"{rev.quote}"</p>
              <div className="testimonial-author">
                <img src={rev.avatar} alt={rev.author} className="author-avatar" />
                <div>
                  <h4 className="author-name">{rev.author}</h4>
                  <span className="author-role">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;