import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithRouter } from '../../../tests/test-utils';
import RegisterPage from './RegisterPage';
import { customFetch } from '../../utils/api/api';

// 1. Mock the specific customFetch module utilized by the component architecture internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('RegisterPage Component - Integration TDD Suite', () => {
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

    // 1. TEST SUCCESSFUL REGISTRATION AND AUTO-LOGIN REDIRECTION FLOW
  it('should fire onAuthSuccess and redirect when registration payload returns successfully', async () => {
    const user = userEvent.setup();
    const mockUserPayload = { id: 'new-user-uuid', username: 'odin_rookie', email: 'rookie@odin.com' };
    const mockTokenString = 'jwt-registered-token-string';
    const mockDashboardComponent = vi.fn(() => <div data-testid="real-dashboard">Dashboard View</div>);

    // Provide a valid JSON registration response envelope
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 201, { success: true, user: mockUserPayload, token: mockTokenString })
    );

    renderWithRouter(<RegisterPage onAuthSuccess={mockOnAuthSuccess} />, {
      route: '/register',
      path: '/register',
      customRoutes: [
        { path: '/register', Component: () => <RegisterPage onAuthSuccess={mockOnAuthSuccess} />, HydrateFallback: () => <div data-testid="router-sync">Syncing context state...</div> },
        { path: '/conversations', Component: mockDashboardComponent }
      ]
    });

    await waitForRouterToHydrate();

    // Populate all fields correctly matching the nested component forms labels
    await user.type(screen.getByLabelText(/email address/i), 'rookie@odin.com');
    await user.type(screen.getByLabelText(/username/i), 'odin_rookie');
    await user.type(screen.getByLabelText(/display name \(optional\)/i), 'The Rookie');
    await user.type(screen.getByLabelText(/^password$/i), 'safePassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'safePassword123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    // 🌟 Central Fix: Wrap the function verification inside an async waitFor block 
    // to allow the component's internal async submission block to execute.
    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'rookie@odin.com',
          username: 'odin_rookie',
          displayName: 'The Rookie',
          password: 'safePassword123' // 🌟 Fixed: Removed confirmPassword to match your actual component output payload
        })
      }));
    });

    // Assert that context update triggers fire matching payload formats
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUserPayload, mockTokenString);
    });

    // Verify navigation by checking if the spy component has been successfully invoked
    await waitFor(() => {
      expect(mockDashboardComponent).toHaveBeenCalled();
      expect(screen.getByTestId('real-dashboard')).toBeInTheDocument();
    });
  });


  // 2. TEST CLIENT-SIDE VALIDATION FALLBACK (PASSWORD MISMATCH)
  it('should prevent network submission and throw alert banner if passfields do not match', async () => {
    const user = userEvent.setup();

    renderWithRouter(<RegisterPage onAuthSuccess={mockOnAuthSuccess} />, { route: '/register', path: '/register' });
    await waitForRouterToHydrate();

    await user.type(screen.getByLabelText(/email address/i), 'validation@odin.com');
    await user.type(screen.getByLabelText(/username/i), 'valid_test');
    await user.type(screen.getByLabelText(/^password$/i), 'passwordABC');
    await user.type(screen.getByLabelText(/confirm password/i), 'passwordXYZ'); // Mismatch
    await user.click(screen.getByRole('button', { name: /register/i }));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/passwords do not match\./i);
    expect(customFetch).not.toHaveBeenCalled();
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });

  // 3. TEST SERVER REJECTION EXCEPTIONS
  it('should render explicit application alerts when server endpoint returns an identity error code', async () => {
    const user = userEvent.setup();
    
    customFetch.mockResolvedValueOnce(
      createMockResponse(false, 400, { message: 'Email or Username already taken.' })
    );

    renderWithRouter(<RegisterPage onAuthSuccess={mockOnAuthSuccess} />, { route: '/register', path: '/register' });
    await waitForRouterToHydrate();

    await user.type(screen.getByLabelText(/email address/i), 'duplicate@odin.com');
    await user.type(screen.getByLabelText(/username/i), 'duplicate_user');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    const serverAlert = await screen.findByRole('alert');
    expect(serverAlert).toHaveTextContent(/email or username already taken\./i);
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });
});
