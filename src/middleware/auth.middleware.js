import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';


export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const tenantMiddleware = (req, res, next) => {
  try {
    const tenantId = req.query.tenantId || req.params.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID not provided' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (String(req.user.tenantId) !== String(tenantId)) {
      return res.status(403).json({ message: 'Access denied. User does not belong to this tenant' });
    }
    
    req.tenantId = tenantId;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

