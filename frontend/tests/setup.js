import { expect, beforeAll, afterEach, afterAll } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from '../src/mocks/server';

expect.extend(matchers);

// Boot up the network interceptor sandbox layer before files process
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  // ⚠️ CRITICAL: Clears out server.use() runtime adjustments back to baseline handlers
  server.resetHandlers(); 
  
  // Safely wipes browser storage contexts so configurations don't cross contamination barriers
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterAll(() => server.close());
