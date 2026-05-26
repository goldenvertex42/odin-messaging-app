import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { renderWithRouter } from '../../../tests/test-utils';
import LoginPage from './LoginPage';

describe('LoginPage Component - Integration TDD Suite', () => {
  const API_URL = 'http://localhost:3000/api';
  const mockOnAuthSuccess = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnAuthSuccess.mockClear();
  });

  const waitForRouterToHydrate = async () => {
    await waitFor(() => {
      expect(screen.queryByText(/syncing context state\.\.\./i)).not.toBeInTheDocument();
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

    server.use(
      http.post(`${API_URL}/auth/login`, () => {
        return HttpResponse.json(
          { message: 'Logged in successfully.', user: mockUserPayload, token: mockTokenString },
          { status: 200 }
        );
      })
    );

    // Removed the "router" extraction variable entirely to fix the undefined crash
    renderWithRouter(<LoginPage onAuthSuccess={mockOnAuthSuccess} />, { route: '/login', path: '/login' });
    await waitForRouterToHydrate();

    // Removed manual wrap of act() since userEvent handles internal event loops safely
    await user.type(screen.getByLabelText(/email address/i), 'tester@odin.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify context triggers fire matching payload formats
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUserPayload, mockTokenString);
    });

    // Clean Production-Style Route Verification:
    // Because a successful submit triggers navigate('/conversations'), the LoginPage gets unmounted.
    // We assert navigation success by ensuring the login page headers are missing from the screen!
    await waitFor(() => {
      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    });
  });

  // 3. TEST FAILURES FOR BAD RESPONSES
  it('should display explicit application runtime error messages on a 401 response', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/auth/login`, () => {
        return HttpResponse.json({ message: 'Incorrect email or password.' }, { status: 401 });
      })
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

    server.use(
      http.post(`${API_URL}/auth/login`, () => {
        return new HttpResponse('<!DOCTYPE html><html>Oops!</html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        });
      })
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
