import { Request, Response, NextFunction } from 'express';

// Debug middleware to log all request details
export const debugAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('\n🔍 AUTH DEBUG - Request Details:');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  console.log('Authorization header:', req.headers.authorization);
  console.log('Authorization starts with Bearer:', req.headers.authorization?.startsWith('Bearer'));
  
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    console.log('Authorization parts:', parts);
    console.log('Token part:', parts[1]);
  }
  
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  console.log('🔍 END AUTH DEBUG\n');
  
  next();
};
