import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { renderWithRouter } from '../tests/test-utils';
import App from './App';

describe('App Layout Routing - Production Style TDD Suite', () => {
  const API_URL = 'http://localhost:3000/api';
  const mockToken = 'mock-valid-jwt-string';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear(); // Ensure storage begins completely empty
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. TEST INITIAL LOOKUP SPIN STATE
  it('should render the shared loading layout spinner during initial session lookup', async () => {
    localStorage.setItem('token', mockToken); // Seed token to pass optimization guard
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<App />, { route: '/', path: '/*' });

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  // 2. TEST UNAUTHORIZED REDIRECTION LIFECYCLE
  it('should direct unauthenticated sessions cleanly to the login landing grid', async () => {
    // If no token exists, useAuth skips network calls and sets loading to false immediately
    renderWithRouter(<App />, { route: '/', path: '/*' });

    // Since loading drops immediately without a token, look for the text from your LoginPage element
    // Note: Adjust the regex if your actual LoginPage uses different button or heading text
    const loginView = await screen.findByText(/login page form view/i);
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

    renderWithRouter(<App />, { route: '/', path: '/*' });

    const spinner = await screen.findByTestId('loading-spinner');
    await waitForElementToBeRemoved(spinner);

    const loginView = await screen.findByText(/login page form view/i);
    expect(loginView).toBeInTheDocument();
  });

  // 4. TEST SECURE DASHBOARD ACCESSIBILITY
  it('should unlock dashboard if identity responds with a valid profile payload', async () => {
    const mockProfile = { id: 'uuid-1', username: 'odin_warrior' };
    localStorage.setItem('token', mockToken); // Seed token to trigger the mock endpoint

    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        return HttpResponse.json(mockProfile, { status: 200 });
      })
    );

    renderWithRouter(<App />, { route: '/', path: '/*' });

    const spinner = await screen.findByTestId('loading-spinner');
    await waitForElementToBeRemoved(spinner);

    // Matches the exact header string from your ConversationsPage refactor!
    const dashboardView = await screen.findByText(/conversations dashboard page/i);
    expect(dashboardView).toBeInTheDocument();
  });
});
