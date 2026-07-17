import rateLimit from 'express-rate-limit';

function shouldSkip() {
  return process.env.NODE_ENV === 'test' || process.env.VITEST;
}

export const authLimiter = shouldSkip()
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { message: 'Too many attempts. Try again in 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const apiLimiter = shouldSkip()
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { message: 'Too many requests. Try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
