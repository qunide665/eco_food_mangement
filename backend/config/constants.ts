export const SERVER_CONFIG = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  EXPIRES_IN: '7d',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_TAKEN: 'Email already in use',
  UNAUTHORIZED: 'Unauthorized',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_TOKEN: 'Invalid token',
} as const;
