import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithRouter } from '../../../tests/test-utils';
import LoginPage from './LoginPage';
import { customFetch } from '../../utils/api/api';

// 1. Mock the specific customFetch module that the component utilizes internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('LoginPage Component - Integration Suite', () => {
  const mockOnAuthSuccess = vi.fn();

  // Helper utility to generate realistic network responses containing content-type mock maps
  const createMockResponse = (ok, status, data, contentTypeString = 'application/json') => {
    const headersMap = new Map();
    if (contentTypeString) headersMap.set('content-type', contentTypeString);

    return {
      ok,
      status,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase())
      },
      json: async () => data
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthSuccess.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const waitForRouterToHydrate = async () => {
    await waitFor(() => {
      expect(screen.queryByTestId('router-sync')).not.toBeInTheDocument();
    });
  };

  // 1. TEST BASE RENDERING BOUNDARY
  it('should display the core header content and load the child LoginForm components', async () => {
    renderWithRouter(<LoginPage onAuthSuccess={mockOnAuthSuccess} />, { route: '/login', path: '/login' });
    await waitForRouterToHydrate();

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in to join your odin chat rooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // 2. TEST SUCCESSFUL AUTHENTICATION REDIRECTION FLOW
  it('should fire onAuthSuccess and route forward upon a valid JSON user form submission', async () => {
    const user = userEvent.setup();
    const mockUserPayload = { id: 'user-valhalla', username: 'odin_coder' };
    const mockTokenString = 'jwt-valid-token-example';

    const mockDashboardComponent = vi.fn(() => <div data-testid="real-dashboard">Dashboard View</div>);

    // Provide a valid JSON response structure
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, { success: true, user: mockUserPayload, token: mockTokenString })
    );

    renderWithRouter(<LoginPage onAuthSuccess={mockOnAuthSuccess} />, {
      route: '/login',
      path: '/login',
      customRoutes: [
        { 
          path: '/login', 
          Component: () => <LoginPage onAuthSuccess={mockOnAuthSuccess} />, 
          HydrateFallback: () => <div data-testid="router-sync">Syncing context state...</div> 
        },
        { 
          path: '/conversations', 
          Component: mockDashboardComponent 
        }
      ]
    });

    await waitForRouterToHydrate();

    await user.type(screen.getByLabelText(/email address/i), 'tester@odin.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify background request payload matches specification requirements
    expect(customFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'tester@odin.com', password: 'password123' })
    }));

    // Verify context state callbacks dispatch with exact matching arguments
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUserPayload, mockTokenString);
    });

    // Ensure the route transition has been triggered and unmounted the form view
    await waitFor(() => {
      expect(mockDashboardComponent).toHaveBeenCalled();
      expect(screen.getByTestId('real-dashboard')).toBeInTheDocument();
    });
  });

  // 3. TEST FAILURES FOR BAD RESPONSES
  it('should display explicit application runtime error messages on a 401 response', async () => {
    const user = userEvent.setup();
    
    customFetch.mockResolvedValueOnce(
      createMockResponse(false, 401, { message: 'Incorrect email or password.' })
    );

    renderWithRouter(<LoginPage onAuthSuccess={mockOnAuthSuccess} />, { route: '/login', path: '/login' });
    await waitForRouterToHydrate();

    await user.type(screen.getByLabelText(/email address/i), 'wrong@odin.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const validationAlert = await screen.findByRole('alert');
    expect(validationAlert).toHaveTextContent(/incorrect email or password\./i);
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });

  // 4. TEST TOTAL BACKEND FALLBACK PROTECTION CRASHES
  it('should intercept invalid HTML content type responses cleanly without crashing the frame', async () => {
    const user = userEvent.setup();
    
    // Simulate a raw server crash page response containing text/html headers
    customFetch.mockResolvedValueOnce(
      createMockResponse(false, 500, '<!DOCTYPE html><html>Oops!</html>', 'text/html')
    );

    renderWithRouter(<LoginPage onAuthSuccess={mockOnAuthSuccess} />, { route: '/login', path: '/login' });
    await waitForRouterToHydrate();

    await user.type(screen.getByLabelText(/email address/i), 'crash@odin.com');
    await user.type(screen.getByLabelText(/password/i), 'crash123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const errorBanner = await screen.findByRole('alert');
    expect(errorBanner).toHaveTextContent(/server returned an invalid network response layout\./i);
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });
});
