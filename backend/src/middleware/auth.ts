import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import User from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(new AppError('Not authorized to access this route', 401));
    return;
  }

  try {
    // Verify token (simplified for development)
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      throw new Error('Invalid token format');
    }
    const decoded = { id: tokenParts[1] };

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      next(new AppError('User not found', 404));
      return;
    }

    if (!user.isActive) {
      next(new AppError('User account is deactivated', 401));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Not authorized to access this route', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Not authorized to access this route', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next();
    return;
  }

  try {
    // Verify token (simplified for development)
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      throw new Error('Invalid token format');
    }
    const decoded = { id: tokenParts[1] };
    const user = await User.findById(decoded.id).select('-password');

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
}; 