import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';
import { fetchProducts } from '../services/api';

const Products = ({ customer }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params if present
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialSort = searchParams.get('sort') || '';

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products whenever search, category, or sort changes
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchProducts({
          search,
          category,
          sort,
        });

        if (isMounted) {
          setProducts(data.products || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Fetch products error:', err.message);
          setError(err.message || 'Failed to load products from server.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Update URL query parameters for shareability
    const newParams = {};
    if (search.trim()) newParams.search = search.trim();
    if (category && category !== 'All Categories' && category !== 'All') newParams.category = category;
    if (sort) newParams.sort = sort;
    setSearchParams(newParams, { replace: true });

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [search, category, sort, setSearchParams]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All Categories');
    setSort('');
  };

  return (
    <div className="products-page-container">
      <div className="products-page-header">
        <h1 className="products-page-title">Product Catalog</h1>
        <p className="products-page-subtitle">
          Browse, search, and discover items in real time from our MongoDB database
        </p>
      </div>

      {/* Filter and Search Controls */}
      <ProductFilter
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        onReset={handleResetFilters}
        totalCount={products.length}
      />

      {/* Feedback & Content States */}
      {loading ? (
        <div className="full-loader">
          <span className="spinner spinner-blue"></span>
          <p>Loading products from catalog...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error products-alert">
          <p><strong>Error loading catalog:</strong> {error}</p>
          <button className="btn-retry" onClick={() => handleResetFilters()}>
            Reset & Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon">🔍</div>
          <h3>No matching products found</h3>
          <p>We couldn't find any items matching your search or filter criteria.</p>
          <button className="btn-hero-primary" onClick={handleResetFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
