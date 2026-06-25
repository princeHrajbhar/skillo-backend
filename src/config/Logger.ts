import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: {
    // Never log these fields — they may appear in serialised objects
    paths: [
      'password',
      'newPassword',
      'otp',
      'refreshToken',
      'accessToken',
      '*.password',
      '*.otp',
      '*.refreshToken',
      'req.headers.cookie',
      'req.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
});
