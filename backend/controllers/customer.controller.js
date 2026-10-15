const bcrypt = require('bcrypt');
const Customer = require('../models/customer.model');
const generateToken = require('../utils/generateToken');

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        message: 'All fields (fullName, email, password, phone) are required',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) {
      return res.status(409).json({
        message: 'A customer with this email already exists',
      });
    }

    // Hash password with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new customer
    const customer = await Customer.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
    });

    // Return success response without password
    return res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find customer by email
    const customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, customer.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Generate JWT and set cookie
    generateToken(customer._id, res);

    // Return success response without password or JWT
    return res.status(200).json({
      message: 'Login successful',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const getMe = async (req, res) => {
  try {
    const customer = req.user;

    return res.status(200).json({
      message: 'Customer profile fetched successfully',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const logoutCustomer = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
};


