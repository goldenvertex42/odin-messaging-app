import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../tests/test-utils';
import App from './App';

const mockUseAuth = vi.fn();
vi.mock('./context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('./pages/LoginPage/LoginPage', () => ({
  default: ({ onAuthSuccess }) => (
    <div data-testid="page-login">
      <h2>Login View</h2>
      <button onClick={() => onAuthSuccess({ id: 'u1', username: 'odin', themePreference: 'EMERALD' }, 'mock-jwt')}>
        Simulate Login Success
      </button>
    </div>
  )
}));

vi.mock('./pages/RegisterPage/RegisterPage', () => ({
  default: () => <div data-testid="page-register"><h2>Register View</h2></div>
}));

vi.mock('./pages/ConversationsPage/ConversationsPage', () => ({
  default: ({ user }) => (
    <div data-testid="page-conversations">
      <h2>Conversations View Workspace</h2>
      <span>Active User: {user?.username}</span>
    </div>
  )
}));

vi.mock('./pages/ProfilePage/ProfilePage', () => ({
  default: ({ currentUser }) => (
    <div data-testid="page-profile">
      <h2>Profile View Workspace</h2>
      <span>Preference: {currentUser?.themePreference}</span>
    </div>
  )
}));

vi.mock('./pages/FriendsListPage/FriendsListPage', () => ({
  default: () => <div data-testid="page-friends"><h2>Friends List Workspace</h2></div>
}));

vi.mock('./components/ui/LoadingSpinner/LoadingSpinner', () => ({
  default: () => <div data-testid="app-loading-spinner">Synchronizing identity state...</div>
}));

describe('App Component - Global Orchestration & Security Suite', () => {
  
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const appRouteConfig = [
    {
      path: '*',
      Component: App
    }
  ];

  test('renders global loading spinner while session verification evaluates', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: vi.fn(),
      updateUserTheme: vi.fn()
    });

    renderWithRouter(null, {
      route: '/',
      customRoutes: appRouteConfig
    });

    expect(screen.getByTestId('app-loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('page-login')).not.toBeInTheDocument();
  });

  test('forces unauthenticated requests entering private directories back to login form targets', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      updateUserTheme: vi.fn()
    });

    renderWithRouter(null, {
      route: '/conversations',
      customRoutes: appRouteConfig
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-login')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('page-conversations')).not.toBeInTheDocument();
  });

  test('routes authenticated users automatically past login boundaries directly into conversational workspace', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'odin_boss', themePreference: 'SLATE' },
      loading: false,
      login: vi.fn(),
      updateUserTheme: vi.fn()
    });

    renderWithRouter(null, {
      route: '/login',
      customRoutes: appRouteConfig
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-conversations')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('page-login')).not.toBeInTheDocument();
    expect(screen.getByText(/active user: odin_boss/i)).toBeInTheDocument();
  });

  test('routes authenticated parameters correctly matching active dynamic token routes within workspace layouts', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'odin_boss', themePreference: 'SLATE' },
      loading: false,
      login: vi.fn(),
      updateUserTheme: vi.fn()
    });

    renderWithRouter(null, {
      route: '/conversations/chat-room-xyz',
      customRoutes: appRouteConfig
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-conversations')).toBeInTheDocument();
    });
  });

  test('applies structural data theme classes cleanly to view root based on active profile preferences', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'thor_dev', themePreference: 'AMETHYST' },
      loading: false,
      login: vi.fn(),
      updateUserTheme: vi.fn()
    });

    const { container } = renderWithRouter(null, {
      route: '/profile',
      customRoutes: appRouteConfig
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-profile')).toBeInTheDocument();
    });

    const rootViewport = container.querySelector('.app-viewport-root');
    expect(rootViewport).toHaveAttribute('data-theme', 'AMETHYST');
  });

  test('fires login callback execution strings cleanly upon login submission transactions', async () => {
    const mockLoginCallback = vi.fn();
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLoginCallback,
      updateUserTheme: vi.fn()
    });

    renderWithRouter(null, {
      route: '/login',
      customRoutes: appRouteConfig
    });

    const triggerBtn = screen.getByRole('button', { name: /simulate login success/i });
    await user.click(triggerBtn);

    expect(mockLoginCallback).toHaveBeenCalledTimes(1);
    expect(mockLoginCallback).toHaveBeenCalledWith(
      { id: 'u1', username: 'odin', themePreference: 'EMERALD' },
      'mock-jwt'
    );
  });
});
