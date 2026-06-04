import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router'; 
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute Component - TDD Suite', () => {
  it('should render children elements if the user context is authenticated', () => {
    const mockUser = { id: 'uuid-1', username: 'odin_dev' };
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          {/* ✅ Declare ProtectedRoute as a parent layout component */}
          <Route element={<ProtectedRoute user={mockUser} loading={false} />}>
            {/* ✅ Declare the target element as a nested child route */}
            <Route path="/protected" element={<div data-testid="secret-dashboard">Welcome To Dashboard</div>} />
          </Route>
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
          {/* Layout wrapping for the unauthenticated attempt */}
          <Route element={<ProtectedRoute user={null} loading={false} />}>
            <Route path="/protected" element={<div data-testid="secret-dashboard">Secret Context</div>} />
          </Route>
          {/* Redirect target boundary */}
          <Route path="/login" element={<div data-testid="login-page">Login Form Node</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('secret-dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should show a loading state indicator while session verification evaluates', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute user={null} loading={true} />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText(/secret content/i)).not.toBeInTheDocument();
  });
});
