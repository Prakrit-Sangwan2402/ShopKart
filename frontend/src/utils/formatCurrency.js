/**
 * ShopKart Currency Formatter
 * Formats numbers into Indian Rupees (INR - ₹) using the official Intl.NumberFormat standard.
 * Adheres to Indian numbering system formatting (e.g. ₹1,23,456.00).
 */

export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format any number or numeric string as INR.
 * @param {number|string} amount
 * @returns {string} Formatted INR currency string (e.g. "₹28.00")
 */
export const formatINR = (amount) => {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numeric)) {
    return '₹0.00';
  }
  return inrFormatter.format(numeric);
};

export default formatINR;
