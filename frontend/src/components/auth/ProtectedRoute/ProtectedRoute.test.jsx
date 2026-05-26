import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router'; // Pure modern react-router
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute Component - TDD Suite', () => {
  it('should render children elements if the user context is authenticated', () => {
    const mockUser = { id: 'uuid-1', username: 'odin_dev' };

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute user={mockUser} loading={false}>
              <div data-testid="secret-dashboard">Welcome To Dashboard</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('secret-dashboard')).toBeInTheDocument();
    expect(screen.getByText(/welcome to dashboard/i)).toBeInTheDocument();
  });

  it('should redirect to the login route if the user is null', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute user={null} loading={false}>
              <div data-testid="secret-dashboard">Secret Context</div>
            </ProtectedRoute>
          } />
          <Route path="/login" element={<div data-testid="login-page">Login Form Node</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Verify the protected node was blocked and the app dropped back to /login
    expect(screen.queryByTestId('secret-dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should show a loading state indicator while session verification evaluates', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute user={null} loading={true}>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText(/secret content/i)).not.toBeInTheDocument();
  });
});
