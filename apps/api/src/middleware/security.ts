import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://apis.google.com',
          'https://www.gstatic.com',
          'https://checkout.razorpay.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://*.firebaseio.com',
          'https://*.googleapis.com',
          'wss://*.firebaseio.com',
          'https://api.razorpay.com',
          'ws://localhost:*',
          'wss://localhost:*',
          'ws://*',
          'wss://*',
        ],
        frameSrc: [
          "'self'",
          'https://*.firebaseapp.com',
          'https://api.razorpay.com',
          'https://checkout.razorpay.com',
        ],
        mediaSrc: ["'self'", 'blob:', 'mediastream:'],
        workerSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })(req, res, () => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(self), microphone=(self), geolocation=(), payment=(self)',
    );
    next();
  });
}
