import { Request, Response, NextFunction } from 'express';

export const serviceKeyOnly = (req: Request, res: Response, next: NextFunction): void => {
  const serviceKey = req.header('X-Service-Key');
  const expectedKey = process.env.SERVICE_KEY;

  if (!expectedKey || !serviceKey || serviceKey !== expectedKey) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  next();
};


