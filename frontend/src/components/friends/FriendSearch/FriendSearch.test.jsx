import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import * as searchHookModule from '../../../hooks/useUserSearch/useUserSearch';
import FriendSearch from './FriendSearch';

// Mock react-router's navigate function cleanly
const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock CSS Modules to isolate presentational class binders
vi.mock('./FriendSearch.module.css', () => ({
  default: {
    searchHeader: 'mock-search-header',
    searchInput: 'mock-search-input',
    navLink: 'mock-nav-link',
    suggestionsDropdown: 'mock-dropdown',
    statusMsg: 'mock-status',
    noResultsMsg: 'mock-no-results',
    suggestionRow: 'mock-row',
    name: 'mock-name',
    handle: 'mock-handle',
  },
}));

describe('FriendSearch Hook-Driven Component Layout Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
  });

  test('renders initial input state cleanly with no dropdown visibility', () => {
    // Inject custom mock behavior matching empty hook initialization values
    vi.spyOn(searchHookModule, 'useUserSearch').mockReturnValue({
      suggestions: [],
      isSearching: false
    });

    const { container } = render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/search global users by username\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    
    const dropdownEl = container.querySelector('.mock-dropdown');
    expect(dropdownEl).not.toBeInTheDocument();
  });

  test('displays searching status message text while the hook executes a network check', () => {
    vi.spyOn(searchHookModule, 'useUserSearch').mockReturnValue({
      suggestions: [],
      isSearching: true
    });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'zeus' } });

    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.queryByText('No results - User does not exist')).not.toBeInTheDocument();
  });

  test('renders multiple matching profile suggestion rows returned by the hook', () => {
    const mockSuggestions = [
      { id: 'u1', username: 'alice_dev', displayName: 'Alice Builder', avatarUrl: 'a.png' },
      { id: 'u2', username: 'alex_code', displayName: '', avatarUrl: 'b.png' }
    ];

    vi.spyOn(searchHookModule, 'useUserSearch').mockReturnValue({
      suggestions: mockSuggestions,
      isSearching: false
    });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'al' } });

    // Verify row 1 captures display name preference
    expect(screen.getByText('Alice Builder')).toBeInTheDocument();
    expect(screen.getByText('@alice_dev')).toBeInTheDocument();

    // Verify row 2 falls back gracefully to standard username formatting rules
    expect(screen.getByText('alex_code')).toBeInTheDocument();
    expect(screen.getByText('@alex_code')).toBeInTheDocument();
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });

  test('asserts exact explicit requirement text fallback warning alert if search queries yield empty outputs', () => {
    vi.spyOn(searchHookModule, 'useUserSearch').mockReturnValue({
      suggestions: [],
      isSearching: false
    });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'ghost_user' } });

    expect(screen.getByText('No results - User does not exist')).toBeInTheDocument();
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });

  test('dispatches standard profile history redirections cleanly when clicking a suggestion node row', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [{ id: 'u1', username: 'zeus_sky', displayName: 'Zeus' }];

    vi.spyOn(searchHookModule, 'useUserSearch').mockReturnValue({
      suggestions: mockSuggestions,
      isSearching: false
    });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'zeus' } });

    const targetRow = screen.getByText('@zeus_sky');
    await user.click(targetRow);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/profile/zeus_sky');
  });
});
