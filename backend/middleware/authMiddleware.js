/**
 * Authentication & Role Authorization Middleware
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_food_rescue_jwt_key_2026';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // Allow demo requests with a mock header or query param for easy UI testing
  if (req.headers['x-demo-user-id'] || req.query.demo_user_id) {
    const demoId = parseInt(req.headers['x-demo-user-id'] || req.query.demo_user_id, 10);
    req.user = { id: demoId, role: req.headers['x-demo-role'] || 'DONOR' };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No Bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user?.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
