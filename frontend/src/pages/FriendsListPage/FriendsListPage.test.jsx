import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../../tests/test-utils';
import FriendsListPage from './FriendsListPage';

const mockUseFriendsData = vi.fn();
vi.mock('../../hooks/useFriendsData/useFriendsData', () => ({
  default: () => mockUseFriendsData()
}));

vi.mock('../../components/friends/FriendSearch/FriendSearch', () => ({
  default: () => <div data-testid="mock-friend-search">Friend Search Component</div>
}));

vi.mock('../../components/friends/PendingRequests/PendingRequests', () => ({
  default: ({ requests }) => (
    <div data-testid="mock-pending-requests">
      Pending Count: {requests.length}
    </div>
  )
}));

vi.mock('../../components/friends/ActiveFriendsGrid/ActiveFriendsGrid', () => ({
  default: ({ friends }) => (
    <div data-testid="mock-active-grid">
      Active Count: {friends.length}
    </div>
  )
}));

describe('FriendsListPage Orchestration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const appRouteConfig = [
    {
      path: '/friends',
      Component: FriendsListPage
    }
  ];

  test('displays structural synchronizing message while the backend network model hydrates', () => {
    mockUseFriendsData.mockReturnValue({
      friends: [],
      requests: [],
      loading: true,
      processRequest: vi.fn()
    });

    renderWithRouter(null, {
      route: '/friends',
      customRoutes: appRouteConfig
    });

    expect(screen.getByText('Synchronizing network models...')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-friend-search')).not.toBeInTheDocument();
  });

  test('composes sub-view components correctly side-by-side once data loading concludes', async () => {
    mockUseFriendsData.mockReturnValue({
      friends: [{ id: 'f1', username: 'thor' }],
      requests: [{ id: 'r1', sender: { username: 'loki' } }],
      loading: false,
      processRequest: vi.fn()
    });

    renderWithRouter(null, {
      route: '/friends',
      customRoutes: appRouteConfig
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-friend-search')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pending-requests')).toHaveTextContent('Pending Count: 1');
    expect(screen.getByTestId('mock-active-grid')).toHaveTextContent('Active Count: 1');
    expect(screen.queryByText('Synchronizing network models...')).not.toBeInTheDocument();
  });
});
