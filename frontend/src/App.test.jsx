import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import App from './App';

describe('App Layout Routing - Production Style TDD Suite', () => {
  const API_URL = 'http://localhost:3000/api';
  const mockToken = 'mock-valid-jwt-string';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Helper function to mount App cleanly within a real, clean router context
  const renderAppInRouter = () => {
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  };

  // 1. TEST INITIAL LOOKUP SPIN STATE
  it('should render the shared loading layout spinner during initial session lookup', async () => {
    localStorage.setItem('token', mockToken);
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    renderAppInRouter();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // 2. TEST UNAUTHORIZED REDIRECTION LIFECYCLE
  it('should direct unauthenticated sessions cleanly to the login landing grid', async () => {
    // If no token exists, useAuth instantly drops loading to false and redirects
    renderAppInRouter();

    // Verify the real LoginPage components load seamlessly
    const loginView = await screen.findByText(/welcome back/i);
    expect(loginView).toBeInTheDocument();
  });

  // 3. TEST EXPIRED TOKEN TO LOGIN REDIRECTION
  it('should redirect to login if an existing token returns a 401 unauthenticated response', async () => {
    localStorage.setItem('token', 'expired-token');

    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        return HttpResponse.json({ error: 'Token expired' }, { status: 401 });
      })
    );

    renderAppInRouter();
    
    // First, verify the loading spinner mounts securely while MSW queries
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Force the test framework to wait until the async MSW mock completes
    await waitForElementToBeRemoved(() => screen.queryByTestId('loading-spinner'));

    // Assert that the real login screen mounts
    const loginView = await screen.findByText(/welcome back/i);
    expect(loginView).toBeInTheDocument();
  });

    // 4. TEST SECURE DASHBOARD ACCESSIBILITY
  it('should unlock dashboard if identity responds with a valid profile payload', async () => {
    const mockProfile = { id: 'uuid-1', username: 'odin_warrior' };
    localStorage.setItem('token', mockToken);

    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        return HttpResponse.json(mockProfile, { status: 200 });
      }),
      
      http.get(`${API_URL}/conversations`, () => {
        return HttpResponse.json({ success: true, data: [] }, { status: 200 });
      })
    );

    renderAppInRouter();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByTestId('loading-spinner'));

    const dashboardHeader = await screen.findByRole('heading', { name: /conversations/i });
    expect(dashboardHeader).toBeInTheDocument();
  });

});
