import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const incrMock = jest.fn();
const expireMock = jest.fn();
const pexpireMock = jest.fn();
const pttlMock = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    incr: incrMock,
    expire: expireMock,
    pexpire: pexpireMock,
    pttl: pttlMock
  }))
}));

describe('rateLimit', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      UPSTASH_REDIS_REST_URL: 'url',
      UPSTASH_REDIS_REST_TOKEN: 'token'
    };
    incrMock.mockReset();
    expireMock.mockReset();
    pexpireMock.mockReset();
    pttlMock.mockReset();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('allows requests under the limit', async () => {
    incrMock.mockResolvedValue(1);
    pttlMock.mockResolvedValue(1000);

    const { rateLimit } = await import('./rateLimit');
    const result = await rateLimit('user');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
    expect(expireMock).toHaveBeenCalled();
  });

  it('blocks requests over the limit', async () => {
    incrMock.mockResolvedValue(6);
    pttlMock.mockResolvedValue(500);

    const { rateLimit } = await import('./rateLimit');
    const result = await rateLimit('user');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(5);
  });
});
