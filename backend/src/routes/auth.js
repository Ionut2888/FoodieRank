const express = require('express');
const { register, login } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Protected route example - get current user profile
router.get('/profile', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: req.user
    }
  });
});

module.exports = router;