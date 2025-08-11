import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: Express.Multer.File;
    }
    interface Response {}
    interface NextFunction {}
  }
}

export {};