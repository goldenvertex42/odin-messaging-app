import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

// 1. DYNAMIC STATE MOCKS: Track hook feedback variables globally inside this file
let mockConversationsData = [];
let mockLoadingState = false;

// 2. CRITICAL MONOREPO MOCK HOOK OVERRIDE:
// Completely intercept useConversations so it behaves exactly like a pure presentational state
vi.mock('../../../hooks/useConversations/useConversations', () => ({
  useConversations: () => ({
    conversations: mockConversationsData,
    loading: mockLoadingState,
    error: null,
    refreshConversations: vi.fn(),
    startConversation: vi.fn(),
    createGroupChat: vi.fn()
  })
}));

describe('Sidebar Component - Production Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    
    // Reset our dynamic hook state variables before each test case runs
    mockConversationsData = [];
    mockLoadingState = false;
  });

  const mockConversations = [
    {
      id: 'chat-uuid-1',
      isGroup: false,
      participants: [
        { user: { id: 'current-user', displayName: 'Odin Dev' } },
        { user: { id: 'other-user-1', displayName: 'Thor' } }
      ],
      messages: [{ content: 'Hey there!' }]
    }
  ];

  // 1. TEST LOADING STATE
  it('should render a loading indicator while fetching conversation collections', () => {
    mockLoadingState = true; // Toggle our global mock hook state tracker

    render(<Sidebar currentUserId="current-user" onSelectChat={vi.fn()} />);
    
    expect(screen.getByTestId('sidebar-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-container')).not.toBeInTheDocument();
  });

  // 2. TEST DOM HYDRATION
  it('should display names and direct messaging previews correctly when data loads', () => {
    mockLoadingState = false;
    mockConversationsData = mockConversations;

    render(<Sidebar currentUserId="current-user" onSelectChat={vi.fn()} />);

    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(screen.getByText('Hey there!')).toBeInTheDocument();
  });

  it('should show the most recent message preview when multiple messages exist', () => {
    mockLoadingState = false;
    mockConversationsData = [
      {
        ...mockConversations[0],
        messages: [
          { content: 'Old message', createdAt: '2026-01-01T10:00:00.000Z' },
          { content: 'Newest message', createdAt: '2026-01-01T12:00:00.000Z' }
        ]
      }
    ];

    render(<Sidebar currentUserId="current-user" onSelectChat={vi.fn()} />);

    expect(screen.getByText('Newest message')).toBeInTheDocument();
    expect(screen.queryByText('Old message')).not.toBeInTheDocument();
  });

  // 3. TEST CLICK ACTION CALLS
  it('should dispatch onSelectChat callbacks when user clicks a specific thread node row', async () => {
    const user = userEvent.setup();
    const mockSelectCallback = vi.fn();
    
    mockLoadingState = false;
    mockConversationsData = mockConversations;

    render(<Sidebar currentUserId="current-user" onSelectChat={mockSelectCallback} />);
    
    const clickTarget = screen.getByText('Thor');
    await user.click(clickTarget);

    expect(mockSelectCallback).toHaveBeenCalledTimes(1);
    // Verifies it correctly passes down the singular chat index node object!
    expect(mockSelectCallback).toHaveBeenCalledWith(mockConversations[0]);
  });
});
