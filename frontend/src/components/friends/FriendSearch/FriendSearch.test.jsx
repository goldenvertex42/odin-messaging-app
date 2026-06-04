import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import FriendSearch from './FriendSearch';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('lodash', () => ({
  default: {
    debounce: (fn) => {
      const flusher = (...args) => fn(...args);
      flusher.cancel = vi.fn();
      return flusher;
    }
  }
}));

const nativeTimeout = window.setTimeout;
const mockTimeout = (callback, ms) => {
  return nativeTimeout(callback, ms === 300 ? 0 : ms);
};

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

describe('FriendSearch Asynchronous Clean Real-Timer Suite', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.setTimeout = mockTimeout;
    localStorage.setItem('token', 'mock-valid-jwt');
    mockNavigate.mockClear();
  });

  afterEach(() => {
    window.setTimeout = nativeTimeout;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('renders initial input state cleanly with no dropdown visibility', () => {
    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/search global users by username\.\.\./i)).toBeInTheDocument();
  });

  test('displays searching loader status text while debounce timer evaluates', async () => {
    fetch.mockReturnValueOnce(new Promise(() => {}));

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'zeus' } });

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  test('renders matching profile result row after debounce timeout resolves successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u_9', username: 'zeus_sky', displayName: 'Zeus Bolt' }),
    });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'zeus' } });

    const handleText = await screen.findByText('@zeus_sky');
    expect(handleText).toBeInTheDocument();
    expect(screen.getByText('Zeus Bolt')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/users/profile/zeus', expect.any(Object));
  });

  test('asserts exact explicit string text fallback warning alert if network fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'ghost_user' } });

    const errorAlert = await screen.findByText('No results - User does not exist');
    expect(errorAlert).toBeInTheDocument();
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });

  test('dispatches history redirections cleanly when user clicks a matching returned row node', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u_9', username: 'zeus_sky', displayName: 'Zeus Bolt' }),
    });

    render(
      <MemoryRouter>
        <FriendSearch />
      </MemoryRouter>
    );

    const inputEl = screen.getByPlaceholderText(/search global users by username\.\.\./i);
    fireEvent.change(inputEl, { target: { value: 'zeus' } });

    const targetRow = await screen.findByText('@zeus_sky');
    await user.click(targetRow);

    expect(mockNavigate).toHaveBeenCalledWith('/profile/zeus_sky');
  });
});
