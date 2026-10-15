const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized, token missing',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: 'Not authorized, token invalid or expired',
      });
    }

    const customer = await Customer.findById(decoded.userId).select('-password');
    if (!customer) {
      return res.status(401).json({
        message: 'Not authorized, customer no longer exists',
      });
    }

    req.user = {
      _id: customer._id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

module.exports = {
  protect,
};

