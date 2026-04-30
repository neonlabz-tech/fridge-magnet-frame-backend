import { LoggingMiddleware } from './logging.middleware';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log request and call next()', () => {
    const req: any = {
      method: 'GET',
      originalUrl: '/test-route',
    };

    const res: any = {};

    const next = jest.fn();

    middleware.use(req, res, next);

    expect(console.log).toHaveBeenCalledWith('[GET] /test-route');
    expect(next).toHaveBeenCalled();
  });

  it('should work for POST request', () => {
    const req: any = {
      method: 'POST',
      originalUrl: '/auth/login',
    };

    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(console.log).toHaveBeenCalledWith('[POST] /auth/login');
    expect(next).toHaveBeenCalled();
  });
});