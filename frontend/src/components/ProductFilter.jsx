import React from 'react';
import { IconSearch } from './Icons';

const ProductFilter = ({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  onReset,
  totalCount,
}) => {
  const categoryOptions = [
    'All Categories',
    'Electronics',
    'Fashion',
    'Home',
    'Books',
    'Beauty',
    'Accessories',
  ];

  const hasActiveFilters =
    search.trim() !== '' ||
    (category && category !== 'All Categories' && category !== 'All') ||
    sort !== '';

  return (
    <div className="filter-panel">
      <div className="filter-controls-grid">
        {/* Search Input */}
        <div className="filter-group search-group">
          <label className="filter-label" htmlFor="product-search">
            Search Products
          </label>
          <div className="search-input-wrapper">
            <IconSearch size={16} className="search-field-icon" />
            <input
              id="product-search"
              type="text"
              className="filter-input"
              placeholder="Search by keyword, name, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setSearch('')}
                title="Clear search"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="category-select">
            Category
          </label>
          <select
            id="category-select"
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Home' ? 'Home & Living' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="sort-select">
            Sort Order
          </label>
          <select
            id="sort-select"
            className="filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Default (Newest First)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="filter-summary-bar">
        <span className="results-count">
          Showing <strong>{totalCount}</strong> {totalCount === 1 ? 'product' : 'products'}
        </span>

        {hasActiveFilters && (
          <button type="button" className="btn-reset-filters" onClick={onReset}>
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;
