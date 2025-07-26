import jwt from 'jsonwebtoken';
import User from '../Models/user.model.js';

const authMiddleware = {
  protect: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },

  isAdmin: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

export default authMiddleware;