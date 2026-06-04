import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ActiveFriendsGrid from './ActiveFriendsGrid';

// Mock the react-router navigation layer hook to assert on redirection calls
const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock CSS Modules to cleanly isolate presentational layout classes
vi.mock('./ActiveFriendGrid.module.css', () => ({
  default: {
    mainList: 'mock-main-list',
    empty: 'mock-empty',
    grid: 'mock-grid',
    friendCard: 'mock-card'
  }
}));

describe('ActiveFriendsGrid Presentational & Interaction Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
  });

  const mockFriends = [
    {
      id: 'friend-1',
      username: 'odin_code',
      displayName: 'Odin Allfather',
      avatarUrl: 'https://dicebear.com'
    },
    {
      id: 'friend-2',
      username: 'heimdall_watch',
      displayName: '', // Intentional empty string fallback test case
      avatarUrl: 'https://dicebear.com'
    }
  ];

  test('renders empty placeholder information when the friends dataset array is empty', () => {
    render(
      <MemoryRouter>
        <ActiveFriendsGrid friends={[]} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Your Friends (0)');
    expect(screen.getByText('Your friends list is empty.')).toBeInTheDocument();
  });

  test('renders user identity metrics correctly matching available list length states', () => {
    render(
      <MemoryRouter>
        <ActiveFriendsGrid friends={mockFriends} />
      </MemoryRouter>
    );

    // Verifies dynamic title counter evaluates correctly
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Your Friends (2)');
    expect(screen.queryByText('Your friends list is empty.')).not.toBeInTheDocument();

    // Card 1: Verifies preferred displayName renders prominently
    expect(screen.getByRole('heading', { level: 4, name: 'Odin Allfather' })).toBeInTheDocument();
    expect(screen.getByText('@odin_code')).toBeInTheDocument();

    // Card 2: Verifies structural username fallback layout assertion
    expect(screen.getByRole('heading', { level: 4, name: 'heimdall_watch' })).toBeInTheDocument();
    expect(screen.getByText('@heimdall_watch')).toBeInTheDocument();
  });

  test('dispatches history history actions when user clicks an individual companion card element', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ActiveFriendsGrid friends={mockFriends} />
      </MemoryRouter>
    );

    // Locate card action block target item row
    const cardNode = screen.getByText('Odin Allfather');
    await user.click(cardNode);

    // Assert that clicking triggers router dispatch sequence to specific profile pathway targets
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/profile/odin_code');
  });
});
