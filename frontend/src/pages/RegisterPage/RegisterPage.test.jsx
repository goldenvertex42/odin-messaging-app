import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { renderWithRouter } from '../../../tests/test-utils';
import RegisterPage from './RegisterPage';

describe('RegisterPage Component - Integration TDD Suite', () => {
  const API_URL = 'http://localhost:3000/api';
  const mockOnAuthSuccess = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnAuthSuccess.mockClear();
  });

  // Helper utility to wait for the internal routing stub context layer to hydrate using data-testid
  const waitForRouterToHydrate = async () => {
    await waitFor(() => {
      expect(screen.queryByTestId('router-sync')).not.toBeInTheDocument();
    });
  };

  // 2. TEST SUCCESSFUL REGISTRATION AND AUTO-LOGIN REDIRECTION FLOW
  it('should fire onAuthSuccess and redirect when registration payload returns successfully', async () => {
    const user = userEvent.setup();
    const mockUserPayload = { id: 'new-user-uuid', username: 'odin_rookie', email: 'rookie@odin.com' };
    const mockTokenString = 'jwt-registered-token-string';
    
    // Create a dedicated spy element to intercept the route switch natively
    const mockDashboardComponent = vi.fn(() => <div data-testid="real-dashboard">Dashboard View</div>);

    server.use(
      http.post(`${API_URL}/auth/register`, () => {
        return HttpResponse.json(
          { message: 'User registered successfully.', user: mockUserPayload, token: mockTokenString },
          { status: 201 }
        );
      })
    );

    // FIX: Pass the dynamic customRoutes payload matching your refactored utility signature!
    renderWithRouter(<RegisterPage onAuthSuccess={mockOnAuthSuccess} />, { 
      route: '/register', 
      path: '/register',
      customRoutes: [
        { 
          path: '/register', 
          Component: () => <RegisterPage onAuthSuccess={mockOnAuthSuccess} />,
          HydrateFallback: () => <div data-testid="router-sync">Syncing context state...</div>
        },
        { 
          path: '/conversations', 
          Component: mockDashboardComponent // Hooked to our custom spy container!
        }
      ]
    });
    
    await waitForRouterToHydrate();

    // Populate all fields correctly
    await user.type(screen.getByLabelText(/email address/i), 'rookie@odin.com');
    await user.type(screen.getByLabelText(/username/i), 'odin_rookie');
    await user.type(screen.getByLabelText(/display name \(optional\)/i), 'The Rookie');
    await user.type(screen.getByLabelText(/^password$/i), 'safePassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'safePassword123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Assert that context update triggers fire matching payload formats
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUserPayload, mockTokenString);
    });

    // Verify navigation by checking if the spy component has been successfully invoked by the router stub tree!
    await waitFor(() => {
      expect(mockDashboardComponent).toHaveBeenCalled();
      expect(screen.getByTestId('real-dashboard')).toBeInTheDocument();
    });
  });


  // 3. TEST CLIENT-SIDE VALIDATION FALLBACK (PASSWORD MISMATCH)
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
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });

  // 4. TEST SERVER REJECTION EXCEPTIONS
  it('should render explicit application alerts when server endpoint returns an identity error code', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/auth/register`, () => {
        return HttpResponse.json({ message: 'Email or Username already taken.' }, { status: 400 });
      })
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
