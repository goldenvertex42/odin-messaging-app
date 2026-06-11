import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('api.js customFetch Wrapper Suite', () => {
  const BASE_URL = 'http://localhost:3000';

  const createMockResponse = (ok, status, statusText, textPayload, contentType = 'application/json') => {
    const headersMap = new Map();
    if (contentType) headersMap.set('content-type', contentType);

    return {
      ok,
      status,
      statusText,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase())
      },
      text: async () => textPayload
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset modules to clear evaluation cache between tests
    vi.resetModules();
    
    // Bind environment variables straight to the bundler engine prior to execution loops
    import.meta.env.VITE_API_URL = BASE_URL;
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_URL = '';
  });

  it('should prepend the VITE_API_URL to endpoints starting with a slash cleanly', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );

    const { customFetch } = await import('./api');
    await customFetch('/api/conversations');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/conversations',
      expect.any(Object)
    );
  });

  it('should insert a separating slash fallback if the endpoint misses a slash prefix', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );

    const { customFetch } = await import('./api');
    await customFetch('api/conversations');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/conversations',
      expect.any(Object)
    );
  });

  it('should automatically append JSON headers if passing an object payload body', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );

    const { customFetch } = await import('./api');
    await customFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello!' })
    });

    // Extract options dictionary using explicit call position matrices safely
    const calledOptions = vi.mocked(globalThis.fetch).mock.calls[0][1];
    expect(calledOptions.headers.get('Content-Type')).toBe('application/json');
  });

  it('should skip appending Content-Type headers if the transmission body is a FormData binary object', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );

    const mockFormData = new FormData();

    const { customFetch } = await import('./api');
    await customFetch('/api/attachments', {
      method: 'POST',
      body: mockFormData
    });

    const calledOptions = vi.mocked(globalThis.fetch).mock.calls[0][1];
    expect(calledOptions.headers.get('Content-Type')).toBeNull();
  });

  it('should automatically inject Bearer session authorization tokens when stored locally', async () => {
    localStorage.setItem('token', 'jwt-secret-payload-token-string');
    
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );

    const { customFetch } = await import('./api');
    await customFetch('/api/profile/me');

    const calledOptions = vi.mocked(globalThis.fetch).mock.calls[0][1];
    expect(calledOptions.headers.get('Authorization')).toBe('Bearer jwt-secret-payload-token-string');
  });

  it('should parse the network payload text body and serve responsive json/text tracking methods on success', async () => {
    const jsonString = JSON.stringify({ success: true, count: 42 });
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', jsonString)
    );

    const { customFetch } = await import('./api');
    const result = await customFetch('/api/stats');

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    
    const jsonData = await result.json();
    const textData = await result.text();

    expect(jsonData).toEqual({ success: true, count: 42 });
    expect(textData).toBe(jsonString);
  });

  it('should intercept server validation failures and throw a custom error containing backend messaging parameters', async () => {
    const errorPayload = JSON.stringify({ message: 'Authentication expired or malformed.' });
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(false, 401, 'Unauthorized', errorPayload)
    );

    const { customFetch } = await import('./api');
    await expect(
      customFetch('/api/secure-thread')
    ).rejects.toThrow('Authentication expired or malformed.');
  });

  it('should fall back to status text parameters during crashes if json payload messaging properties are empty', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(false, 500, 'Internal Server Crash Page', null, 'text/html')
    );

    const { customFetch } = await import('./api');
    await expect(
      customFetch('/api/broken-route')
    ).rejects.toThrow('API Error: Internal Server Crash Page');
  });
});
