import pinoHttp from 'pino-http';
import { logger } from '../lib/pino';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    return (req as unknown as { requestId: string }).requestId ?? 'unknown';
  },
  customProps: (req) => {
    return {
      requestId: (req as unknown as { requestId: string }).requestId,
    };
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, _res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },
});
